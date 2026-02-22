/**
 * AI Performance Nutrition & Training Engine - Profile Completion Tracking
 * Tracks profile completion status and provides user-friendly guidance
 */

import { 
  UserProfileExtended, 
  ProfileFieldCategory, 
  ProfileFieldMetadata, 
  ProfileCompletionStatus 
} from '@/types/nutrition';

/**
 * Field metadata configuration
 */
const FIELD_METADATA: ProfileFieldMetadata[] = [
  // Basic Metrics (Priority 1-5)
  {
    field: 'height',
    category: ProfileFieldCategory.BASIC_METRICS,
    required: true,
    displayName: 'Height',
    description: 'Your height in centimeters',
    priority: 1
  },
  {
    field: 'weight',
    category: ProfileFieldCategory.BASIC_METRICS,
    required: true,
    displayName: 'Weight',
    description: 'Your current weight in kilograms',
    priority: 2
  },
  {
    field: 'age',
    category: ProfileFieldCategory.BASIC_METRICS,
    required: true,
    displayName: 'Age',
    description: 'Your age in years',
    priority: 3
  },
  {
    field: 'gender',
    category: ProfileFieldCategory.BASIC_METRICS,
    required: true,
    displayName: 'Gender',
    description: 'Your biological gender for metabolic calculations',
    priority: 4
  },
  {
    field: 'body_fat_percentage',
    category: ProfileFieldCategory.BASIC_METRICS,
    required: false,
    displayName: 'Body Fat Percentage',
    description: 'Your body fat percentage (optional, improves accuracy)',
    priority: 5
  },
  
  // Activity & Goals (Priority 6-7)
  {
    field: 'activity_level',
    category: ProfileFieldCategory.ACTIVITY_GOALS,
    required: true,
    displayName: 'Activity Level',
    description: 'Your daily activity level outside of workouts',
    priority: 6
  },
  {
    field: 'goal',
    category: ProfileFieldCategory.ACTIVITY_GOALS,
    required: true,
    displayName: 'Fitness Goal',
    description: 'Your primary fitness goal',
    priority: 7
  },
  
  // Training (Priority 8-9)
  {
    field: 'training_level',
    category: ProfileFieldCategory.TRAINING,
    required: true,
    displayName: 'Training Experience',
    description: 'Your training experience level',
    priority: 8
  },
  {
    field: 'workout_days_per_week',
    category: ProfileFieldCategory.TRAINING,
    required: true,
    displayName: 'Workout Days Per Week',
    description: 'How many days per week you can train',
    priority: 9
  },
  
  // Preferences (Priority 10-15)
  {
    field: 'diet_type',
    category: ProfileFieldCategory.PREFERENCES,
    required: true,
    displayName: 'Diet Type',
    description: 'Your dietary preference or restriction',
    priority: 10
  },
  {
    field: 'meals_per_day',
    category: ProfileFieldCategory.PREFERENCES,
    required: true,
    displayName: 'Meals Per Day',
    description: 'How many main meals you prefer per day',
    priority: 11
  },
  {
    field: 'snacks_per_day',
    category: ProfileFieldCategory.PREFERENCES,
    required: true,
    displayName: 'Snacks Per Day',
    description: 'How many snacks you prefer per day',
    priority: 12
  },
  {
    field: 'cooking_time',
    category: ProfileFieldCategory.PREFERENCES,
    required: true,
    displayName: 'Cooking Time',
    description: 'How much time you can spend cooking',
    priority: 13
  },
  {
    field: 'cuisine_preference',
    category: ProfileFieldCategory.PREFERENCES,
    required: true,
    displayName: 'Cuisine Preferences',
    description: 'Your preferred cuisine types',
    priority: 14
  },
  {
    field: 'budget_level',
    category: ProfileFieldCategory.PREFERENCES,
    required: true,
    displayName: 'Budget Level',
    description: 'Your food budget level',
    priority: 15
  },
  
  // Subscription (Priority 16-17)
  {
    field: 'subscription_tier',
    category: ProfileFieldCategory.SUBSCRIPTION,
    required: true,
    displayName: 'Subscription Tier',
    description: 'Your subscription level',
    priority: 16
  },
  {
    field: 'plan_duration_weeks',
    category: ProfileFieldCategory.SUBSCRIPTION,
    required: true,
    displayName: 'Plan Duration',
    description: 'How many weeks you want your plan to last',
    priority: 17
  }
];

/**
 * Get metadata for a specific field
 */
export function getFieldMetadata(field: keyof UserProfileExtended): ProfileFieldMetadata | undefined {
  return FIELD_METADATA.find(meta => meta.field === field);
}

/**
 * Get all field metadata
 */
export function getAllFieldMetadata(): ProfileFieldMetadata[] {
  return [...FIELD_METADATA];
}

/**
 * Get field metadata by category
 */
export function getFieldMetadataByCategory(category: ProfileFieldCategory): ProfileFieldMetadata[] {
  return FIELD_METADATA.filter(meta => meta.category === category);
}

/**
 * Check if a field is complete (has a valid value)
 */
function isFieldComplete(profile: Partial<UserProfileExtended>, field: keyof UserProfileExtended): boolean {
  const value = profile[field];
  
  // Check if value exists
  if (value === undefined || value === null) {
    return false;
  }
  
  // Special handling for arrays (cuisine_preference)
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  // Special handling for strings
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  // For numbers and other types, just check existence
  return true;
}

/**
 * Calculate profile completion status
 */
