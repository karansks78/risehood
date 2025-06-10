/**
 * Post Card Component
 * Displays individual posts with like, comment, and share functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';

const { width } = Dimensions.get('window');

const PostCard = ({ 
  post, 
  onPress, 
  onUserPress, 
  showCommentButton = true 
}) => {
  const [isLiked, setIsLiked] = useState(
    post.likes?.includes(useAuth().user?.uid) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [liking, setLiking] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();

  // Animation values
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(0);

  const handleLike = async () => {
    if (liking) return;

    setLiking(true);
    const newLikedState = !isLiked;
    
    // Optimistic UI update
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    // Animate heart
    if (newLikedState) {
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0, { duration: 1000 })
      );
      heartScale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    }

    try {
      const postRef = doc(db, 'posts', post.id);
      
      if (newLikedState) {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
    } finally {
      setLiking(false);
    }
  };

  const handleDoublePress = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onUserPress}>
          <Avatar
            uri={post.user?.avatar}
            size={40}
            name={post.user?.displayName || post.user?.username}
          />
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: theme.colors.text }]}>
              {post.user?.displayName || post.user?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
              {formatTime(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      <View style={styles.mediaContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleDoublePress}
        >
          {post.mediaType === 'video' ? (
            <Video
              source={{ uri: post.mediaURL }}
              style={styles.media}
              useNativeControls
              resizeMode="cover"
              shouldPlay={false}
            />
          ) : (
            <Image source={{ uri: post.mediaURL }} style={styles.media} />
          )}
        </TouchableOpacity>

        {/* Animated Heart */}
        <Animated.View style={[styles.animatedHeart, animatedHeartStyle]}>
          <Ionicons name="heart" size={80} color={theme.colors.error} />
        </Animated.View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? theme.colors.error : theme.colors.text} 
            />
          </TouchableOpacity>

          {showCommentButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPress}
            >
              <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      {likesCount > 0 && (
        <Text style={[styles.likesCount, { color: theme.colors.text }]}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: theme.colors.text }]}>
            <Text style={styles.captionUsername}>
              {post.user?.username || 'user'}{' '}
            </Text>
            {post.caption}
          </Text>
        </View>
      )}

      {/* Comments Count */}
      {showCommentButton && post.commentCount > 0 && (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.commentsCount, { color: theme.colors.textSecondary }]}>
            View all {post.commentCount} comments
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: width,
    height: width,
  },
  animatedHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    pointerEvents: 'none',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  commentsCount: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});

export default PostCard;