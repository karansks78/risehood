/**
 * RiseUp Social Media App - Main Entry Point
 * Luxury social media app with Instagram-like features
 * Built with React Native, Expo, and Firebase
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import RootStack from './navigation/RootStack';
import { initializeFirebase } from './firebase';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firebase
        await initializeFirebase();
        
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true); // Still allow app to load
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null; // Could add a splash screen component here
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootStack />
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}