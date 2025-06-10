/**
 * Authentication Context Provider
 * Manages user authentication state and Firebase Auth operations
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          await loadUserProfile(firebaseUser.uid);
        } else {
          setUser(null);
          setUserProfile(null);
          await AsyncStorage.removeItem('userToken');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        username: userData.username,
        displayName: userData.displayName || userData.username,
        bio: userData.bio || '',
        avatar: userData.avatar || '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        wallet: {
          balance: 0,
          transactions: []
        },
        settings: {
          twoFactorEnabled: false,
          notifications: true,
          privacy: 'public'
        },
        createdAt: new Date(),
        lastActive: new Date()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      Toast.show({
        type: 'success',
        text1: 'Account Created',
        text2: 'Please check your email for verification'
      });

      return firebaseUser;
    } catch (error) {
      console.error('Sign up error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: error.message
      });
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last active
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastActive: new Date()
      });

      await AsyncStorage.setItem('userToken', firebaseUser.uid);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: 'Successfully signed in'
      });

      return firebaseUser;
    } catch (error) {
      console.error('Sign in error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: error.message
      });
      throw error;
    }
  };

  const signInWithGoogle = async (googleCredential) => {
    try {
      const credential = GoogleAuthProvider.credential(googleCredential);
      const { user: firebaseUser } = await signInWithCredential(auth, credential);
      
      // Check if user profile exists, create if not
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        const userProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.email.split('@')[0],
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          bio: '',
          avatar: firebaseUser.photoURL || '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          wallet: {
            balance: 0,
            transactions: []
          },
          settings: {
            twoFactorEnabled: false,
            notifications: true,
            privacy: 'public'
          },
          createdAt: new Date(),
          lastActive: new Date()
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      } else {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastActive: new Date()
        });
      }

      await AsyncStorage.setItem('userToken', firebaseUser.uid);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Successfully signed in with Google'
      });

      return firebaseUser;
    } catch (error) {
      console.error('Google sign in error:', error);
      Toast.show({
        type: 'error',
        text1: 'Google Sign In Failed',
        text2: error.message
      });
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber, verificationCode) => {
    try {
      const credential = PhoneAuthProvider.credential(phoneNumber, verificationCode);
      const { user: firebaseUser } = await signInWithCredential(auth, credential);
      
      // Similar profile creation logic as Google sign in
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        const userProfile = {
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber,
          username: `user_${firebaseUser.uid.substring(0, 8)}`,
          displayName: `User ${firebaseUser.uid.substring(0, 8)}`,
          bio: '',
          avatar: '',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          wallet: {
            balance: 0,
            transactions: []
          },
          settings: {
            twoFactorEnabled: false,
            notifications: true,
            privacy: 'public'
          },
          createdAt: new Date(),
          lastActive: new Date()
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      }

      await AsyncStorage.setItem('userToken', firebaseUser.uid);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Successfully signed in with phone'
      });

      return firebaseUser;
    } catch (error) {
      console.error('Phone sign in error:', error);
      Toast.show({
        type: 'error',
        text1: 'Phone Sign In Failed',
        text2: error.message
      });
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      Toast.show({
        type: 'success',
        text1: 'Password Reset',
        text2: 'Check your email for reset instructions'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.message
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'See you later!'
      });
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: error.message
      });
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          ...updates,
          updatedAt: new Date()
        });
        await loadUserProfile(user.uid);
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your changes have been saved'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message
      });
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    resetPassword,
    logout,
    updateProfile,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};