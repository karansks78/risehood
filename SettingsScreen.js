/**
 * Settings Screen
 * App settings, security options, and account management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const { userProfile, logout, updateProfile } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    userProfile?.settings?.twoFactorEnabled || false
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.settings?.notifications !== false
  );

  const handleTwoFactorToggle = async (value) => {
    try {
      setTwoFactorEnabled(value);
      await updateProfile({
        settings: {
          ...userProfile?.settings,
          twoFactorEnabled: value
        }
      });
    } catch (error) {
      console.error('Error updating 2FA setting:', error);
      setTwoFactorEnabled(!value); // Revert on error
    }
  };

  const handleNotificationsToggle = async (value) => {
    try {
      setNotificationsEnabled(value);
      await updateProfile({
        settings: {
          ...userProfile?.settings,
          notifications: value
        }
      });
    } catch (error) {
      console.error('Error updating notifications setting:', error);
      setNotificationsEnabled(!value); // Revert on error
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call a Cloud Function to delete all user data
            console.log('Delete account functionality would be implemented here');
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: logout }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme.colors.textSecondary} 
            style={styles.arrow}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account
        </Text>
        
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your profile information"
          onPress={() => navigation.navigate('EditProfile')}
        />
        
        <SettingItem
          icon="shield-checkmark-outline"
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security"
          rightComponent={
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleTwoFactorToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          }
          showArrow={false}
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Preferences
        </Text>
        
        <SettingItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Switch between light and dark theme"
          rightComponent={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          }
          showArrow={false}
        />
        
        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage your notification preferences"
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.background}
            />
          }
          showArrow={false}
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Support
        </Text>
        
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="Get help and support"
          onPress={() => console.log('Help Center')}
        />
        
        <SettingItem
          icon="document-text-outline"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={() => console.log('Privacy Policy')}
        />
        
        <SettingItem
          icon="document-outline"
          title="Terms of Service"
          subtitle="Read our terms of service"
          onPress={() => console.log('Terms of Service')}
        />
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <SettingItem
          icon="log-out-outline"
          title="Sign Out"
          subtitle="Sign out of your account"
          onPress={handleLogout}
        />
        
        <SettingItem
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={handleDeleteAccount}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>
          RiseUp v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
  },
  appVersion: {
    fontSize: 14,
  },
});

export default SettingsScreen;