/**
 * Root Stack Navigator
 * Handles authentication flow and main app navigation
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';

// Main App Navigation
import BottomTabs from './BottomTabs';

// Other Screens
import CommentsScreen from '../screens/CommentsScreen';
import OtherProfileScreen from '../screens/OtherProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatScreen from '../screens/ChatScreen';

// Components
import Loader from '../components/Loader';

const Stack = createStackNavigator();

const RootStack = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return <Loader />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen}
            options={{ title: 'Reset Password' }}
          />
          <Stack.Screen 
            name="PhoneAuth" 
            component={PhoneAuthScreen}
            options={{ title: 'Phone Verification' }}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={BottomTabs} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Comments" 
            component={CommentsScreen}
            options={{ title: 'Comments' }}
          />
          <Stack.Screen 
            name="OtherProfile" 
            component={OtherProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ title: 'Search' }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={({ route }) => ({ 
              title: route.params?.userName || 'Chat' 
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootStack;