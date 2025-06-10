/**
 * Forgot Password Screen
 * Handles password reset via email
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { resetPassword } = useAuth();
  const { theme } = useTheme();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {!sent ? (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              style={styles.resetButton}
            />
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Check Your Email
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              We've sent a password reset link to {email}
            </Text>

            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={styles.resetButton}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  resetButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;