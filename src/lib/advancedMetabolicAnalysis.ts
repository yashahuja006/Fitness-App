/**
 * Advanced Metabolic Analysis Engine
 * 
 * Enhanced metabolic calculations with body fat adjustments, lean body mass calculations,
 * and advanced calorie strategies for the AI Performance Nutrition & Training Engine.
 * 
 * Features:
 * - Body fat percentage adjustments for BMR
 * - Lean body mass calculations
 * - Advanced activity multipliers
 * - Goal-specific progressive calorie strategies
 * - Body composition analysis
 */

import { PersonalMetrics } from '../types';

export interface AdvancedPersonalMetrics extends PersonalMetrics {
  bodyFatPercentage?: number;
  trainingDaysPerWeek?: number;
  subscriptionTier?: 'free' | 'pro';
  // Navy method measurements for more accurate body fat estimation
  neckCircumference?: number; // cm
  waistCircumference?: number; // cm
  hipCircumference?: number; // cm (for females)
}

export interface BodyCompositionAnalysis {
  leanBodyMass: number; // kg
  fatMass: number; // kg
  bodyFatPercentage: number; // %
  estimatedMethod: 'provided' | 'estimated_from_bmi' | 'estimated_from_age_gender' | 'navy_method' | 'jackson_pollock';
  metabolicRate: 'slow' | 'normal' | 'fast';
  confidenceLevel?: 'high' | 'medium' | 'low';
  disclaimer?: string;
}

export interface AdvancedMetabolicAnalysis {
  bmr: number;
  bmrWithBodyFat: number;
  tdee: number;
  maintenanceCalories: number;
  targetCaloriesWeek1: number;
  strategy: 'deficit' | 'surplus' | 'maintenance' | 'cycling';
  bodyCompositionFactor: number;
  bodyComposition: BodyCompositionAnalysis;
  weeklyProgression: WeeklyCalorieProgression[];
}

export interface WeeklyCalorieProgression {
  week: number;
  targetCalories: number;
  adjustmentReason: string;
  plateauPrevention: boolean;
  refeedScheduled?: boolean;
}

/**
 * Body fat estimation result with confidence level
 */
export interface BodyFatEstimation {
  bodyFatPercentage: number;
  method: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  disclaimer: string;
}

/**
 * Navy Method body fat estimation (most accurate without calipers)
 * Requires neck, waist, and hip (for females) measurements
 */
export function estimateBodyFatNavyMethod(
  metrics: AdvancedPersonalMetrics
): BodyFatEstimation | null {
  const { height, gender, neckCircumference, waistCircumference, hipCircumference } = metrics;
  
  // Check if we have required measurements
  if (!neckCircumference || !waistCircumference) {
    return null;
  }
  
  if (gender === 'female' && !hipCircumference) {
    return null;
  }
  
  let bodyFat: number;
  
  if (gender === 'male') {
    // Male formula: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    const log10WaistMinusNeck = Math.log10(waistCircumference - neckCircumference);
    const log10Height = Math.log10(height);
    bodyFat = 495 / (1.0324 - 0.19077 * log10WaistMinusNeck + 0.15456 * log10Height) - 450;
  } else {
    // Female formula: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    const log10WaistPlusHipMinusNeck = Math.log10(waistCircumference + (hipCircumference || 0) - neckCircumference);
    const log10Height = Math.log10(height);
    bodyFat = 495 / (1.29579 - 0.35004 * log10WaistPlusHipMinusNeck + 0.22100 * log10Height) - 450;
  }
  
  return {
    bodyFatPercentage: Math.max(3, Math.min(50, Math.round(bodyFat * 10) / 10)),
    method: 'navy_method',
    confidenceLevel: 'high',
    disclaimer: 'Navy Method provides accurate estimates when measurements are taken correctly. For best results, measure at the same time of day and ensure tape is snug but not compressing skin.'
  };
}

/**
 * BMI-based body fat estimation (Deurenberg et al. formula)
 * Less accurate but requires only basic metrics
 */
