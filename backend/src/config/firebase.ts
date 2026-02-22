import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // In production, use service account key file or environment variables
  // For development, you can use the Firebase emulator or service account
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // Fallback for development - uses default credentials
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

export const auth = getAuth();
export const db = getFirestore();

export default admin;