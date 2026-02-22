'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// User profile interface based on design document
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  personalMetrics: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    fitnessGoals: string[];
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      workoutReminders: boolean;
      progressUpdates: boolean;
      socialUpdates: boolean;
      systemUpdates: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      shareProgress: boolean;
      shareWorkouts: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  createUserProfile: (user: User, additionalData?: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create default user profile
  const createDefaultProfile = (user: User): UserProfile => ({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || undefined,
    personalMetrics: {
      height: 0,
      weight: 0,
      age: 0,
      gender: 'other',
      activityLevel: 'moderate',
      fitnessGoals: [],
    },
    preferences: {
      units: 'metric',
      theme: 'auto',
      notifications: {
        workoutReminders: true,
        progressUpdates: true,
        socialUpdates: false,
        systemUpdates: true,
      },
      privacy: {
        profileVisibility: 'private',
        shareProgress: false,
        shareWorkouts: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Load user profile from Firestore
  const loadUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>) => {
    try {
      const defaultProfile = createDefaultProfile(user);
      const profileData = { ...defaultProfile, ...additionalData };
      
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date(),
      });

      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, { displayName });
      
      // Create user profile in Firestore
      await createUserProfile(user, { displayName });
      
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    // In development mode without proper Firebase config, skip auth state changes
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      if (user) {
        setUser(user);
        
        // Load user profile
        const profile = await loadUserProfile(user);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Create profile if it doesn't exist
          await createUserProfile(user);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logout,
    resetPassword,
    updateUserProfile,
    createUserProfile,
  }), [user, userProfile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};