export function estimateBodyFatFromBMI(
  metrics: PersonalMetrics
): BodyFatEstimation {
  const { height, weight, age, gender } = metrics;
  
  // BMI-based estimation (Deurenberg et al. formula)
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const genderFactor = gender === 'male' ? 1 : 0;
  
  const bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
  
  return {
    bodyFatPercentage: Math.max(3, Math.min(50, Math.round(bodyFat * 10) / 10)),
    method: 'estimated_from_bmi',
    confidenceLevel: 'medium',
    disclaimer: 'BMI-based estimation provides a general approximation. Accuracy may vary for athletes with high muscle mass or individuals with unusual body compositions. Consider providing actual measurements for better accuracy.'
  };
}

/**
 * Age and gender-based body fat estimation
 * Least accurate but provides baseline when no other data available
 */
export function estimateBodyFatFromAgeGender(
  metrics: PersonalMetrics
): BodyFatEstimation {
  const { age, gender } = metrics;
  
  let baseBF: number;
  if (gender === 'male') {
    baseBF = age < 30 ? 12 : age < 40 ? 15 : age < 50 ? 18 : 20;
  } else {
    baseBF = age < 30 ? 20 : age < 40 ? 23 : age < 50 ? 26 : 28;
  }
  
  return {
    bodyFatPercentage: baseBF,
    method: 'estimated_from_age_gender',
    confidenceLevel: 'low',
    disclaimer: 'Age and gender-based estimation provides only a rough baseline. Individual body composition can vary significantly. We strongly recommend providing actual body fat measurements or circumference measurements for accurate nutrition planning.'
  };
}

/**
 * Estimate body fat percentage using the best available method
 * Tries methods in order of accuracy: Navy > BMI > Age/Gender
 */
export function estimateBodyFatPercentage(
  metrics: NavyMethodMetrics,
  preferredMethod?: 'navy' | 'bmi' | 'age_gender'
): BodyFatEstimation {
  // If preferred method is specified and possible, use it
  if (preferredMethod === 'navy') {
    const navyResult = estimateBodyFatNavyMethod(metrics);
    if (navyResult) return navyResult;
  }
  
  if (preferredMethod === 'bmi') {
    return estimateBodyFatFromBMI(metrics);
  }
  
  if (preferredMethod === 'age_gender') {
    return estimateBodyFatFromAgeGender(metrics);
  }
  
  // Otherwise, try methods in order of accuracy
  // 1. Try Navy method first (most accurate)
  const navyResult = estimateBodyFatNavyMethod(metrics);
  if (navyResult) {
    return navyResult;
  }
  
  // 2. Fall back to BMI method
  return estimateBodyFatFromBMI(metrics);
}

/**
 * Calculate body composition analysis including lean body mass
 * Supports user-provided values or estimates using multiple methods
 */
export function calculateBodyComposition(
  metrics: AdvancedPersonalMetrics & NavyMethodMetrics
): BodyCompositionAnalysis {
  let bodyFatPercentage: number;
  let estimatedMethod: BodyCompositionAnalysis['estimatedMethod'];
  let confidenceLevel: 'high' | 'medium' | 'low';
  let disclaimer: string;
  
  if (metrics.bodyFatPercentage && metrics.bodyFatPercentage > 0) {
    // User provided actual body fat percentage
    bodyFatPercentage = metrics.bodyFatPercentage;
    estimatedMethod = 'provided';
    confidenceLevel = 'high';
    disclaimer = 'Using your provided body fat percentage. Update this value if you get new measurements for more accurate calculations.';
  } else {
    // Estimate using best available method
    const estimation = estimateBodyFatPercentage(metrics);
    bodyFatPercentage = estimation.bodyFatPercentage;
    estimatedMethod = estimation.method as BodyCompositionAnalysis['estimatedMethod'];
    confidenceLevel = estimation.confidenceLevel;
    disclaimer = estimation.disclaimer;
  }
  
  const fatMass = (metrics.weight * bodyFatPercentage) / 100;
  const leanBodyMass = metrics.weight - fatMass;
  
  // Determine metabolic rate based on body composition
  let metabolicRate: 'slow' | 'normal' | 'fast';
  const leanBodyMassRatio = leanBodyMass / metrics.weight;
  
  if (leanBodyMassRatio > 0.85) {
    metabolicRate = 'fast'; // High muscle mass
  } else if (leanBodyMassRatio < 0.70) {
    metabolicRate = 'slow'; // High body fat
  } else {
    metabolicRate = 'normal';
  }
  
  return {
    leanBodyMass: Math.round(leanBodyMass * 10) / 10,
    fatMass: Math.round(fatMass * 10) / 10,
    bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10,
    estimatedMethod,
    metabolicRate,
    confidenceLevel,
    disclaimer
  };
}

