import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  personalMetrics: PersonalMetrics;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalMetrics {
  height: number; // in cm
  weight: number; // in kg
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoals: string[];
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  workoutReminders: boolean;
  progressUpdates: boolean;
  socialUpdates: boolean;
  systemUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  shareProgress: boolean;
  shareWorkouts: boolean;
}

export interface AuthContextType {
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

export interface AuthError {
  code: string;
  message: string;
}