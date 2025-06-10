/**
 * Login Screen
 * Handles email/password and social authentication
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Loader from '../../components/Loader';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // In a real app, you'd implement Google Sign-In here
      // For now, this is a placeholder
      console.log('Google login would be implemented here');
    } catch (error) {
      console.error('Google login error:', error);
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
              Connect. Share. Rise Together.
            </Text>
          </View>

          {/* Login Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sign in to continue
            </Text>

            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <InputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              style={styles.loginButton}
            />

            {/* Social Login */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
                or continue with
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, { borderColor: theme.colors.border }]}
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={20} color={theme.colors.text} />
              <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('PhoneAuth')}
            >
              <Ionicons name="call-outline" size={20} color={theme.colors.text} />
              <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
                Continue with Phone
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: theme.colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={[styles.signUpLink, { color: theme.colors.primary }]}>
                  Sign Up
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;