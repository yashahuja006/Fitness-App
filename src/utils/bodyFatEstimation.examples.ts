/**
 * Body Fat Estimation - Usage Examples
 * 
 * Demonstrates how to integrate body fat estimation into the AI Nutrition Engine
 */

import {
  getBodyFatPercentage,
  estimateBodyFatPercentage,
  validateBodyFatPercentage,
  getBodyFatCategory,
  type NavyMethodMeasurements,
  type JacksonPollockMeasurements
} from './bodyFatEstimation';
import { UserProfileExtended } from '@/types/nutrition';

/**
 * Example 1: Basic usage - Get body fat (actual or estimated)
 */
export function example1_BasicUsage() {
  const profile: UserProfileExtended = {
    height: 180,
    weight: 80,
    age: 30,
    gender: 'male',
    // body_fat_percentage not provided - will be estimated
    activity_level: 'moderate',
    goal: 'muscle_gain',
    diet_type: 'standard',
    meals_per_day: 4,
    snacks_per_day: 1,
    cooking_time: 'moderate',
    cuisine_preference: ['italian', 'asian'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 4,
    subscription_tier: 'free',
    plan_duration_weeks: 8
  };

  const result = getBodyFatPercentage(profile);

  console.log('=== Example 1: Basic Usage ===');
  console.log(`Body Fat: ${result.value}%`);
  console.log(`Is Estimated: ${result.isEstimated}`);
  
  if (result.isEstimated && result.estimation) {
    console.log(`Method: ${result.estimation.recommended.method}`);
    console.log(`Confidence: ${result.estimation.recommended.confidence}`);
    console.log(`Range: ${result.estimation.range.min}% - ${result.estimation.range.max}%`);
  }
}

/**
 * Example 2: With Navy Method measurements for higher accuracy
 */
export function example2_WithNavyMeasurements() {
  const profile: UserProfileExtended = {
    height: 165,
    weight: 65,
    age: 28,
    gender: 'female',
    activity_level: 'active',
    goal: 'fat_loss',
    diet_type: 'vegetarian',
    meals_per_day: 4,
    snacks_per_day: 2,
    cooking_time: 'quick',
    cuisine_preference: ['mediterranean'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 5,
    subscription_tier: 'pro',
    plan_duration_weeks: 12
  };

  const navyMeasurements: NavyMethodMeasurements = {
    neck: 32,
    waist: 70,
    hip: 95  // Required for females
  };

  const result = estimateBodyFatPercentage(profile, navyMeasurements);

  console.log('\n=== Example 2: With Navy Measurements ===');
  console.log(`Recommended: ${result.recommended.percentage}% (${result.recommended.method})`);
  console.log(`Confidence: ${result.recommended.confidence}`);
  console.log('\nAlternative Methods:');
  result.alternatives.forEach(alt => {
    console.log(`  - ${alt.percentage}% (${alt.method}, ${alt.confidence} confidence)`);
  });
  console.log(`\nAverage: ${result.averageEstimate}%`);
  console.log(`Range: ${result.range.min}% - ${result.range.max}%`);
}

/**
 * Example 3: With Jackson-Pollock skinfold measurements
 */
export function example3_WithSkinfoldMeasurements() {
  const profile: UserProfileExtended = {
    height: 175,
    weight: 75,
    age: 25,
    gender: 'male',
    activity_level: 'very_active',
    goal: 'recomposition',
    diet_type: 'paleo',
    meals_per_day: 5,
    snacks_per_day: 1,
    cooking_time: 'moderate',
    cuisine_preference: ['american', 'mexican'],
    budget_level: 'high',
    training_level: 'advanced',
    workout_days_per_week: 6,
    subscription_tier: 'pro',
    plan_duration_weeks: 8
  };

  const jpMeasurements: JacksonPollockMeasurements = {
    chest: 8,
    abdomen: 15,
    thigh: 12
  };

  const result = estimateBodyFatPercentage(profile, undefined, jpMeasurements);

  console.log('\n=== Example 3: With Skinfold Measurements ===');
  console.log(`Recommended: ${result.recommended.percentage}% (${result.recommended.method})`);
  console.log(`Confidence: ${result.recommended.confidence}`);
  console.log(`Category: ${getBodyFatCategory(result.recommended.percentage, profile.gender)}`);
}

/**
 * Example 4: User provided actual measurement
 */
export function example4_ActualMeasurement() {
  const profile: UserProfileExtended = {
    height: 180,
    weight: 80,
    age: 30,
    gender: 'male',
    body_fat_percentage: 15,  // User provided actual measurement
    activity_level: 'moderate',
    goal: 'muscle_gain',
    diet_type: 'standard',
    meals_per_day: 4,
    snacks_per_day: 1,
    cooking_time: 'moderate',
    cuisine_preference: ['italian'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 4,
    subscription_tier: 'free',
    plan_duration_weeks: 8
  };

  const result = getBodyFatPercentage(profile);

  console.log('\n=== Example 4: Actual Measurement ===');
  console.log(`Body Fat: ${result.value}%`);
  console.log(`Is Estimated: ${result.isEstimated}`);
  console.log('Using actual measurement provided by user');
}

/**
 * Example 5: Validation and error handling
 */
export function example5_ValidationAndErrorHandling() {
  console.log('\n=== Example 5: Validation ===');

  // Valid body fat
  const valid = validateBodyFatPercentage(15, 'male');
  console.log(`15% for male: ${valid.isValid ? 'Valid' : 'Invalid'}`);

  // Warning case
  const warning = validateBodyFatPercentage(4, 'male');
  console.log(`4% for male: ${warning.isValid ? 'Valid' : 'Invalid'}`);
  if (warning.message) console.log(`  Warning: ${warning.message}`);

  // Invalid case
  const invalid = validateBodyFatPercentage(2, 'male');
  console.log(`2% for male: ${invalid.isValid ? 'Valid' : 'Invalid'}`);
  if (invalid.message) console.log(`  Error: ${invalid.message}`);

  // Female warning
  const femaleWarning = validateBodyFatPercentage(10, 'female');
  console.log(`10% for female: ${femaleWarning.isValid ? 'Valid' : 'Invalid'}`);
  if (femaleWarning.message) console.log(`  Warning: ${femaleWarning.message}`);
}

/**
 * Example 6: Integration with metabolic calculations
 */
export function example6_MetabolicIntegration() {
  const profile: UserProfileExtended = {
    height: 180,
    weight: 80,
    age: 30,
    gender: 'male',
    activity_level: 'moderate',
    goal: 'fat_loss',
    diet_type: 'standard',
    meals_per_day: 4,
    snacks_per_day: 1,
    cooking_time: 'moderate',
    cuisine_preference: ['italian'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 4,
    subscription_tier: 'free',
    plan_duration_weeks: 8
  };

  // Get body fat percentage
  const bodyFatResult = getBodyFatPercentage(profile);
  const bodyFat = bodyFatResult.value;

  // Calculate lean body mass
  const leanBodyMass = profile.weight * (1 - bodyFat / 100);
  const fatMass = profile.weight - leanBodyMass;

  console.log('\n=== Example 6: Metabolic Integration ===');
  console.log(`Total Weight: ${profile.weight} kg`);
  console.log(`Body Fat: ${bodyFat}% (${bodyFatResult.isEstimated ? 'estimated' : 'actual'})`);
  console.log(`Lean Body Mass: ${leanBodyMass.toFixed(1)} kg`);
  console.log(`Fat Mass: ${fatMass.toFixed(1)} kg`);
  console.log(`Category: ${getBodyFatCategory(bodyFat, profile.gender)}`);

  // Use lean body mass for more accurate protein calculations
  const proteinPerKgLBM = 2.2; // For fat loss
  const proteinTarget = leanBodyMass * proteinPerKgLBM;
  console.log(`\nProtein Target (based on LBM): ${proteinTarget.toFixed(0)}g/day`);
}

/**
 * Example 7: UI display helper
 */
export function example7_UIDisplayHelper(profile: UserProfileExtended) {
  const result = getBodyFatPercentage(profile);
  
  return {
    display: {
      value: `${result.value}%`,
      badge: result.isEstimated ? 'Estimated' : 'Actual',
      category: getBodyFatCategory(result.value, profile.gender),
      confidence: result.isEstimated ? result.estimation?.recommended.confidence : 'actual'
    },
    details: result.isEstimated ? {
      method: result.estimation?.recommended.method,
      range: `${result.estimation?.range.min}% - ${result.estimation?.range.max}%`,
      average: `${result.estimation?.averageEstimate}%`,
      disclaimer: result.estimation?.disclaimer,
      alternatives: result.estimation?.alternatives.map(alt => ({
        value: `${alt.percentage}%`,
        method: alt.method,
        confidence: alt.confidence
      }))
    } : null,
    actions: {
      canOverride: true,
      overrideLabel: result.isEstimated ? 'Enter actual measurement' : 'Update measurement'
    }
  };
}

/**
 * Example 8: Progressive profile building
 */
export function example8_ProgressiveProfileBuilding() {
  console.log('\n=== Example 8: Progressive Profile Building ===');

  // Step 1: Basic profile (no body fat)
  const basicProfile: UserProfileExtended = {
    height: 180,
    weight: 80,
    age: 30,
    gender: 'male',
    activity_level: 'moderate',
    goal: 'muscle_gain',
    diet_type: 'standard',
    meals_per_day: 4,
    snacks_per_day: 1,
    cooking_time: 'moderate',
    cuisine_preference: ['italian'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 4,
    subscription_tier: 'free',
    plan_duration_weeks: 8
  };

  const step1 = getBodyFatPercentage(basicProfile);
  console.log('Step 1 - Basic estimate:');
  console.log(`  ${step1.value}% (${step1.estimation?.recommended.method})`);
  console.log(`  Confidence: ${step1.estimation?.recommended.confidence}`);

  // Step 2: User provides Navy measurements
  const navyMeasurements: NavyMethodMeasurements = {
    neck: 38,
    waist: 85
  };

  const step2 = estimateBodyFatPercentage(basicProfile, navyMeasurements);
  console.log('\nStep 2 - With Navy measurements:');
  console.log(`  ${step2.recommended.percentage}% (${step2.recommended.method})`);
  console.log(`  Confidence: ${step2.recommended.confidence}`);
  console.log(`  Improvement: ${step1.estimation?.recommended.confidence} → ${step2.recommended.confidence}`);

  // Step 3: User gets DEXA scan and provides actual measurement
  const finalProfile = { ...basicProfile, body_fat_percentage: 16.5 };
  const step3 = getBodyFatPercentage(finalProfile);
  console.log('\nStep 3 - Actual DEXA measurement:');
  console.log(`  ${step3.value}% (actual measurement)`);
  console.log(`  No estimation needed`);
}

// Run all examples
if (require.main === module) {
  example1_BasicUsage();
  example2_WithNavyMeasurements();
  example3_WithSkinfoldMeasurements();
  example4_ActualMeasurement();
  example5_ValidationAndErrorHandling();
  example6_MetabolicIntegration();
  
  console.log('\n=== Example 7: UI Display Helper ===');
  const sampleProfile: UserProfileExtended = {
    height: 180,
    weight: 80,
    age: 30,
    gender: 'male',
    activity_level: 'moderate',
    goal: 'muscle_gain',
    diet_type: 'standard',
    meals_per_day: 4,
    snacks_per_day: 1,
    cooking_time: 'moderate',
    cuisine_preference: ['italian'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 4,
    subscription_tier: 'free',
    plan_duration_weeks: 8
  };
  console.log(JSON.stringify(example7_UIDisplayHelper(sampleProfile), null, 2));
  
  example8_ProgressiveProfileBuilding();
}
