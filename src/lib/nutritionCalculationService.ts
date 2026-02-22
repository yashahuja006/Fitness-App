/**
 * Nutrition Calculation Service
 * 
 * This service provides algorithms for calculating BMI, daily caloric needs,
 * and macronutrient distributions based on user metrics and fitness goals.
 * 
 * Requirements: 2.1, 2.2
 */

import { PersonalMetrics, MacronutrientBreakdown } from '../types';

// Activity level multipliers for caloric needs calculation (Updated to match specifications)
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Sedentary (little or no exercise)
  light: 1.375,        // Light activity (light exercise 1-3 days/week)
  moderate: 1.55,      // Moderate activity (moderate exercise 3-5 days/week)
  active: 1.725,       // Active (hard exercise 6-7 days/week)
  very_active: 1.9     // Very active (very hard exercise & physical job)
} as const;

// Goal-based caloric adjustments (Fixed calorie amounts as specified)
const GOAL_ADJUSTMENTS = {
  weight_loss: -500,     // -500 kcal for weight loss
  muscle_gain: 300,      // +300 kcal for muscle gain
  maintenance: 0,        // No adjustment for maintenance
  endurance: 400         // +400 kcal for endurance training
} as const;

// Macronutrient distribution by goal (percentages)
const MACRO_DISTRIBUTIONS = {
  weight_loss: { protein: 0.35, carbohydrates: 0.35, fats: 0.30 },
  muscle_gain: { protein: 0.30, carbohydrates: 0.45, fats: 0.25 },
  maintenance: { protein: 0.25, carbohydrates: 0.45, fats: 0.30 },
  endurance: { protein: 0.20, carbohydrates: 0.60, fats: 0.20 }
} as const;

export interface CalorieRequirements {
  bmr: number;           // Basal Metabolic Rate
  tdee: number;          // Total Daily Energy Expenditure
  targetCalories: number; // Adjusted for fitness goals
  goalAdjustment: number; // Percentage adjustment applied
}

export interface NutritionCalculationResult {
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  calorieRequirements: CalorieRequirements;
  macronutrients: MacronutrientBreakdown;
  recommendations: string[];
}

/**
 * Calculate Body Mass Index (BMI)
 * Formula: weight (kg) / (height (m))^2
 */
export function calculateBMI(height: number, weight: number): number {
  if (height <= 0 || weight <= 0) {
    throw new Error('Height and weight must be positive numbers');
  }
  
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // Round to 1 decimal place
  return Math.round(bmi * 10) / 10;
}

/**
 * Categorize BMI according to WHO standards
 */
