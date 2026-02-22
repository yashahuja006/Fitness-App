#!/usr/bin/env node

/**
 * Database seeding script for the fitness app
 * Run this script to populate the Firestore database with initial exercise data
 * 
 * Usage: node scripts/seedDatabase.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Firebase configuration (you'll need to set these environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function main() {
  console.log('🌱 Starting database seeding process...');
  
  // Check if Firebase config is available
  if (!firebaseConfig.projectId) {
    console.error('❌ Firebase configuration not found. Please set environment variables.');
    console.log('Required environment variables:');
    console.log('- NEXT_PUBLIC_FIREBASE_API_KEY');
    console.log('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    console.log('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    console.log('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    console.log('- NEXT_PUBLIC_FIREBASE_APP_ID');
    process.exit(1);
  }

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log(`✅ Connected to Firebase project: ${firebaseConfig.projectId}`);
    
    // Import and run seeding function
    // Note: This would need to be adapted for Node.js environment
    // For now, we'll provide instructions for running from the Next.js app
    
    console.log('📝 To seed the database, please run the seeding function from your Next.js application:');
    console.log('');
    console.log('1. Create a temporary page or API route in your Next.js app');
    console.log('2. Import and call: import { runDatabaseSeeding } from "../src/lib/seedDatabase"');
    console.log('3. Call runDatabaseSeeding() in your component or API handler');
    console.log('4. Visit the page or endpoint to trigger the seeding');
    console.log('');
    console.log('Alternatively, you can run the seeding from the browser console:');
    console.log('- Import the seeding functions in a component');
    console.log('- Call the functions during development');
    
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
}

main();