export function calculateProfileCompletion(
  profile: Partial<UserProfileExtended>
): ProfileCompletionStatus {
  const completedFields: ProfileFieldMetadata[] = [];
  const missingRequiredFields: ProfileFieldMetadata[] = [];
  const missingOptionalFields: ProfileFieldMetadata[] = [];
  
  // Track completion by category
  const completedByCategory: Record<ProfileFieldCategory, number> = {
    [ProfileFieldCategory.BASIC_METRICS]: 0,
    [ProfileFieldCategory.ACTIVITY_GOALS]: 0,
    [ProfileFieldCategory.PREFERENCES]: 0,
    [ProfileFieldCategory.TRAINING]: 0,
    [ProfileFieldCategory.SUBSCRIPTION]: 0
  };
  
  const totalByCategory: Record<ProfileFieldCategory, number> = {
    [ProfileFieldCategory.BASIC_METRICS]: 0,
    [ProfileFieldCategory.ACTIVITY_GOALS]: 0,
    [ProfileFieldCategory.PREFERENCES]: 0,
    [ProfileFieldCategory.TRAINING]: 0,
    [ProfileFieldCategory.SUBSCRIPTION]: 0
  };
  
  // Analyze each field
  for (const metadata of FIELD_METADATA) {
    totalByCategory[metadata.category]++;
    
    if (isFieldComplete(profile, metadata.field)) {
      completedFields.push(metadata);
      completedByCategory[metadata.category]++;
    } else {
      if (metadata.required) {
        missingRequiredFields.push(metadata);
      } else {
        missingOptionalFields.push(metadata);
      }
    }
  }
  
  // Calculate category completion percentages
  const categoryCompletionPercentage: Record<ProfileFieldCategory, number> = {
    [ProfileFieldCategory.BASIC_METRICS]: 0,
    [ProfileFieldCategory.ACTIVITY_GOALS]: 0,
    [ProfileFieldCategory.PREFERENCES]: 0,
    [ProfileFieldCategory.TRAINING]: 0,
    [ProfileFieldCategory.SUBSCRIPTION]: 0
  };
  
  for (const category of Object.values(ProfileFieldCategory)) {
    const total = totalByCategory[category];
    const completed = completedByCategory[category];
    categoryCompletionPercentage[category] = total > 0 ? Math.round((completed / total) * 100) : 0;
  }
  
  // Calculate overall completion
  const totalFields = FIELD_METADATA.length;
  const completedFieldsCount = completedFields.length;
  const completionPercentage = Math.round((completedFieldsCount / totalFields) * 100);
  const isComplete = missingRequiredFields.length === 0;
  
  // Get next recommended fields (top 3 missing required fields by priority)
  const nextRecommendedFields = missingRequiredFields
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
  
  // Generate user-friendly message
  const userFriendlyMessage = generateUserFriendlyMessage(
    isComplete,
    completionPercentage,
    missingRequiredFields,
    nextRecommendedFields
  );
  
  return {
    isComplete,
    completionPercentage,
    totalFields,
    completedFields: completedFieldsCount,
    missingRequiredFields,
    missingOptionalFields,
    completedFieldsByCategory: completedByCategory,
    totalFieldsByCategory: totalByCategory,
    categoryCompletionPercentage,
    nextRecommendedFields,
    userFriendlyMessage
  };
}

/**
 * Generate user-friendly message based on completion status
 */
function generateUserFriendlyMessage(
  isComplete: boolean,
  completionPercentage: number,
  missingRequiredFields: ProfileFieldMetadata[],
  nextRecommendedFields: ProfileFieldMetadata[]
): string {
  if (isComplete) {
    return 'Your profile is complete! You can now generate your personalized transformation plan.';
  }
  
  const missingCount = missingRequiredFields.length;
  
  if (completionPercentage === 0) {
    return 'Let\'s get started! Begin by adding your basic information like height, weight, and age.';
  }
  
  if (completionPercentage < 25) {
    return `Great start! You're ${completionPercentage}% complete. Next, add your ${nextRecommendedFields[0]?.displayName.toLowerCase()}.`;
  }
  
  if (completionPercentage < 50) {
    return `You're making progress! ${completionPercentage}% complete. ${missingCount} required field${missingCount > 1 ? 's' : ''} remaining.`;
  }
  
  if (completionPercentage < 75) {
    return `Almost halfway there! ${completionPercentage}% complete. Keep going to unlock your personalized plan.`;
  }
  
  if (completionPercentage < 90) {
    return `You're doing great! ${completionPercentage}% complete. Just ${missingCount} more field${missingCount > 1 ? 's' : ''} to go.`;
  }
  
  // 90-99%
  return `Almost done! Only ${missingCount} required field${missingCount > 1 ? 's' : ''} left: ${nextRecommendedFields.map(f => f.displayName).join(', ')}.`;
}

/**
 * Get missing required fields as a simple list
 */
export function getMissingRequiredFields(profile: Partial<UserProfileExtended>): string[] {
  const status = calculateProfileCompletion(profile);
  return status.missingRequiredFields.map(meta => meta.field);
}

/**
 * Check if profile is ready for plan generation
 */
export function isProfileReadyForPlanGeneration(profile: Partial<UserProfileExtended>): boolean {
  const status = calculateProfileCompletion(profile);
  return status.isComplete;
}

/**
 * Get completion status for a specific category
 */
export function getCategoryCompletionStatus(
  profile: Partial<UserProfileExtended>,
  category: ProfileFieldCategory
): {
  completed: number;
  total: number;
  percentage: number;
  missingFields: ProfileFieldMetadata[];
} {
  const categoryFields = getFieldMetadataByCategory(category);
  const completed = categoryFields.filter(meta => isFieldComplete(profile, meta.field));
  const missing = categoryFields.filter(meta => !isFieldComplete(profile, meta.field));
  
  return {
    completed: completed.length,
    total: categoryFields.length,
    percentage: Math.round((completed.length / categoryFields.length) * 100),
    missingFields: missing
  };
}
