// Simple local authentication for development
// This simulates Firebase auth without requiring actual Firebase setup

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

export interface UserProfile {
  personalMetrics: {
    height?: number;
    weight?: number;
    age?: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
    fitnessGoals: string[];
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

const USERS_KEY = 'fitness-app-users';
const CURRENT_USER_KEY = 'fitness-app-current-user';

// Simple user storage
const getStoredUsers = (): Record<string, { password: string; user: User; profile?: UserProfile }> => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveStoredUsers = (users: Record<string, { password: string; user: User; profile?: UserProfile }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Auth functions
export const createUserWithEmailAndPassword = async (email: string, password: string, displayName?: string): Promise<User> => {
  const users = getStoredUsers();
  
  if (users[email]) {
    throw new Error('User already exists');
  }

  const user: User = {
    uid: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    email,
    displayName: displayName || null,
    emailVerified: true, // Simulate verified for demo
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
  };

  const defaultProfile: UserProfile = {
    personalMetrics: {
      gender: 'other',
      activityLevel: 'moderately_active',
      fitnessGoals: [],
    },
    preferences: {
      units: 'metric',
      theme: 'system',
      notifications: true,
    },
  };

  users[email] = { password, user, profile: defaultProfile };
  saveStoredUsers(users);
  setCurrentUser(user);

  return user;
};

export const signInWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
  const users = getStoredUsers();
  const userData = users[email];

  if (!userData || userData.password !== password) {
    throw new Error('Invalid email or password');
  }

  // Update last sign in time
  userData.user.metadata.lastSignInTime = new Date().toISOString();
  users[email] = userData;
  saveStoredUsers(users);
  setCurrentUser(userData.user);

  return userData.user;
};

export const signOut = async (): Promise<void> => {
  setCurrentUser(null);
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const users = getStoredUsers();
  if (!users[email]) {
    throw new Error('User not found');
  }
  // Simulate sending email (just log for demo)
  console.log(`Password reset email sent to ${email}`);
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  // Initial call
  callback(getCurrentUser());

  // Listen for storage changes (for multi-tab support)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === CURRENT_USER_KEY) {
      callback(getCurrentUser());
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// Profile management
export const getUserProfile = (userId: string): UserProfile | null => {
  const users = getStoredUsers();
  const userEntry = Object.values(users).find(u => u.user.uid === userId);
  return userEntry?.profile || null;
};

export const updateUserProfile = (userId: string, profile: Partial<UserProfile>): void => {
  const users = getStoredUsers();
  const userEmail = Object.keys(users).find(email => users[email].user.uid === userId);
  
  if (userEmail && users[userEmail]) {
    users[userEmail].profile = {
      ...users[userEmail].profile,
      ...profile,
      personalMetrics: {
        ...users[userEmail].profile?.personalMetrics,
        ...profile.personalMetrics,
      },
      preferences: {
        ...users[userEmail].profile?.preferences,
        ...profile.preferences,
      },
    };
    saveStoredUsers(users);
  }
};