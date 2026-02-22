/**
 * Body Fat Percentage Estimation Utilities
 * 
 * Provides multiple validated estimation methods when users don't provide
 * actual body fat percentage measurements. All methods are approximations
 * and should be used with appropriate disclaimers.
 * 
 * Methods implemented:
 * - Navy Method (circumference-based)
 * - BMI-based estimation
 * - Deurenberg formula (age and gender adjusted)
 * - Jackson-Pollock 3-site (when measurements available)
 */

import { UserProfileExtended } from '@/types/nutrition';

/**
 * Confidence level for body fat estimates
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Body fat estimation result
 */
export interface BodyFatEstimate {
  percentage: number;
  method: string;
  confidence: ConfidenceLevel;
  disclaimer: string;
  canOverride: boolean;
}

/**
 * Navy method measurements (optional)
 */
export interface NavyMethodMeasurements {
  neck: number; // cm
  waist: number; // cm
  hip?: number; // cm (required for females)
}

/**
 * Jackson-Pollock 3-site measurements (optional)
 */
export interface JacksonPollockMeasurements {
  chest?: number; // mm (for males)
  abdomen?: number; // mm (for males)
  thigh?: number; // mm (for both)
  tricep?: number; // mm (for females)
  suprailiac?: number; // mm (for females)
}

/**
 * Complete estimation result with multiple methods
 */
export interface BodyFatEstimationResult {
  recommended: BodyFatEstimate;
  alternatives: BodyFatEstimate[];
  averageEstimate: number;
  range: {
    min: number;
    max: number;
  };
  disclaimer: string;
}

/**
 * Calculate BMI from height and weight
 */
function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

/**
 * BMI-based body fat estimation
 * Simple but less accurate method based on BMI correlation
 */
export function estimateBodyFatFromBMI(
  profile: Pick<UserProfileExtended, 'weight' | 'height' | 'age' | 'gender'>
): BodyFatEstimate {
  const bmi = calculateBMI(profile.weight, profile.height);
  
  // Gender-specific BMI to body fat correlation
  let bodyFat: number;
  
  if (profile.gender === 'male') {
    // Formula: BF% = (1.20 × BMI) + (0.23 × Age) - 16.2
    bodyFat = (1.20 * bmi) + (0.23 * profile.age) - 16.2;
  } else if (profile.gender === 'female') {
    // Formula: BF% = (1.20 × BMI) + (0.23 × Age) - 5.4
    bodyFat = (1.20 * bmi) + (0.23 * profile.age) - 5.4;
  } else {
    // Use average of male and female formulas
    const maleEstimate = (1.20 * bmi) + (0.23 * profile.age) - 16.2;
    const femaleEstimate = (1.20 * bmi) + (0.23 * profile.age) - 5.4;
    bodyFat = (maleEstimate + femaleEstimate) / 2;
  }
  
  // Clamp to realistic range
  bodyFat = Math.max(3, Math.min(50, bodyFat));
  
  return {
    percentage: Math.round(bodyFat * 10) / 10,
    method: 'BMI-based estimation',
    confidence: 'low',
    disclaimer: 'BMI-based estimates have limited accuracy as they don\'t account for muscle mass or body composition.',
    canOverride: true
  };
}

/**
 * Deurenberg formula for body fat estimation
 * More accurate than simple BMI, accounts for age and gender
 */
export function estimateBodyFatDeurenberg(
  profile: Pick<UserProfileExtended, 'weight' | 'height' | 'age' | 'gender'>
): BodyFatEstimate {
  const bmi = calculateBMI(profile.weight, profile.height);
  
  // Deurenberg formula: BF% = (1.20 × BMI) + (0.23 × Age) - (10.8 × Sex) - 5.4
  // Sex: 1 for male, 0 for female
  const sexFactor = profile.gender === 'male' ? 1 : 0;
  const bodyFat = (1.20 * bmi) + (0.23 * profile.age) - (10.8 * sexFactor) - 5.4;
  
  // Clamp to realistic range
  const clampedBodyFat = Math.max(3, Math.min(50, bodyFat));
  
  return {
    percentage: Math.round(clampedBodyFat * 10) / 10,
    method: 'Deurenberg formula',
    confidence: 'medium',
    disclaimer: 'The Deurenberg formula provides a reasonable estimate but may be less accurate for athletes or individuals with high muscle mass.',
    canOverride: true
  };
}

/**
 * Navy method for body fat estimation
 * More accurate when circumference measurements are available
 */
