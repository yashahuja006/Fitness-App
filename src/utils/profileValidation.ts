/**
 * AI Performance Nutrition & Training Engine - Profile Validation
 * Comprehensive validation for UserProfileExtended
 */

import { UserProfileExtended, ValidationResult, ValidationError } from '@/types/nutrition';

/**
 * Validates a UserProfileExtended object
 * Ensures all physical metrics, activity levels, goals, and preferences are within acceptable ranges
 */
export function validateUserProfile(profile: UserProfileExtended): ValidationResult {
  const errors: string[] = [];

  // Physical metrics validation
  validatePhysicalMetrics(profile, errors);
  
  // Activity and goals validation
  validateActivityAndGoals(profile, errors);
  
  // Preferences validation
  validatePreferences(profile, errors);
  
  // Training validation
  validateTraining(profile, errors);
  
  // Subscription validation
  validateSubscription(profile, errors);

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates physical metrics (height, weight, age, body fat percentage)
 */
function validatePhysicalMetrics(profile: UserProfileExtended, errors: string[]): void {
  // Height validation (100-250 cm)
  if (profile.height < 100 || profile.height > 250) {
    errors.push('Height must be between 100-250 cm');
  }
  
  // Weight validation (30-300 kg)
  if (profile.weight < 30 || profile.weight > 300) {
    errors.push('Weight must be between 30-300 kg');
  }
  
  // Age validation (13-100 years)
  if (profile.age < 13 || profile.age > 100) {
    errors.push('Age must be between 13-100 years');
  }
  
  // Body fat percentage validation (optional, 3-50%)
  if (profile.body_fat_percentage !== undefined) {
    if (profile.body_fat_percentage < 3 || profile.body_fat_percentage > 50) {
      errors.push('Body fat percentage must be between 3-50%');
    }
  }
  
  // Gender validation
  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(profile.gender)) {
    errors.push('Gender must be one of: male, female, other');
  }
}

/**
 * Validates activity level and goals
 */
function validateActivityAndGoals(profile: UserProfileExtended, errors: string[]): void {
  // Activity level validation
  const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  if (!validActivityLevels.includes(profile.activity_level)) {
    errors.push('Activity level must be one of: sedentary, light, moderate, active, very_active');
  }
  
  // Goal validation
  const validGoals = ['fat_loss', 'muscle_gain', 'recomposition', 'endurance'];
  if (!validGoals.includes(profile.goal)) {
    errors.push('Goal must be one of: fat_loss, muscle_gain, recomposition, endurance');
  }
}

/**
 * Validates user preferences
 */
function validatePreferences(profile: UserProfileExtended, errors: string[]): void {
  // Diet type validation
  const validDietTypes = ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'];
  if (!validDietTypes.includes(profile.diet_type)) {
    errors.push('Diet type must be one of: standard, vegetarian, vegan, keto, paleo, mediterranean');
  }
  
  // Meals per day validation (3-6)
  const validMealsPerDay = [3, 4, 5, 6];
  if (!validMealsPerDay.includes(profile.meals_per_day)) {
    errors.push('Meals per day must be 3, 4, 5, or 6');
  }
  
  // Snacks per day validation (0-3)
  const validSnacksPerDay = [0, 1, 2, 3];
  if (!validSnacksPerDay.includes(profile.snacks_per_day)) {
    errors.push('Snacks per day must be 0, 1, 2, or 3');
  }
  
  // Cooking time validation
  const validCookingTimes = ['quick', 'moderate', 'elaborate'];
  if (!validCookingTimes.includes(profile.cooking_time)) {
    errors.push('Cooking time must be one of: quick, moderate, elaborate');
  }
  
  // Cuisine preference validation (must be an array)
  if (!Array.isArray(profile.cuisine_preference)) {
    errors.push('Cuisine preference must be an array');
  }
  
  // Budget level validation
  const validBudgetLevels = ['low', 'medium', 'high'];
  if (!validBudgetLevels.includes(profile.budget_level)) {
    errors.push('Budget level must be one of: low, medium, high');
  }
}

/**
 * Validates training-related fields
 */
function validateTraining(profile: UserProfileExtended, errors: string[]): void {
  // Training level validation
  const validTrainingLevels = ['beginner', 'intermediate', 'advanced'];
  if (!validTrainingLevels.includes(profile.training_level)) {
    errors.push('Training level must be one of: beginner, intermediate, advanced');
  }
  
  // Workout days per week validation (1-7)
  if (profile.workout_days_per_week < 1 || profile.workout_days_per_week > 7) {
    errors.push('Workout days per week must be between 1-7');
  }
}

/**
 * Validates subscription-related fields
 */
function validateSubscription(profile: UserProfileExtended, errors: string[]): void {
  // Subscription tier validation
  const validTiers = ['free', 'pro'];
  if (!validTiers.includes(profile.subscription_tier)) {
    errors.push('Subscription tier must be one of: free, pro');
  }
  
  // Plan duration validation (4-12 weeks typical)
  if (profile.plan_duration_weeks < 1 || profile.plan_duration_weeks > 52) {
    errors.push('Plan duration must be between 1-52 weeks');
  }
}

/**
 * Validates a single field of the user profile
 * Useful for real-time validation in forms
 */
export function validateField(
  field: keyof UserProfileExtended,
  value: unknown
): ValidationError | null {
  switch (field) {
    case 'height':
      if (typeof value === 'number' && (value < 100 || value > 250)) {
        return { field, message: 'Height must be between 100-250 cm', value };
      }
      break;
      
    case 'weight':
      if (typeof value === 'number' && (value < 30 || value > 300)) {
        return { field, message: 'Weight must be between 30-300 kg', value };
      }
      break;
      
    case 'age':
      if (typeof value === 'number' && (value < 13 || value > 100)) {
        return { field, message: 'Age must be between 13-100 years', value };
      }
      break;
      
    case 'body_fat_percentage':
      if (value !== undefined && typeof value === 'number' && (value < 3 || value > 50)) {
        return { field, message: 'Body fat percentage must be between 3-50%', value };
      }
      break;
      
    case 'workout_days_per_week':
      if (typeof value === 'number' && (value < 1 || value > 7)) {
        return { field, message: 'Workout days per week must be between 1-7', value };
      }
      break;
      
    case 'plan_duration_weeks':
      if (typeof value === 'number' && (value < 1 || value > 52)) {
        return { field, message: 'Plan duration must be between 1-52 weeks', value };
      }
      break;
  }

  return null;
}

/**
 * Checks if a profile is complete (all required fields present)
 */
export function isProfileComplete(profile: Partial<UserProfileExtended>): boolean {
  const requiredFields: (keyof UserProfileExtended)[] = [
    'height',
    'weight',
    'age',
    'gender',
    'activity_level',
    'goal',
    'diet_type',
    'meals_per_day',
    'snacks_per_day',
    'cooking_time',
    'cuisine_preference',
    'budget_level',
    'training_level',
    'workout_days_per_week',
    'subscription_tier',
    'plan_duration_weeks'
  ];

  return requiredFields.every(field => profile[field] !== undefined && profile[field] !== null);
}
