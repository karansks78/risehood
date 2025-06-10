/**
 * Wallet Screen
 * Displays user's coin balance, transactions, and earning milestones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import Loader from '../components/Loader';

const WalletScreen = () => {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [rewardThreshold, setRewardThreshold] = useState(5000);
  const [loading, setLoading] = useState(true);

  const { user, userProfile } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!user) return;

    // Load wallet data and transactions
    loadWalletData();
    loadRewardSettings();
    
    // Listen to transactions
    const transactionsQuery = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionList);
    });

    return unsubscribe;
  }, [user]);

  const loadWalletData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setWalletData(userData.wallet || { balance: 0, transactions: [] });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRewardSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'rewardRule'));
      if (settingsDoc.exists()) {
        setRewardThreshold(settingsDoc.data().followerThreshold || 5000);
      }
    } catch (error) {
      console.error('Error loading reward settings:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'reward':
        return 'gift-outline';
      case 'withdrawal':
        return 'arrow-up-outline';
      case 'bonus':
        return 'star-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'reward':
      case 'bonus':
        return theme.colors.success;
      case 'withdrawal':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionItem, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
        <Ionicons 
          name={getTransactionIcon(item.type)} 
          size={20} 
          color={getTransactionColor(item.type)} 
        />
      </View>
      
      <View style={styles.transactionContent}>
        <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
          {item.description || 'Transaction'}
        </Text>
        <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      <Text style={[
        styles.transactionAmount,
        { color: item.amount > 0 ? theme.colors.success : theme.colors.error }
      ]}>
        {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  const handleRequestPayout = () => {
    // Placeholder for payout request
    console.log('Request payout functionality would be implemented here');
  };

  if (loading) {
    return <Loader />;
  }

  const progressToReward = userProfile?.followersCount || 0;
  const progressPercentage = Math.min((progressToReward / rewardThreshold) * 100, 100);
  const remainingFollowers = Math.max(rewardThreshold - progressToReward, 0);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Balance Card */}
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <Text style={[styles.balanceLabel, { color: theme.colors.background }]}>
            Total Balance
          </Text>
          <Ionicons name="wallet" size={24} color={theme.colors.background} />
        </View>
        
        <Text style={[styles.balanceAmount, { color: theme.colors.background }]}>
          {formatCurrency(walletData?.balance || 0)}
        </Text>
        
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.background + '20' }]}
            onPress={handleRequestPayout}
          >
            <Ionicons name="arrow-up" size={16} color={theme.colors.background} />
            <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
              Request Payout
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Reward Progress */}
      <View style={[styles.rewardCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.rewardHeader}>
          <Text style={[styles.rewardTitle, { color: theme.colors.text }]}>
            Earning Progress
          </Text>
          <Ionicons name="trophy-outline" size={20} color={theme.colors.primary} />
        </View>
        
        <Text style={[styles.rewardDescription, { color: theme.colors.textSecondary }]}>
          Reach {rewardThreshold.toLocaleString()} followers to earn rewards
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: theme.colors.primary,
                  width: `${progressPercentage}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.text }]}>
            {progressToReward.toLocaleString()} / {rewardThreshold.toLocaleString()}
          </Text>
        </View>
        
        {remainingFollowers > 0 && (
          <Text style={[styles.remainingText, { color: theme.colors.textSecondary }]}>
            {remainingFollowers.toLocaleString()} more followers to go!
          </Text>
        )}
      </View>

      {/* Transaction History */}
      <View style={styles.transactionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Transactions
        </Text>
        
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyTransactions}>
            <Ionicons 
              name="receipt-outline" 
              size={48} 
              color={theme.colors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No transactions yet
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
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  rewardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  remainingText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  transactionsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default WalletScreen;