export function estimateBodyFatNavyMethod(
  profile: Pick<UserProfileExtended, 'height' | 'gender'>,
  measurements: NavyMethodMeasurements
): BodyFatEstimate {
  const { neck, waist, hip } = measurements;
  const height = profile.height;
  
  let bodyFat: number;
  
  if (profile.gender === 'male') {
    // Male formula: 495 / (1.0324 - 0.19077 × log10(waist - neck) + 0.15456 × log10(height)) - 450
    const log10WaistMinusNeck = Math.log10(waist - neck);
    const log10Height = Math.log10(height);
    bodyFat = 495 / (1.0324 - 0.19077 * log10WaistMinusNeck + 0.15456 * log10Height) - 450;
  } else if (profile.gender === 'female') {
    // Female formula requires hip measurement
    if (!hip) {
      throw new Error('Hip measurement required for female Navy method calculation');
    }
    // Female formula: 495 / (1.29579 - 0.35004 × log10(waist + hip - neck) + 0.22100 × log10(height)) - 450
    const log10WaistPlusHipMinusNeck = Math.log10(waist + hip - neck);
    const log10Height = Math.log10(height);
    bodyFat = 495 / (1.29579 - 0.35004 * log10WaistPlusHipMinusNeck + 0.22100 * log10Height) - 450;
  } else {
    throw new Error('Navy method requires binary gender specification');
  }
  
  // Clamp to realistic range
  bodyFat = Math.max(3, Math.min(50, bodyFat));
  
  return {
    percentage: Math.round(bodyFat * 10) / 10,
    method: 'Navy circumference method',
    confidence: 'high',
    disclaimer: 'Navy method is more accurate than BMI-based estimates but still an approximation. Actual body composition testing is recommended for precise measurements.',
    canOverride: true
  };
}

/**
 * Jackson-Pollock 3-site skinfold method
 * Requires skinfold caliper measurements
 */
export function estimateBodyFatJacksonPollock(
  profile: Pick<UserProfileExtended, 'age' | 'gender'>,
  measurements: JacksonPollockMeasurements
): BodyFatEstimate {
  let sumOfSkinfolds: number;
  let bodyDensity: number;
  
  if (profile.gender === 'male') {
    // Male: chest, abdomen, thigh
    if (!measurements.chest || !measurements.abdomen || !measurements.thigh) {
      throw new Error('Chest, abdomen, and thigh measurements required for male Jackson-Pollock calculation');
    }
    sumOfSkinfolds = measurements.chest + measurements.abdomen + measurements.thigh;
    // Body density formula for males
    bodyDensity = 1.10938 - (0.0008267 * sumOfSkinfolds) + (0.0000016 * sumOfSkinfolds * sumOfSkinfolds) - (0.0002574 * profile.age);
  } else if (profile.gender === 'female') {
    // Female: tricep, suprailiac, thigh
    if (!measurements.tricep || !measurements.suprailiac || !measurements.thigh) {
      throw new Error('Tricep, suprailiac, and thigh measurements required for female Jackson-Pollock calculation');
    }
    sumOfSkinfolds = measurements.tricep + measurements.suprailiac + measurements.thigh;
    // Body density formula for females
    bodyDensity = 1.0994921 - (0.0009929 * sumOfSkinfolds) + (0.0000023 * sumOfSkinfolds * sumOfSkinfolds) - (0.0001392 * profile.age);
  } else {
    throw new Error('Jackson-Pollock method requires binary gender specification');
  }
  
  // Convert body density to body fat percentage using Siri equation
  const bodyFat = ((4.95 / bodyDensity) - 4.50) * 100;
  
  // Clamp to realistic range
  const clampedBodyFat = Math.max(3, Math.min(50, bodyFat));
  
  return {
    percentage: Math.round(clampedBodyFat * 10) / 10,
    method: 'Jackson-Pollock 3-site skinfold',
    confidence: 'high',
    disclaimer: 'Skinfold measurements require proper technique and calibrated calipers. Results are most accurate when performed by trained professionals.',
    canOverride: true
  };
}

/**
 * Estimate body fat using activity level as additional context
 * Adjusts estimates based on training level and activity
 */
function adjustEstimateForActivity(
  baseEstimate: number,
  profile: Pick<UserProfileExtended, 'activity_level' | 'training_level'>
): number {
  let adjustment = 0;
  
  // More active individuals tend to have lower body fat
  // This is a rough adjustment factor
  if (profile.activity_level === 'very_active' && profile.training_level === 'advanced') {
    adjustment = -2; // Likely 2% lower than estimate
  } else if (profile.activity_level === 'active' && profile.training_level === 'intermediate') {
    adjustment = -1;
  } else if (profile.activity_level === 'sedentary') {
    adjustment = 1; // Likely 1% higher than estimate
  }
  
  return Math.max(3, Math.min(50, baseEstimate + adjustment));
}

/**
 * Main function to estimate body fat percentage with multiple methods
 * Returns the most appropriate estimate based on available data
 */