/**
 * Calculate BMR with body fat adjustments using Katch-McArdle formula when body fat is available
 */
export function calculateAdvancedBMR(
  metrics: AdvancedPersonalMetrics,
  bodyComposition: BodyCompositionAnalysis
): { standardBMR: number; adjustedBMR: number; method: string } {
  const { weight, height, age, gender } = metrics;
  
  // Standard Mifflin-St Jeor calculation
  const baseCalculation = (10 * weight) + (6.25 * height) - (5 * age);
  const standardBMR = gender === 'male' ? baseCalculation + 5 : baseCalculation - 161;
  
  // If we have body fat data, use Katch-McArdle formula for more accuracy
  if (bodyComposition.estimatedMethod === 'provided' || bodyComposition.leanBodyMass > 0) {
    // Katch-McArdle: BMR = 370 + (21.6 × lean body mass in kg)
    const katchMcArdleBMR = 370 + (21.6 * bodyComposition.leanBodyMass);
    
    // Apply metabolic rate adjustment
    let metabolicAdjustment = 1.0;
    switch (bodyComposition.metabolicRate) {
      case 'fast':
        metabolicAdjustment = 1.05; // +5% for high muscle mass
        break;
      case 'slow':
        metabolicAdjustment = 0.95; // -5% for high body fat
        break;
      default:
        metabolicAdjustment = 1.0;
    }
    
    const adjustedBMR = Math.round(katchMcArdleBMR * metabolicAdjustment);
    
    return {
      standardBMR: Math.round(standardBMR),
      adjustedBMR,
      method: 'katch_mcardle_with_metabolic_adjustment'
    };
  }
  
  return {
    standardBMR: Math.round(standardBMR),
    adjustedBMR: Math.round(standardBMR),
    method: 'mifflin_st_jeor'
  };
}

/**
 * Calculate TDEE with enhanced activity multipliers
 */
export function calculateAdvancedTDEE(
  bmr: number,
  activityLevel: PersonalMetrics['activityLevel'],
  trainingDaysPerWeek?: number
): number {
  // Base activity multipliers
  const baseMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  let multiplier = baseMultipliers[activityLevel];
  
  // Fine-tune based on training frequency if provided
  if (trainingDaysPerWeek !== undefined) {
    if (trainingDaysPerWeek >= 6 && activityLevel !== 'very_active') {
      multiplier = Math.min(multiplier * 1.1, 1.9); // Boost for high frequency
    } else if (trainingDaysPerWeek <= 2 && activityLevel !== 'sedentary') {
      multiplier = Math.max(multiplier * 0.95, 1.2); // Reduce for low frequency
    }
  }
  
  return Math.round(bmr * multiplier);
}

/**
 * Generate weekly calorie progression based on goal and strategy
 */
