/**
 * Button Component
 * Reusable button with consistent styling and loading state
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  loading = false, 
  disabled = false,
  variant = 'primary' 
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    };

    if (variant === 'secondary') {
      baseStyle.backgroundColor = theme.colors.surface;
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = theme.colors.border;
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = {
      fontSize: 16,
      fontWeight: '600',
      color: variant === 'primary' ? theme.colors.background : theme.colors.text,
    };

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? theme.colors.background : theme.colors.primary} 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;