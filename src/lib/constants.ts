// Application constants

export const APP_NAME = 'AI-Powered Fitness App';
export const APP_DESCRIPTION =
  'Your personal AI fitness trainer with real-time form correction, personalized diet plans, and intelligent workout guidance.';

// API endpoints (to be configured later)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Firebase configuration keys (to be set in environment variables)
export const FIREBASE_CONFIG_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

// Exercise categories
export const EXERCISE_CATEGORIES = [
  'strength',
  'cardio',
  'flexibility',
  'balance',
  'sports',
  'rehabilitation',
] as const;

// Muscle groups
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'core',
  'legs',
  'glutes',
  'full-body',
] as const;

// Equipment types
export const EQUIPMENT_TYPES = [
  'none',
  'dumbbells',
  'barbell',
  'resistance-bands',
  'kettlebell',
  'pull-up-bar',
  'bench',
  'mat',
] as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

// Activity levels
export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;

// Diet plan types
export const DIET_PLAN_TYPES = [
  'weight_loss',
  'muscle_gain',
  'maintenance',
  'endurance',
] as const;

// Dietary restrictions
export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'low-carb',
  'keto',
  'paleo',
] as const;

// Theme options
export const THEME_OPTIONS = ['light', 'dark', 'auto'] as const;

// Unit systems
export const UNIT_SYSTEMS = ['metric', 'imperial'] as const;

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'fitness-app-user-preferences',
  THEME: 'fitness-app-theme',
  WORKOUT_DRAFT: 'fitness-app-workout-draft',
  SEARCH_HISTORY: 'fitness-app-search-history',
} as const;
