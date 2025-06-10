/**
 * Chat List Screen
 * Displays list of active conversations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';

const ChatListScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      try {
        const chatList = [];
        
        for (const docSnap of snapshot.docs) {
          const chatData = { id: docSnap.id, ...docSnap.data() };
          
          // Get other participant's data
          const otherUserId = chatData.participants.find(id => id !== user.uid);
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              chatData.otherUser = userDoc.data();
            }
          }
          
          chatList.push(chatData);
        }
        
        setChats(chatList);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [user]);

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

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('Chat', {
        chatId: item.id,
        userId: item.otherUser?.uid,
        userName: item.otherUser?.displayName || item.otherUser?.username
      })}
    >
      <Avatar
        uri={item.otherUser?.avatar}
        size={50}
        name={item.otherUser?.displayName || item.otherUser?.username}
      />
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {item.otherUser?.displayName || item.otherUser?.username || 'Unknown User'}
          </Text>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>
        
        <Text 
          style={[styles.lastMessage, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.unreadCount, { color: theme.colors.background }]}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="chatbubbles-outline" 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Messages Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Start a conversation by visiting someone's profile
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={[styles.exploreButtonText, { color: theme.colors.background }]}>
          Find People
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={chats.length === 0 ? styles.emptyList : null}
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
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
});

export default ChatListScreen;