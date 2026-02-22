// Utility functions for the fitness app

/**
 * Calculate BMI from height and weight
 */
export function calculateBMI(
  height: number,
  weight: number,
  unit: 'metric' | 'imperial' = 'metric'
): number {
  if (unit === 'imperial') {
    // Convert to metric: height in inches to meters, weight in pounds to kg
    const heightInMeters = height * 0.0254;
    const weightInKg = weight * 0.453592;
    return weightInKg / (heightInMeters * heightInMeters);
  }

  // Metric: height in cm to meters
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * Calculate daily caloric needs using Mifflin-St Jeor Equation
 */
export function calculateDailyCalories(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
  unit: 'metric' | 'imperial' = 'metric'
): number {
  let bmr: number;

  // Convert to metric if needed
  let weightKg = weight;
  let heightCm = height;

  if (unit === 'imperial') {
    weightKg = weight * 0.453592; // pounds to kg
    heightCm = height * 2.54; // inches to cm
  }

  // Calculate BMR using Mifflin-St Jeor Equation
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // Apply activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

/**
 * Convert weight between metric and imperial units
 */
export function convertWeight(
  weight: number,
  from: 'kg' | 'lbs',
  to: 'kg' | 'lbs'
): number {
  if (from === to) return weight;

  if (from === 'kg' && to === 'lbs') {
    return weight * 2.20462;
  } else if (from === 'lbs' && to === 'kg') {
    return weight * 0.453592;
  }

  return weight;
}

/**
 * Convert height between metric and imperial units
 */
export function convertHeight(
  height: number,
  from: 'cm' | 'inches',
  to: 'cm' | 'inches'
): number {
  if (from === to) return height;

  if (from === 'cm' && to === 'inches') {
    return height * 0.393701;
  } else if (from === 'inches' && to === 'cm') {
    return height * 2.54;
  }

  return height;
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage between two numbers
 */
export function calculatePercentage(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export body fat estimation utilities
export {
  estimateBodyFatFromBMI,
  estimateBodyFatDeurenberg,
  estimateBodyFatNavyMethod,
  estimateBodyFatJacksonPollock,
  estimateBodyFatPercentage,
  getBodyFatPercentage,
  validateBodyFatPercentage,
  getBodyFatCategory,
  type BodyFatEstimate,
  type BodyFatEstimationResult,
  type NavyMethodMeasurements,
  type JacksonPollockMeasurements,
  type ConfidenceLevel
} from './bodyFatEstimation';
