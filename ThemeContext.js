/**
 * Theme Context Provider
 * Manages app-wide theme state and styling
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme definitions
const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#6366f1',
    secondary: '#ec4899',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f8fafc',
    card: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    gradient: ['#6366f1', '#ec4899', '#06b6d4'],
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20
    },
    small: {
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 16
    }
  }
};

const darkTheme = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    ...lightTheme.colors,
    background: '#111827',
    surface: '#1f2937',
    card: '#374151',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    border: '#4b5563',
    shadow: 'rgba(0, 0, 0, 0.3)'
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};