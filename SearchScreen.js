/**
 * Search Screen
 * Search for users and discover new content
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  startAt,
  endAt
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery.trim());
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('followersCount', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(usersQuery);
      const usersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(userData => userData.uid !== user.uid); // Exclude current user

      setSuggestedUsers(usersList);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    try {
      setLoading(true);
      
      // Search by username
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '>=', query.toLowerCase()),
        where('username', '<=', query.toLowerCase() + '\uf8ff'),
        limit(10)
      );

      // Search by display name
      const displayNameQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', query),
        where('displayName', '<=', query + '\uf8ff'),
        limit(10)
      );

      const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(displayNameQuery)
      ]);

      const usernameResults = usernameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const displayNameResults = displayNameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combine and deduplicate results
      const allResults = [...usernameResults, ...displayNameResults];
      const uniqueResults = allResults.filter((user, index, self) => 
        index === self.findIndex(u => u.uid === user.uid) && user.uid !== user.uid
      );

      setUsers(uniqueResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('OtherProfile', { userId: item.uid })}
    >
      <Avatar
        uri={item.avatar}
        size={50}
        name={item.displayName || item.username}
      />
      
      <View style={styles.userInfo}>
        <Text style={[styles.displayName, { color: theme.colors.text }]}>
          {item.displayName || item.username}
        </Text>
        <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
          @{item.username}
        </Text>
        {item.bio && (
          <Text 
            style={[styles.bio, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.bio}
          </Text>
        )}
      </View>
      
      <View style={styles.userStats}>
        <Text style={[styles.followersCount, { color: theme.colors.text }]}>
          {item.followersCount || 0}
        </Text>
        <Text style={[styles.followersLabel, { color: theme.colors.textSecondary }]}>
          followers
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="search-outline" 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {searchQuery ? 'No users found' : 'Discover People'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {searchQuery 
          ? 'Try searching with a different username or name'
          : 'Search for users by username or name'
        }
      </Text>
    </View>
  );

  const displayUsers = searchQuery.trim() ? users : suggestedUsers;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={theme.colors.textSecondary} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Section Title */}
      {!searchQuery && (
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Suggested for you
        </Text>
      )}

      {/* Users List */}
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={displayUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={displayUsers.length === 0 ? styles.emptyList : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
  },
  userStats: {
    alignItems: 'center',
  },
  followersCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  followersLabel: {
    fontSize: 12,
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
    lineHeight: 24,
  },
});

export default SearchScreen;