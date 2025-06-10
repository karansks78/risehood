/**
 * Profile Screen
 * Displays current user's profile with posts, stats, and settings
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
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
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

const ProfileScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const { user, userProfile, logout } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  const loadUserPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', user.uid),
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
      <TouchableOpacity style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {userProfile?.postsCount || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          Posts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {userProfile?.followersCount || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          Followers
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
          {userProfile?.followingCount || 0}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          Following
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'posts' && { borderBottomColor: theme.colors.primary }
        ]}
        onPress={() => setActiveTab('posts')}
      >
        <Ionicons 
          name="grid-outline" 
          size={20} 
          color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textSecondary} 
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'tagged' && { borderBottomColor: theme.colors.primary }
        ]}
        onPress={() => setActiveTab('tagged')}
      >
        <Ionicons 
          name="person-outline" 
          size={20} 
          color={activeTab === 'tagged' ? theme.colors.primary : theme.colors.textSecondary} 
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <Loader />;
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
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            style={[styles.editButton, { backgroundColor: theme.colors.surface }]}
            textStyle={{ color: theme.colors.text }}
          />
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Posts Grid */}
      {activeTab === 'posts' && (
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
              <TouchableOpacity
                style={[styles.createPostButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Create')}
              >
                <Text style={[styles.createPostText, { color: theme.colors.background }]}>
                  Create Your First Post
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Tagged Posts (Placeholder) */}
      {activeTab === 'tagged' && (
        <View style={styles.emptyPosts}>
          <Ionicons 
            name="person-outline" 
            size={48} 
            color={theme.colors.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No tagged posts
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  editButton: {
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
    marginBottom: 16,
  },
  createPostButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createPostText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;