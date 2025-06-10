/**
 * Comments Screen
 * Displays post comments with real-time updates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';

const CommentsScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user, userProfile } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const postData = { id: postDoc.id, ...postDoc.data() };
        
        // Get user data for the post
        const userDoc = await getDoc(doc(db, 'users', postData.userId));
        if (userDoc.exists()) {
          postData.user = userDoc.data();
        }
        
        setPost(postData);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = () => {
    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      try {
        const commentsList = [];
        
        for (const docSnap of snapshot.docs) {
          const commentData = { id: docSnap.id, ...docSnap.data() };
          
          // Get user data for each comment
          const userDoc = await getDoc(doc(db, 'users', commentData.userId));
          if (userDoc.exists()) {
            commentData.user = userDoc.data();
          }
          
          commentsList.push(commentData);
        }
        
        setComments(commentsList);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    });

    return unsubscribe;
  };

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const commentData = {
        userId: user.uid,
        text: newComment.trim(),
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      
      // Update post comment count
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1)
      });

      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
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

  const renderComment = ({ item }) => (
    <View style={[styles.commentItem, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        onPress={() => {
          if (item.userId !== user.uid) {
            navigation.navigate('OtherProfile', { userId: item.userId });
          }
        }}
      >
        <Avatar
          uri={item.user?.avatar}
          size={32}
          name={item.user?.displayName || item.user?.username}
        />
      </TouchableOpacity>
      
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            onPress={() => {
              if (item.userId !== user.uid) {
                navigation.navigate('OtherProfile', { userId: item.userId });
              }
            }}
          >
            <Text style={[styles.commentUsername, { color: theme.colors.text }]}>
              {item.user?.displayName || item.user?.username || 'Unknown User'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        
        <Text style={[styles.commentText, { color: theme.colors.text }]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    post ? (
      <PostCard
        post={post}
        showCommentButton={false}
        onUserPress={() => {
          if (post.userId !== user.uid) {
            navigation.navigate('OtherProfile', { userId: post.userId });
          } else {
            navigation.navigate('Profile');
          }
        }}
      />
    ) : null
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { 
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border 
      }]}>
        <Avatar
          uri={userProfile?.avatar}
          size={32}
          name={userProfile?.displayName || userProfile?.username}
        />
        
        <TextInput
          style={[styles.commentInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          placeholder="Add a comment..."
          placeholderTextColor={theme.colors.textSecondary}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.border 
          }]}
          onPress={submitComment}
          disabled={!newComment.trim() || submitting}
        >
          <Ionicons 
            name="send" 
            size={16} 
            color={newComment.trim() ? theme.colors.background : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentsScreen;