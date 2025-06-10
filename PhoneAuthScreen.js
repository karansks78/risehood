/**
 * Phone Authentication Screen
 * Handles phone number verification with OTP
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

const PhoneAuthScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const { signInWithPhone } = useAuth();
  const { theme } = useTheme();

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd send the verification code here
      // For now, this is a placeholder
      console.log('Sending verification code to:', phoneNumber);
      setCodeSent(true);
    } catch (error) {
      console.error('Send code error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      return;
    }

    setLoading(true);
    try {
      await signInWithPhone(phoneNumber, verificationCode);
    } catch (error) {
      console.error('Verify code error:', error);
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
        {!codeSent ? (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Phone Verification
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter your phone number to receive a verification code
            </Text>

            <InputField
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <Button
              title="Send Code"
              onPress={handleSendCode}
              style={styles.actionButton}
            />
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Enter Verification Code
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              We've sent a 6-digit code to {phoneNumber}
            </Text>

            <InputField
              placeholder="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              leftIcon="keypad-outline"
              maxLength={6}
            />

            <Button
              title="Verify Code"
              onPress={handleVerifyCode}
              style={styles.actionButton}
            />

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendCode}
            >
              <Text style={[styles.resendButtonText, { color: theme.colors.primary }]}>
                Resend Code
              </Text>
            </TouchableOpacity>
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
  actionButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PhoneAuthScreen;