export function categorizeBMI(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * This is the most accurate formula for most people
 * 
 * Male: BMR = (10 × weight) + (6.25 × height) – (5 × age) + 5
 * Female: BMR = (10 × weight) + (6.25 × height) – (5 × age) – 161
 */
export function calculateBMR(metrics: PersonalMetrics): number {
  const { weight, height, age, gender } = metrics;
  
  if (weight <= 0 || height <= 0 || age <= 0) {
    throw new Error('Weight, height, and age must be positive numbers');
  }
  
  // Base calculation: (10 × weight) + (6.25 × height) – (5 × age)
  const baseCalculation = (10 * weight) + (6.25 * height) - (5 * age);
  
  // Apply gender-specific adjustment
  const bmr = gender === 'male' ? baseCalculation + 5 : baseCalculation - 161;
  
  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * TDEE = BMR × Activity Level Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: PersonalMetrics['activityLevel']): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate target calories based on fitness goals
 * Uses fixed calorie adjustments as specified:
 * Weight Loss → -500 kcal
 * Muscle Gain → +300 kcal  
 * Maintenance → 0 kcal
 * Endurance → +400 kcal
 */
export function calculateTargetCalories(
  tdee: number, 
  goal: keyof typeof GOAL_ADJUSTMENTS
): { targetCalories: number; adjustment: number } {
  const adjustment = GOAL_ADJUSTMENTS[goal];
  const targetCalories = Math.round(tdee + adjustment);
  
  return {
    targetCalories,
    adjustment
  };
}

/**
 * Calculate macronutrient breakdown in grams
 * Protein: 4 calories per gram
 * Carbohydrates: 4 calories per gram
 * Fats: 9 calories per gram
 * Fiber: Recommended 14g per 1000 calories
 */
export function calculateMacronutrients(
  targetCalories: number,
  goal: keyof typeof MACRO_DISTRIBUTIONS
): MacronutrientBreakdown {
  const distribution = MACRO_DISTRIBUTIONS[goal];
  
  // Calculate calories for each macronutrient
  const proteinCalories = targetCalories * distribution.protein;
  const carbCalories = targetCalories * distribution.carbohydrates;
  const fatCalories = targetCalories * distribution.fats;
  
  // Convert to grams
  const protein = Math.round(proteinCalories / 4);
  const carbohydrates = Math.round(carbCalories / 4);
  const fats = Math.round(fatCalories / 9);
  
  // Calculate recommended fiber (14g per 1000 calories)
  const fiber = Math.round((targetCalories / 1000) * 14);
  
  return {
    protein,
    carbohydrates,
    fats,
    fiber
  };
}

/**
 * Generate personalized nutrition recommendations
 */
export function generateNutritionRecommendations(
  bmi: number,
  bmiCategory: string,
  goal: string,
  metrics: PersonalMetrics
): string[] {
  const recommendations: string[] = [];
  
  // BMI-based recommendations
  switch (bmiCategory) {
    case 'underweight':
      recommendations.push('Focus on nutrient-dense, calorie-rich foods to gain healthy weight');
      recommendations.push('Consider strength training to build muscle mass');
      break;
    case 'overweight':
    case 'obese':
      recommendations.push('Create a moderate caloric deficit for sustainable weight loss');
      recommendations.push('Prioritize protein to preserve muscle mass during weight loss');
      break;
    case 'normal':
      recommendations.push('Maintain your current weight with balanced nutrition');
      break;
  }
  
  // Goal-specific recommendations
  switch (goal) {
    case 'weight_loss':
      recommendations.push('Eat protein with every meal to maintain satiety');
      recommendations.push('Include plenty of vegetables for volume and nutrients');
      recommendations.push('Stay hydrated - aim for 8-10 glasses of water daily');
      break;
    case 'muscle_gain':
      recommendations.push('Consume protein within 2 hours post-workout');
      recommendations.push('Don\'t skip carbohydrates - they fuel your workouts');
      recommendations.push('Eat in a slight caloric surplus consistently');
      break;
    case 'endurance':
      recommendations.push('Prioritize carbohydrates for sustained energy');
      recommendations.push('Time carbohydrate intake around training sessions');
      recommendations.push('Consider electrolyte replacement during long sessions');
      break;
    case 'maintenance':
      recommendations.push('Focus on whole foods and balanced meals');
      recommendations.push('Listen to your hunger and fullness cues');
      break;
  }
  
  // Activity level recommendations
  if (metrics.activityLevel === 'sedentary') {
    recommendations.push('Consider increasing daily activity to boost metabolism');
  } else if (metrics.activityLevel === 'very_active') {
    recommendations.push('Ensure adequate recovery nutrition between intense sessions');
  }
  
  // Age-specific recommendations
  if (metrics.age >= 50) {
    recommendations.push('Prioritize protein intake to prevent age-related muscle loss');
    recommendations.push('Ensure adequate calcium and vitamin D for bone health');
  }
  
  return recommendations;
}

/**
 * Main function to calculate complete nutrition profile
 */
export function calculateNutritionProfile(
  metrics: PersonalMetrics,
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' = 'maintenance'
): NutritionCalculationResult {
  // Calculate BMI
  const bmi = calculateBMI(metrics.height, metrics.weight);
  const bmiCategory = categorizeBMI(bmi);
  
  // Calculate caloric needs
  const bmr = calculateBMR(metrics);
  const tdee = calculateTDEE(bmr, metrics.activityLevel);
  const { targetCalories, adjustment } = calculateTargetCalories(tdee, goal);
  
  const calorieRequirements: CalorieRequirements = {
    bmr,
    tdee,
    targetCalories,
    goalAdjustment: adjustment
  };
  
  // Calculate macronutrients
  const macronutrients = calculateMacronutrients(targetCalories, goal);
  
  // Generate recommendations
  const recommendations = generateNutritionRecommendations(
    bmi,
    bmiCategory,
    goal,
    metrics
  );
  
  return {
    bmi,
    bmiCategory,
    calorieRequirements,
    macronutrients,
    recommendations
  };
}

/**
 * Utility function to convert between metric and imperial units
 */
export const unitConversions = {
  // Weight conversions
  kgToLbs: (kg: number): number => Math.round(kg * 2.20462 * 10) / 10,
  lbsToKg: (lbs: number): number => Math.round(lbs / 2.20462 * 10) / 10,
  
  // Height conversions
  cmToInches: (cm: number): number => Math.round(cm / 2.54 * 10) / 10,
  inchesToCm: (inches: number): number => Math.round(inches * 2.54 * 10) / 10,
  
  // Height to feet and inches
  cmToFeetInches: (cm: number): { feet: number; inches: number } => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches % 12) * 10) / 10;
    return { feet, inches };
  },
  
  feetInchesToCm: (feet: number, inches: number): number => {
    return Math.round((feet * 12 + inches) * 2.54 * 10) / 10;
  }
};

/**
 * Validate user metrics for nutrition calculations
 */
export function validateMetrics(metrics: PersonalMetrics): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Height validation (reasonable range: 100-250 cm)
  if (metrics.height < 100 || metrics.height > 250) {
    errors.push('Height must be between 100-250 cm (3\'3" - 8\'2")');
  }
  
  // Weight validation (reasonable range: 30-300 kg)
  if (metrics.weight < 30 || metrics.weight > 300) {
    errors.push('Weight must be between 30-300 kg (66-661 lbs)');
  }
  
  // Age validation (reasonable range: 13-120 years)
  if (metrics.age < 13 || metrics.age > 120) {
    errors.push('Age must be between 13-120 years');
  }
  
  // Gender validation
  if (!['male', 'female', 'other'].includes(metrics.gender)) {
    errors.push('Gender must be male, female, or other');
  }
  
  // Activity level validation
  const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  if (!validActivityLevels.includes(metrics.activityLevel)) {
    errors.push('Activity level must be one of: sedentary, light, moderate, active, very_active');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}