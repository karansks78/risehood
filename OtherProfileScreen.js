/**
 * Other User Profile Screen
 * Displays another user's profile with follow/unfollow functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Loader from '../components/Loader';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

const OtherProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserPosts();
      checkFollowStatus();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(postsQuery);
      const userPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const followDoc = await getDoc(doc(db, 'users', user.uid, 'following', userId));
      setIsFollowing(followDoc.exists());
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(doc(db, 'users', user.uid, 'following', userId));
        await deleteDoc(doc(db, 'users', userId, 'followers', user.uid));
        
        // Update counts
        await updateDoc(doc(db, 'users', user.uid), {
          followingCount: increment(-1)
        });
        await updateDoc(doc(db, 'users', userId), {
          followersCount: increment(-1)
        });
        
        setIsFollowing(false);
      } else {
        // Follow
        await setDoc(doc(db, 'users', user.uid, 'following', userId), {
          createdAt: new Date()
        });
        await setDoc(doc(db, 'users', userId, 'followers', user.uid), {
          createdAt: new Date()
        });
        
        // Update counts
        await updateDoc(doc(db, 'users', user.uid), {
          followingCount: increment(1)
        });
        await updateDoc(doc(db, 'users', userId), {
          followersCount: increment(1)
        });
        
        setIsFollowing(true);
      }
      
      // Reload profile to get updated counts
      await loadUserProfile();
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      // Create or find existing chat
      const chatId = [user.uid, userId].sort().join('_');
      
      // Check if chat exists
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      
      if (!chatDoc.exists()) {
        // Create new chat
        await setDoc(doc(db, 'chats', chatId), {
          participants: [user.uid, userId],
          createdAt: new Date(),
          lastMessage: '',
          lastMessageAt: new Date(),
          unreadCount: 0
        });
      }
      
      navigation.navigate('Chat', {
        chatId,
        userId,
        userName: userProfile?.displayName || userProfile?.username
      });
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate('Comments', { postId: item.id })}
    >
      <Image source={{ uri: item.mediaURL }} style={styles.postImage} />
      {item.mediaType === 'video' && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {userProfile?.postsCount || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          Posts
        </Text>
      </View>

      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {userProfile?.followersCount || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          Followers
        </Text>
      </View>

      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {userProfile?.followingCount || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          Following
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <Loader />;
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          User not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Avatar
            uri={userProfile?.avatar}
            size={80}
            name={userProfile?.displayName || userProfile?.username}
          />
          
          <View style={styles.userDetails}>
            <Text style={[styles.displayName, { color: theme.colors.text }]}>
              {userProfile?.displayName || userProfile?.username || 'User'}
            </Text>
            <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
              @{userProfile?.username || 'username'}
            </Text>
            {userProfile?.bio && (
              <Text style={[styles.bio, { color: theme.colors.text }]}>
                {userProfile.bio}
              </Text>
            )}
          </View>
        </View>

        {renderStats()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title={isFollowing ? 'Unfollow' : 'Follow'}
            onPress={handleFollow}
            loading={followLoading}
            style={[
              styles.followButton,
              { backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary }
            ]}
            textStyle={{ color: isFollowing ? theme.colors.text : theme.colors.background }}
          />
          
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleMessage}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts Grid */}
      <View style={styles.postsGrid}>
        {posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyPosts}>
            <Ionicons 
              name="camera-outline" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No posts yet
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
  },
  header: {
    padding: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    flex: 1,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsGrid: {
    padding: 16,
  },
  postItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPosts: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default OtherProfileScreen;