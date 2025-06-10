/**
 * Sign Up Screen
 * Handles user registration with email/password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUp } = useAuth();
  const { theme } = useTheme();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, username } = formData;
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !username.trim()) {
      return 'All fields are required';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    return null;
  };

  const handleSignUp = async () => {
    const error = validateForm();
    if (error) {
      console.log('Validation error:', error);
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email.trim(), formData.password, {
        username: formData.username.trim(),
        displayName: formData.displayName.trim() || formData.username.trim(),
      });
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={theme.colors.gradient}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.logoText, { color: theme.colors.primary }]}>
                RiseUp
              </Text>
            </View>
            <Text style={[styles.tagline, { color: theme.colors.background }]}>
              Join the Community
            </Text>
          </View>

          {/* Sign Up Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sign up to get started
            </Text>

            <InputField
              placeholder="Username"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              leftIcon="person-outline"
            />

            <InputField
              placeholder="Display Name (Optional)"
              value={formData.displayName}
              onChangeText={(value) => handleInputChange('displayName', value)}
              leftIcon="text-outline"
            />

            <InputField
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <InputField
              placeholder="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <InputField
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              style={styles.signUpButton}
            />

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={[styles.signInText, { color: theme.colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.signInLink, { color: theme.colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  signUpButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInText: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignUpScreen;