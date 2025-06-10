/**
 * Input Field Component
 * Reusable text input with consistent styling and icons
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  error,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: error ? theme.colors.error : theme.colors.border,
        }
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={theme.colors.textSecondary} 
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            { 
              color: theme.colors.text,
              flex: 1,
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default InputField;