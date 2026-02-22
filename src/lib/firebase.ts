import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Use demo configuration for development if no environment variables are set
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo-app-id",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development only if environment variables indicate they should be used
if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true') {
  // Only connect to emulators if not already connected
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // Emulator already connected or not available
    console.log('Auth emulator connection skipped:', error);
  }
  
  // Check if Firestore emulator is not already connected
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulator already connected or not available
    console.log('Firestore emulator connection skipped:', error);
  }
  
  // Check if Storage emulator is not already connected
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Emulator already connected or not available
    console.log('Storage emulator connection skipped:', error);
  }
}

// Add global error handler for Firebase permission errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.code === 'permission-denied' || 
        event.reason?.message?.includes('Missing or insufficient permissions')) {
      console.warn('Firebase permission error caught and handled:', event.reason);
      event.preventDefault(); // Prevent the error from being logged to console
    }
  });
}

export default app;