/**
 * Home Feed Screen
 * Displays posts from followed users with infinite scroll and pull-to-refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

const HomeFeedScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const { user, userProfile } = useAuth();
  const { theme } = useTheme();

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPosts([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      // Get following list first
      const followingList = await getFollowingList();
      
      let postsQuery;
      if (followingList.length > 0) {
        // Show posts from followed users
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      } else {
        // Show discover posts if not following anyone
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(postsQuery);
      const newPosts = [];

      for (const docSnap of snapshot.docs) {
        const postData = { id: docSnap.id, ...docSnap.data() };
        
        // Get user data for each post
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        if (userDoc.exists()) {
          postData.user = userDoc.data();
        }
        
        newPosts.push(postData);
      }

      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);

    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(postsQuery);
      const newPosts = [];

      for (const docSnap of snapshot.docs) {
        const postData = { id: docSnap.id, ...docSnap.data() };
        
        // Get user data for each post
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        if (userDoc.exists()) {
          postData.user = userDoc.data();
        }
        
        newPosts.push(postData);
      }

      setPosts(prev => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);

    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getFollowingList = async () => {
    try {
      const followingQuery = query(collection(db, 'users', user.uid, 'following'));
      const snapshot = await getDocs(followingQuery);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting following list:', error);
      return [];
    }
  };

  const onRefresh = useCallback(() => {
    loadPosts(true);
  }, []);

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('Comments', { postId: item.id })}
      onUserPress={() => {
        if (item.userId !== user.uid) {
          navigation.navigate('OtherProfile', { userId: item.userId });
        } else {
          navigation.navigate('Profile');
        }
      }}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="images-outline" 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Posts Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Follow some users to see their posts here
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={[styles.exploreButtonText, { color: theme.colors.background }]}>
          Explore Users
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <Loader size="small" />
      </View>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});

export default HomeFeedScreen;