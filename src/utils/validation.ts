import { UserProfile, PersonalMetrics, UserPreferences } from '@/types/auth';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates personal metrics data
 */
export const validatePersonalMetrics = (metrics: Partial<PersonalMetrics>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Height validation
  if (metrics.height !== undefined) {
    if (metrics.height <= 0) {
      errors.push({ field: 'height', message: 'Height must be greater than 0' });
    } else if (metrics.height < 50 || metrics.height > 300) {
      errors.push({ field: 'height', message: 'Height must be between 50cm and 300cm' });
    }
  }

  // Weight validation
  if (metrics.weight !== undefined) {
    if (metrics.weight <= 0) {
      errors.push({ field: 'weight', message: 'Weight must be greater than 0' });
    } else if (metrics.weight < 20 || metrics.weight > 500) {
      errors.push({ field: 'weight', message: 'Weight must be between 20kg and 500kg' });
    }
  }

  // Age validation
  if (metrics.age !== undefined) {
    if (metrics.age <= 0) {
      errors.push({ field: 'age', message: 'Age must be greater than 0' });
    } else if (metrics.age < 13 || metrics.age > 120) {
      errors.push({ field: 'age', message: 'Age must be between 13 and 120 years' });
    }
  }

  // Gender validation
  if (metrics.gender !== undefined) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(metrics.gender)) {
      errors.push({ field: 'gender', message: 'Gender must be male, female, or other' });
    }
  }

  // Activity level validation
  if (metrics.activityLevel !== undefined) {
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
    if (!validActivityLevels.includes(metrics.activityLevel)) {
      errors.push({ field: 'activityLevel', message: 'Invalid activity level' });
    }
  }

  // Fitness goals validation
  if (metrics.fitnessGoals !== undefined) {
    if (!Array.isArray(metrics.fitnessGoals)) {
      errors.push({ field: 'fitnessGoals', message: 'Fitness goals must be an array' });
    } else if (metrics.fitnessGoals.length === 0) {
      errors.push({ field: 'fitnessGoals', message: 'At least one fitness goal is required' });
    } else if (metrics.fitnessGoals.length > 5) {
      errors.push({ field: 'fitnessGoals', message: 'Maximum 5 fitness goals allowed' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates user preferences data
 */
export const validateUserPreferences = (preferences: Partial<UserPreferences>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Units validation
  if (preferences.units !== undefined) {
    const validUnits = ['metric', 'imperial'];
    if (!validUnits.includes(preferences.units)) {
      errors.push({ field: 'units', message: 'Units must be metric or imperial' });
    }
  }

  // Theme validation
  if (preferences.theme !== undefined) {
    const validThemes = ['light', 'dark', 'auto'];
    if (!validThemes.includes(preferences.theme)) {
      errors.push({ field: 'theme', message: 'Theme must be light, dark, or auto' });
    }
  }

  // Privacy settings validation
  if (preferences.privacy !== undefined) {
    const { privacy } = preferences;
    
    if (privacy.profileVisibility !== undefined) {
      const validVisibility = ['public', 'friends', 'private'];
      if (!validVisibility.includes(privacy.profileVisibility)) {
        errors.push({ field: 'privacy.profileVisibility', message: 'Invalid profile visibility setting' });
      }
    }

    if (privacy.shareProgress !== undefined && typeof privacy.shareProgress !== 'boolean') {
      errors.push({ field: 'privacy.shareProgress', message: 'Share progress must be a boolean' });
    }

    if (privacy.shareWorkouts !== undefined && typeof privacy.shareWorkouts !== 'boolean') {
      errors.push({ field: 'privacy.shareWorkouts', message: 'Share workouts must be a boolean' });
    }
  }

  // Notification settings validation
  if (preferences.notifications !== undefined) {
    const { notifications } = preferences;
    const notificationFields = ['workoutReminders', 'progressUpdates', 'socialUpdates', 'systemUpdates'];
    
    notificationFields.forEach(field => {
      const value = notifications[field as keyof typeof notifications];
      if (value !== undefined && typeof value !== 'boolean') {
        errors.push({ field: `notifications.${field}`, message: `${field} must be a boolean` });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates complete user profile data
 */
export const validateUserProfile = (profile: Partial<UserProfile>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Display name validation
  if (profile.displayName !== undefined) {
    if (typeof profile.displayName !== 'string') {
      errors.push({ field: 'displayName', message: 'Display name must be a string' });
    } else if (profile.displayName.trim().length === 0) {
      errors.push({ field: 'displayName', message: 'Display name is required' });
    } else if (profile.displayName.length < 2) {
      errors.push({ field: 'displayName', message: 'Display name must be at least 2 characters' });
    } else if (profile.displayName.length > 50) {
      errors.push({ field: 'displayName', message: 'Display name must be less than 50 characters' });
    }
  }

  // Email validation (basic check)
  if (profile.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // Personal metrics validation
  if (profile.personalMetrics !== undefined) {
    const metricsValidation = validatePersonalMetrics(profile.personalMetrics);
    errors.push(...metricsValidation.errors);
  }

  // Preferences validation
  if (profile.preferences !== undefined) {
    const preferencesValidation = validateUserPreferences(profile.preferences);
    errors.push(...preferencesValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Checks if profile has all required fields for completeness
 */
export const checkProfileCompleteness = (profile: UserProfile | null): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!profile) {
    errors.push({ field: 'profile', message: 'Profile does not exist' });
    return { isValid: false, errors };
  }

  // Required basic information
  if (!profile.displayName || profile.displayName.trim().length === 0) {
    errors.push({ field: 'displayName', message: 'Display name is required' });
  }

  if (!profile.email || profile.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  // Required personal metrics
  const { personalMetrics } = profile;
  if (!personalMetrics) {
    errors.push({ field: 'personalMetrics', message: 'Personal metrics are required' });
  } else {
    if (!personalMetrics.height || personalMetrics.height <= 0) {
      errors.push({ field: 'personalMetrics.height', message: 'Height is required' });
    }

    if (!personalMetrics.weight || personalMetrics.weight <= 0) {
      errors.push({ field: 'personalMetrics.weight', message: 'Weight is required' });
    }

    if (!personalMetrics.age || personalMetrics.age <= 0) {
      errors.push({ field: 'personalMetrics.age', message: 'Age is required' });
    }

    if (!personalMetrics.gender) {
      errors.push({ field: 'personalMetrics.gender', message: 'Gender is required' });
    }

    if (!personalMetrics.activityLevel) {
      errors.push({ field: 'personalMetrics.activityLevel', message: 'Activity level is required' });
    }

    if (!personalMetrics.fitnessGoals || personalMetrics.fitnessGoals.length === 0) {
      errors.push({ field: 'personalMetrics.fitnessGoals', message: 'At least one fitness goal is required' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculates BMI from height and weight
 */
export const calculateBMI = (height: number, weight: number): number | null => {
  if (height <= 0 || weight <= 0) return null;
  
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * Gets BMI category based on BMI value
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Validates and sanitizes form input data
 */
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (typeof value === 'string') {
      // Trim whitespace and remove potentially harmful characters
      sanitized[key] = value.trim().replace(/<[^>]*>/g, '');
    } else if (typeof value === 'number') {
      // Ensure numbers are finite
      sanitized[key] = isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (Array.isArray(value)) {
      // Sanitize array elements
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? item.trim().replace(/<[^>]*>/g, '') : item
      );
    } else if (value && typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};