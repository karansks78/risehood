/**
 * Avatar Component
 * Displays user profile pictures with fallback to initials
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Avatar = ({ uri, size = 40, name = '', style }) => {
  const { theme } = useTheme();

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[avatarStyle, style]}
        defaultSource={require('../assets/default-avatar.png')}
      />
    );
  }

  return (
    <View
      style={[
        avatarStyle,
        {
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: theme.colors.background,
            fontSize: size * 0.4,
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  initials: {
    fontWeight: 'bold',
  },
});

export default Avatar;