export function estimateBodyFatPercentage(
  profile: UserProfileExtended,
  navyMeasurements?: NavyMethodMeasurements,
  jacksonPollockMeasurements?: JacksonPollockMeasurements
): BodyFatEstimationResult {
  const estimates: BodyFatEstimate[] = [];
  
  // Try Navy method if measurements available (most accurate)
  if (navyMeasurements) {
    try {
      const navyEstimate = estimateBodyFatNavyMethod(profile, navyMeasurements);
      estimates.push(navyEstimate);
    } catch (error) {
      // Skip if measurements incomplete
    }
  }
  
  // Try Jackson-Pollock if measurements available
  if (jacksonPollockMeasurements) {
    try {
      const jpEstimate = estimateBodyFatJacksonPollock(profile, jacksonPollockMeasurements);
      estimates.push(jpEstimate);
    } catch (error) {
      // Skip if measurements incomplete
    }
  }
  
  // Always include Deurenberg (medium accuracy)
  const deurenbergEstimate = estimateBodyFatDeurenberg(profile);
  estimates.push(deurenbergEstimate);
  
  // Always include BMI-based (lowest accuracy, but always available)
  const bmiEstimate = estimateBodyFatFromBMI(profile);
  estimates.push(bmiEstimate);
  
  // Adjust estimates based on activity level
  const adjustedEstimates = estimates.map(est => ({
    ...est,
    percentage: adjustEstimateForActivity(est.percentage, profile)
  }));
  
  // Calculate average and range
  const percentages = adjustedEstimates.map(e => e.percentage);
  const averageEstimate = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const minEstimate = Math.min(...percentages);
  const maxEstimate = Math.max(...percentages);
  
  // Select recommended estimate (highest confidence available)
  const recommended = adjustedEstimates.reduce((best, current) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[current.confidence] > confidenceOrder[best.confidence] ? current : best;
  });
  
  // Get alternatives (all except recommended)
  const alternatives = adjustedEstimates.filter(e => e.method !== recommended.method);
  
  return {
    recommended,
    alternatives,
    averageEstimate: Math.round(averageEstimate * 10) / 10,
    range: {
      min: Math.round(minEstimate * 10) / 10,
      max: Math.round(maxEstimate * 10) / 10
    },
    disclaimer: 'All body fat estimates are approximations. For accurate measurements, consider professional body composition testing methods such as DEXA scan, hydrostatic weighing, or Bod Pod. You can override these estimates with your actual measurements at any time.'
  };
}

/**
 * Get body fat percentage for profile
 * Returns actual value if provided, otherwise estimates
 */
export function getBodyFatPercentage(
  profile: UserProfileExtended,
  navyMeasurements?: NavyMethodMeasurements,
  jacksonPollockMeasurements?: JacksonPollockMeasurements
): {
  value: number;
  isEstimated: boolean;
  estimation?: BodyFatEstimationResult;
} {
  // If user provided actual measurement, use it
  if (profile.body_fat_percentage !== undefined && profile.body_fat_percentage !== null) {
    return {
      value: profile.body_fat_percentage,
      isEstimated: false
    };
  }
  
  // Otherwise, estimate
  const estimation = estimateBodyFatPercentage(profile, navyMeasurements, jacksonPollockMeasurements);
  
  return {
    value: estimation.recommended.percentage,
    isEstimated: true,
    estimation
  };
}

/**
 * Validate body fat percentage is within realistic range
 */
export function validateBodyFatPercentage(bodyFat: number, gender: string): {
  isValid: boolean;
  message?: string;
} {
  if (bodyFat < 3) {
    return {
      isValid: false,
      message: 'Body fat percentage below 3% is dangerously low and not sustainable'
    };
  }
  
  if (bodyFat > 50) {
    return {
      isValid: false,
      message: 'Body fat percentage above 50% is outside the typical range'
    };
  }
  
  // Gender-specific warnings
  if (gender === 'male') {
    if (bodyFat < 5) {
      return {
        isValid: true,
        message: 'Warning: Body fat below 5% for males is extremely low and may affect health'
      };
    }
  } else if (gender === 'female') {
    if (bodyFat < 12) {
      return {
        isValid: true,
        message: 'Warning: Body fat below 12% for females is extremely low and may affect hormonal health'
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Get body fat category description
 */
export function getBodyFatCategory(bodyFat: number, gender: string): string {
  if (gender === 'male') {
    if (bodyFat < 6) return 'Essential fat';
    if (bodyFat < 14) return 'Athletic';
    if (bodyFat < 18) return 'Fitness';
    if (bodyFat < 25) return 'Average';
    return 'Above average';
  } else if (gender === 'female') {
    if (bodyFat < 14) return 'Essential fat';
    if (bodyFat < 21) return 'Athletic';
    if (bodyFat < 25) return 'Fitness';
    if (bodyFat < 32) return 'Average';
    return 'Above average';
  }
  
  return 'Unknown';
}