export function generateWeeklyProgression(
  maintenanceCalories: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance',
  weeks: number = 8
): WeeklyCalorieProgression[] {
  const progression: WeeklyCalorieProgression[] = [];
  
  switch (goal) {
    case 'fat_loss':
      // Start with 20% deficit, taper by 50 kcal after week 3
      const initialDeficit = Math.round(maintenanceCalories * 0.2);
      
      for (let week = 1; week <= weeks; week++) {
        const taper = week > 3 ? (week - 3) * 50 : 0;
        const targetCalories = maintenanceCalories - initialDeficit + taper;
        
        progression.push({
          week,
          targetCalories: Math.max(targetCalories, maintenanceCalories * 0.7), // Minimum 70% of maintenance
          adjustmentReason: week <= 3 ? 'Initial deficit phase' : `Taper week ${week - 3}`,
          plateauPrevention: week > 4,
          refeedScheduled: week % 2 === 0 && week > 2 // Refeed every 2 weeks after week 2
        });
      }
      break;
      
    case 'muscle_gain':
      // Start with 15% surplus, increase if progress stalls
      const initialSurplus = Math.round(maintenanceCalories * 0.15);
      
      for (let week = 1; week <= weeks; week++) {
        const progressBoost = week > 4 ? 100 : 0; // +100 kcal if no progress after week 4
        const targetCalories = maintenanceCalories + initialSurplus + progressBoost;
        
        progression.push({
          week,
          targetCalories,
          adjustmentReason: week <= 4 ? 'Initial surplus phase' : 'Progress boost phase',
          plateauPrevention: week > 4
        });
      }
      break;
      
    case 'recomposition':
      // Cycle between maintenance and slight deficit/surplus
      for (let week = 1; week <= weeks; week++) {
        const isDeficitWeek = week % 2 === 1;
        const adjustment = isDeficitWeek ? -200 : 200;
        
        progression.push({
          week,
          targetCalories: maintenanceCalories + adjustment,
          adjustmentReason: isDeficitWeek ? 'Deficit week for fat loss' : 'Surplus week for muscle gain',
          plateauPrevention: true
        });
      }
      break;
      
    case 'endurance':
      // Consistent surplus with carb loading weeks
      const enduranceSurplus = Math.round(maintenanceCalories * 0.1);
      
      for (let week = 1; week <= weeks; week++) {
        const carbLoadingBoost = week % 4 === 0 ? 200 : 0; // Extra carbs every 4th week
        
        progression.push({
          week,
          targetCalories: maintenanceCalories + enduranceSurplus + carbLoadingBoost,
          adjustmentReason: carbLoadingBoost > 0 ? 'Carb loading week' : 'Endurance fueling',
          plateauPrevention: false
        });
      }
      break;
  }
  
  return progression;
}

/**
 * Main function to perform advanced metabolic analysis
 */
export function performAdvancedMetabolicAnalysis(
  metrics: AdvancedPersonalMetrics & NavyMethodMetrics,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance' = 'maintenance' as any,
  weeks: number = 8
): AdvancedMetabolicAnalysis {
  // Calculate body composition
  const bodyComposition = calculateBodyComposition(metrics);
  
  // Calculate BMR with body fat adjustments
  const bmrResults = calculateAdvancedBMR(metrics, bodyComposition);
  
  // Calculate TDEE with enhanced multipliers
  const tdee = calculateAdvancedTDEE(
    bmrResults.adjustedBMR,
    metrics.activityLevel,
    metrics.trainingDaysPerWeek
  );
  
  // Generate weekly progression
  const weeklyProgression = generateWeeklyProgression(tdee, goal, weeks);
  
  // Determine strategy
  let strategy: 'deficit' | 'surplus' | 'maintenance' | 'cycling';
  switch (goal) {
    case 'fat_loss':
      strategy = 'deficit';
      break;
    case 'muscle_gain':
      strategy = 'surplus';
      break;
    case 'recomposition':
      strategy = 'cycling';
      break;
    default:
      strategy = 'maintenance';
  }
  
  // Calculate body composition factor (how much body comp affects metabolism)
  const bodyCompositionFactor = bodyComposition.metabolicRate === 'fast' ? 1.05 :
                               bodyComposition.metabolicRate === 'slow' ? 0.95 : 1.0;
  
  return {
    bmr: bmrResults.standardBMR,
    bmrWithBodyFat: bmrResults.adjustedBMR,
    tdee,
    maintenanceCalories: tdee,
    targetCaloriesWeek1: weeklyProgression[0]?.targetCalories || tdee,
    strategy,
    bodyCompositionFactor,
    bodyComposition,
    weeklyProgression
  };
}

/**
 * Validate advanced metrics input
 */
export function validateAdvancedMetrics(
  metrics: AdvancedPersonalMetrics
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  if (metrics.height < 100 || metrics.height > 250) {
    errors.push('Height must be between 100-250 cm');
  }
  
  if (metrics.weight < 30 || metrics.weight > 300) {
    errors.push('Weight must be between 30-300 kg');
  }
  
  if (metrics.age < 13 || metrics.age > 120) {
    errors.push('Age must be between 13-120 years');
  }
  
  // Body fat validation
  if (metrics.bodyFatPercentage !== undefined) {
    if (metrics.bodyFatPercentage < 3 || metrics.bodyFatPercentage > 50) {
      errors.push('Body fat percentage must be between 3-50%');
    }
  }
  
  // Training days validation
  if (metrics.trainingDaysPerWeek !== undefined) {
    if (metrics.trainingDaysPerWeek < 0 || metrics.trainingDaysPerWeek > 7) {
      errors.push('Training days per week must be between 0-7');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}