/**
 * AI Performance Nutrition & Training Engine - Type Definitions
 * Extended user profile and nutrition-related types
 */

/**
 * Extended user profile for AI nutrition and training engine
 * Includes comprehensive metrics for personalized plan generation
 */
export interface UserProfileExtended {
  // Basic metrics
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'male' | 'female' | 'other';
  body_fat_percentage?: number; // optional, 3-50%
  
  // Activity & Goals
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance';
  
  // Preferences
  diet_type: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  meals_per_day: 3 | 4 | 5 | 6;
  snacks_per_day: 0 | 1 | 2 | 3;
  cooking_time: 'quick' | 'moderate' | 'elaborate';
  cuisine_preference: string[];
  budget_level: 'low' | 'medium' | 'high';
  
  // Training
  training_level: 'beginner' | 'intermediate' | 'advanced';
  workout_days_per_week: number; // 1-7
  
  // Subscription
  subscription_tier: 'free' | 'pro';
  plan_duration_weeks: number; // typically 4-12 weeks
}

/**
 * Validation result for user profile
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation error with field-specific information
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Profile field category for progressive building
 */
export enum ProfileFieldCategory {
  BASIC_METRICS = 'basic_metrics',
  ACTIVITY_GOALS = 'activity_goals',
  PREFERENCES = 'preferences',
  TRAINING = 'training',
  SUBSCRIPTION = 'subscription'
}

/**
 * Profile field metadata
 */
export interface ProfileFieldMetadata {
  field: keyof UserProfileExtended;
  category: ProfileFieldCategory;
  required: boolean;
  displayName: string;
  description: string;
  priority: number;
}

/**
 * Profile completion status
 */
export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  totalFields: number;
  completedFields: number;
  missingRequiredFields: ProfileFieldMetadata[];
  missingOptionalFields: ProfileFieldMetadata[];
  completedFieldsByCategory: Record<ProfileFieldCategory, number>;
  totalFieldsByCategory: Record<ProfileFieldCategory, number>;
  categoryCompletionPercentage: Record<ProfileFieldCategory, number>;
  nextRecommendedFields: ProfileFieldMetadata[];
  userFriendlyMessage: string;
}
