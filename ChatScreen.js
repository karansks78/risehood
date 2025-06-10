/**
 * Chat Screen
 * Real-time 1-to-1 messaging with typing indicators
 */

import React, { useState, useEffect, useRef } from 'react';
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
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';

const ChatScreen = ({ route }) => {
  const { chatId, userId, userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  const { user, userProfile } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  const loadMessages = () => {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: userProfile?.displayName || userProfile?.username,
        senderAvatar: userProfile?.avatar || '',
        createdAt: serverTimestamp(),
        seen: false
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
        lastMessageSender: user.uid
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.senderId === user.uid;
    const showAvatar = !isOwnMessage && (
      index === messages.length - 1 || 
      messages[index + 1]?.senderId !== item.senderId
    );

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {showAvatar && (
          <Avatar
            uri={item.senderAvatar}
            size={32}
            name={item.senderName}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage 
            ? [styles.ownMessageBubble, { backgroundColor: theme.colors.primary }]
            : [styles.otherMessageBubble, { backgroundColor: theme.colors.surface }],
          !showAvatar && !isOwnMessage && styles.messageWithoutAvatar
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? theme.colors.background : theme.colors.text }
          ]}>
            {item.text}
          </Text>
          
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? theme.colors.background + '80' : theme.colors.textSecondary }
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={[styles.typingIndicator, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
            {userName} is typing...
          </Text>
        </View>
      )}

      {/* Message Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border 
      }]}>
        <TextInput
          style={[styles.messageInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: newMessage.trim() ? theme.colors.primary : theme.colors.border 
          }]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons 
            name="send" 
            size={16} 
            color={newMessage.trim() ? theme.colors.background : theme.colors.textSecondary} 
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
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
    marginLeft: 8,
  },
  messageWithoutAvatar: {
    marginLeft: 40,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  typingIndicator: {
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;