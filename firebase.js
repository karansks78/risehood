/**
 * Firebase Configuration and Initialization
 * Handles all Firebase services: Auth, Firestore, Storage, Functions
 */

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let functions;

export const initializeFirebase = async () => {
  try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    
    // Initialize other services
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    
    // Connect to emulators in development (optional)
    if (__DEV__) {
      // Uncomment these lines if using Firebase emulators
      // connectFirestoreEmulator(db, 'localhost', 8080);
      // connectStorageEmulator(storage, 'localhost', 9199);
      // connectFunctionsEmulator(functions, 'localhost', 5001);
    }
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

export { auth, db, storage, functions };
export default app;