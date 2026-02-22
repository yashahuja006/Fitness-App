'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

// Simple User interface for local auth
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  personalMetrics: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
    fitnessGoals: string[];
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Local storage keys
const USERS_KEY = 'fitness-app-users';
const CURRENT_USER_KEY = 'fitness-app-current-user';
const PROFILES_KEY = 'fitness-app-profiles';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper functions for local storage
  const getStoredUsers = (): Record<string, { password: string; user: User }> => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveStoredUsers = (users: Record<string, { password: string; user: User }>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const setCurrentUser = (user: User | null) => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const getStoredProfiles = (): Record<string, UserProfile> => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      Object.keys(parsed).forEach(key => {
        parsed[key].createdAt = new Date(parsed[key].createdAt);
        parsed[key].updatedAt = new Date(parsed[key].updatedAt);
      });
      return parsed;
    } catch {
      return {};
    }
  };

  const saveStoredProfiles = (profiles: Record<string, UserProfile>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  };

  // Create default user profile
  const createDefaultProfile = (user: User): UserProfile => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    personalMetrics: {
      height: 0,
      weight: 0,
      age: 0,
      gender: 'other',
      activityLevel: 'moderately_active',
      fitnessGoals: [],
    },
    preferences: {
      units: 'metric',
      theme: 'system',
      notifications: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    const users = getStoredUsers();
    
    if (users[email]) {
      throw new Error('User already exists');
    }

    const user: User = {
      uid: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      email,
      displayName,
      emailVerified: true,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    };

    // Save user
    users[email] = { password, user };
    saveStoredUsers(users);

    // Create and save profile
    const profile = createDefaultProfile(user);
    const profiles = getStoredProfiles();
    profiles[user.uid] = profile;
    saveStoredProfiles(profiles);

    // Set current user
    setCurrentUser(user);
    setUser(user);
    setUserProfile(profile);

    return user;
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    const users = getStoredUsers();
    const userData = users[email];

    if (!userData || userData.password !== password) {
      throw new Error('Invalid email or password');
    }

    // Update last sign in time
    userData.user.metadata.lastSignInTime = new Date().toISOString();
    users[email] = userData;
    saveStoredUsers(users);

    // Load profile
    const profiles = getStoredProfiles();
    const profile = profiles[userData.user.uid];

    setCurrentUser(userData.user);
    setUser(userData.user);
    setUserProfile(profile || createDefaultProfile(userData.user));

    return userData.user;
  };

  // Sign out
  const logout = async (): Promise<void> => {
    setCurrentUser(null);
    setUser(null);
    setUserProfile(null);
  };

  // Reset password (just simulate for demo)
  const resetPassword = async (email: string): Promise<void> => {
    const users = getStoredUsers();
    if (!users[email]) {
      throw new Error('User not found');
    }
    // In a real app, this would send an email
    console.log(`Password reset email sent to ${email}`);
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    const updatedProfile = {
      ...userProfile,
      ...updates,
      personalMetrics: {
        ...userProfile.personalMetrics,
        ...updates.personalMetrics,
      },
      preferences: {
        ...userProfile.preferences,
        ...updates.preferences,
      },
      updatedAt: new Date(),
    };

    const profiles = getStoredProfiles();
    profiles[user.uid] = updatedProfile;
    saveStoredProfiles(profiles);

    setUserProfile(updatedProfile);
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Load profile
        const profiles = getStoredProfiles();
        const profile = profiles[currentUser.uid];
        setUserProfile(profile || createDefaultProfile(currentUser));
      }
      setLoading(false);
    };

    initAuth();
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
  }), [user, userProfile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};