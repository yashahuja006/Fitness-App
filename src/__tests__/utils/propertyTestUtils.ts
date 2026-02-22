/**
 * Property-based testing utilities for fitness app domain
 * Provides specialized generators and test helpers for property-based testing
 */

import * as fc from 'fast-check';
import { TEST_CONFIG } from '../config/testConfig';
import {
  userProfileArbitrary,
  exerciseArbitrary,
  workoutSessionArbitrary,
  dietPlanArbitrary,
  formAnalysisArbitrary,
  chatMessageArbitrary,
  safeUidArbitrary,
  safeEmailArbitrary,
  safePasswordArbitrary,
  safeDisplayNameArbitrary,
  personalMetricsArbitrary,
  userPreferencesArbitrary,
} from './generators';

// ============================================================================
// Property Test Configuration
// ============================================================================

/**
 * Default configuration for property-based tests
 */
export const DEFAULT_PBT_CONFIG = TEST_CONFIG.PBT.DEFAULT;

/**
 * Fast configuration for quick feedback during development
 */
export const FAST_PBT_CONFIG = TEST_CONFIG.PBT.FAST;

/**
 * Thorough configuration for comprehensive testing
 */
export const THOROUGH_PBT_CONFIG = TEST_CONFIG.PBT.THOROUGH;

// ============================================================================
// Domain-Specific Property Generators
// ============================================================================

/**
 * Generates valid authentication scenarios
 */
export const authenticationScenarioArbitrary = fc.record({
  action: fc.constantFrom('register', 'login', 'logout', 'resetPassword', 'updateProfile'),
  userData: fc.record({
    uid: safeUidArbitrary,
    email: safeEmailArbitrary,
    displayName: safeDisplayNameArbitrary,
    personalMetrics: personalMetricsArbitrary,
    preferences: userPreferencesArbitrary,
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  }),
  credentials: fc.record({
    email: safeEmailArbitrary,
    password: safePasswordArbitrary,
  }),
  expectedOutcome: fc.constantFrom('success', 'failure', 'pending'),
});

/**
 * Generates exercise search scenarios
 */
export const exerciseSearchScenarioArbitrary = fc.record({
  query: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A')),
  filters: fc.record({
    category: fc.option(fc.constantFrom('strength', 'cardio', 'flexibility', 'balance')),
    difficulty: fc.option(fc.constantFrom('beginner', 'intermediate', 'advanced')),
    equipment: fc.option(fc.constantFrom('none', 'dumbbells', 'barbell', 'resistance_bands')),
    targetMuscles: fc.option(fc.array(fc.constantFrom('chest', 'back', 'legs', 'arms'), { maxLength: 3 })),
  }),
  expectedResults: fc.array(exerciseArbitrary, { maxLength: 20 }),
});

/**
 * Generates workout tracking scenarios
 */
export const workoutTrackingScenarioArbitrary = fc.record({
  session: workoutSessionArbitrary,
  userProfile: userProfileArbitrary,
  expectedMetrics: fc.record({
    duration: fc.integer({ min: 300, max: 7200 }),
    caloriesBurned: fc.integer({ min: 50, max: 1000 }),
    averageFormScore: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
    completionRate: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
  }),
});

/**
 * Generates diet plan generation scenarios
 */
export const dietPlanScenarioArbitrary = fc.record({
  userMetrics: fc.record({
    height: fc.float({ min: Math.fround(50), max: Math.fround(300) }),
    weight: fc.float({ min: Math.fround(20), max: Math.fround(500) }),
    age: fc.integer({ min: 13, max: 120 }),
    gender: fc.constantFrom('male', 'female', 'other'),
    activityLevel: fc.constantFrom('sedentary', 'light', 'moderate', 'active', 'very_active'),
    fitnessGoals: fc.array(fc.constantFrom('weight_loss', 'muscle_gain', 'maintenance'), { minLength: 1, maxLength: 3 }),
  }),
  dietaryRestrictions: fc.array(fc.constantFrom('vegetarian', 'vegan', 'gluten_free', 'dairy_free'), { maxLength: 3 }),
  expectedPlan: dietPlanArbitrary,
});

/**
 * Generates AI form correction scenarios
 */
export const formCorrectionScenarioArbitrary = fc.record({
  exerciseId: fc.string({ minLength: 5, maxLength: 20 }),
  poseLandmarks: fc.array(
    fc.record({
      x: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
      y: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
      z: fc.float({ min: Math.fround(-1), max: Math.fround(1) }),
      visibility: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
    }),
    { minLength: 10, maxLength: 33 }
  ),
  expectedAnalysis: formAnalysisArbitrary,
});

/**
 * Generates chatbot interaction scenarios
 */
export const chatbotScenarioArbitrary = fc.record({
  userQuery: fc.string({ minLength: 5, maxLength: 200 }).map(s => s.replace(/[^a-zA-Z0-9 .,?!]/g, 'A')),
  context: fc.record({
    previousMessages: fc.array(chatMessageArbitrary, { maxLength: 10 }),
    userProfile: userProfileArbitrary,
    currentTopic: fc.constantFrom('exercise', 'nutrition', 'form', 'general'),
  }),
  expectedResponse: chatMessageArbitrary,
});

// ============================================================================
// Property Test Helpers
// ============================================================================

/**
 * Creates a property test for authentication functionality
 */
export const createAuthenticationProperty = (
  testFn: (scenario: any) => Promise<boolean> | boolean,
  config = DEFAULT_PBT_CONFIG
) => {
  return fc.assert(
    fc.asyncProperty(authenticationScenarioArbitrary, testFn),
    config
  );
};

/**
 * Creates a property test for exercise search functionality
 */
export const createExerciseSearchProperty = (
  testFn: (scenario: any) => Promise<boolean> | boolean,
  config = DEFAULT_PBT_CONFIG
) => {
  return fc.assert(
    fc.asyncProperty(exerciseSearchScenarioArbitrary, testFn),
    config
  );
};

/**
 * Creates a property test for workout tracking functionality
 */
export const createWorkoutTrackingProperty = (
  testFn: (scenario: any) => Promise<boolean> | boolean,
  config = DEFAULT_PBT_CONFIG
) => {
  return fc.assert(
    fc.asyncProperty(workoutTrackingScenarioArbitrary, testFn),
    config
  );
};

/**
 * Creates a property test for diet plan generation functionality
 */
export const createDietPlanProperty = (
  testFn: (scenario: any) => Promise<boolean> | boolean,
  config = DEFAULT_PBT_CONFIG
) => {
  return fc.assert(
    fc.asyncProperty(dietPlanScenarioArbitrary, testFn),
    config
  );
};

/**
 * Creates a property test for AI form correction functionality
 */
export const createFormCorrectionProperty = (
  testFn: (scenario: any) => Promise<boolean> | boolean,
  config = DEFAULT_PBT_CONFIG
) => {
  return fc.assert(
    fc.asyncProperty(formCorrectionScenarioArbitrary, testFn),
    config
  );
};

/**
 * Creates a property test for chatbot functionality
 */
export const createChatbotProperty = (
  testFn: (scenario: any) => Promise<boolean> | boolean,
  config = DEFAULT_PBT_CONFIG
) => {
  return fc.assert(
    fc.asyncProperty(chatbotScenarioArbitrary, testFn),
    config
  );
};

// ============================================================================
// Property Validation Helpers
// ============================================================================

/**
 * Validates that a user profile maintains data integrity
 */
export const validateUserProfileIntegrity = (profile: any): boolean => {
  if (!profile || typeof profile !== 'object') return false;
  
  // Required fields
  if (!profile.uid || !profile.email || !profile.displayName) return false;
  
  // Personal metrics validation
  if (!profile.personalMetrics) return false;
  const metrics = profile.personalMetrics;
  if (metrics.height <= 0 || metrics.weight <= 0 || metrics.age <= 0) return false;
  if (!['male', 'female', 'other'].includes(metrics.gender)) return false;
  if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(metrics.activityLevel)) return false;
  if (!Array.isArray(metrics.fitnessGoals) || metrics.fitnessGoals.length === 0) return false;
  
  // Preferences validation
  if (!profile.preferences) return false;
  const prefs = profile.preferences;
  if (!['metric', 'imperial'].includes(prefs.units)) return false;
  if (!['light', 'dark', 'auto'].includes(prefs.theme)) return false;
  if (!prefs.notifications || !prefs.privacy) return false;
  
  // Timestamps validation
  if (!profile.createdAt || !profile.updatedAt) return false;
  if (!(profile.createdAt instanceof Date) || !(profile.updatedAt instanceof Date)) return false;
  
  return true;
};

/**
 * Validates that an exercise has complete and valid data
 */
export const validateExerciseCompleteness = (exercise: any): boolean => {
  if (!exercise || typeof exercise !== 'object') return false;
  
  // Required fields
  if (!exercise.id || !exercise.name || !exercise.category) return false;
  if (!Array.isArray(exercise.targetMuscles) || exercise.targetMuscles.length === 0) return false;
  if (!Array.isArray(exercise.equipment)) return false;
  if (!['beginner', 'intermediate', 'advanced'].includes(exercise.difficulty)) return false;
  if (!Array.isArray(exercise.instructions) || exercise.instructions.length === 0) return false;
  
  // Optional but structured fields
  if (exercise.commonMistakes && !Array.isArray(exercise.commonMistakes)) return false;
  if (exercise.safetyTips && !Array.isArray(exercise.safetyTips)) return false;
  if (exercise.mediaAssets && typeof exercise.mediaAssets !== 'object') return false;
  if (exercise.poseKeypoints && !Array.isArray(exercise.poseKeypoints)) return false;
  if (!exercise.metadata || typeof exercise.metadata !== 'object') return false;
  
  return true;
};

/**
 * Validates that a workout session has consistent data
 */
export const validateWorkoutSessionConsistency = (session: any): boolean => {
  if (!session || typeof session !== 'object') return false;
  
  // Required fields
  if (!session.id || !session.userId) return false;
  if (!Array.isArray(session.exercises) || session.exercises.length === 0) return false;
  if (!session.startTime || !session.endTime) return false;
  if (!(session.startTime instanceof Date) || !(session.endTime instanceof Date)) return false;
  
  // Time consistency
  if (session.startTime >= session.endTime) return false;
  
  // Duration consistency
  const actualDuration = (session.endTime.getTime() - session.startTime.getTime()) / 1000;
  const reportedDuration = session.totalDuration;
  if (Math.abs(actualDuration - reportedDuration) > 60) return false; // Allow 1 minute tolerance
  
  // Exercise data validation
  for (const exercise of session.exercises) {
    if (!exercise.exerciseId) return false;
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) return false;
    if (exercise.formScores && !Array.isArray(exercise.formScores)) return false;
    if (exercise.feedback && !Array.isArray(exercise.feedback)) return false;
  }
  
  // Score validation
  if (session.averageFormScore < 0 || session.averageFormScore > 1) return false;
  if (session.caloriesBurned < 0) return false;
  
  return true;
};

/**
 * Validates that a diet plan meets nutritional requirements
 */
export const validateDietPlanNutrition = (plan: any): boolean => {
  if (!plan || typeof plan !== 'object') return false;
  
  // Required fields
  if (!plan.id || !plan.userId) return false;
  if (!['weight_loss', 'muscle_gain', 'maintenance', 'endurance'].includes(plan.planType)) return false;
  if (plan.dailyCalories < 1000 || plan.dailyCalories > 5000) return false;
  
  // Macronutrient validation
  if (!plan.macronutrients) return false;
  const macros = plan.macronutrients;
  const totalMacros = macros.protein + macros.carbohydrates + macros.fats;
  if (Math.abs(totalMacros - 100) > 5) return false; // Allow 5% tolerance
  
  // Meal plan validation
  if (!Array.isArray(plan.meals) || plan.meals.length === 0) return false;
  for (const dayPlan of plan.meals) {
    if (!dayPlan.meals || !dayPlan.meals.breakfast || !dayPlan.meals.lunch || !dayPlan.meals.dinner) return false;
    if (dayPlan.totalCalories < 800 || dayPlan.totalCalories > 6000) return false;
  }
  
  // Duration validation
  if (plan.duration < 1 || plan.duration > 365) return false;
  
  return true;
};

/**
 * Validates that form analysis provides meaningful feedback
 */
export const validateFormAnalysisFeedback = (analysis: any): boolean => {
  if (!analysis || typeof analysis !== 'object') return false;
  
  // Required fields
  if (!analysis.exerciseId) return false;
  if (analysis.correctness < 0 || analysis.correctness > 1) return false;
  
  // Issues validation
  if (!Array.isArray(analysis.issues)) return false;
  for (const issue of analysis.issues) {
    if (!['posture', 'alignment', 'range_of_motion', 'timing'].includes(issue.type)) return false;
    if (!['low', 'medium', 'high'].includes(issue.severity)) return false;
    if (!issue.description || !issue.correction) return false;
    if (!Array.isArray(issue.affectedJoints)) return false;
  }
  
  // Suggestions validation
  if (!Array.isArray(analysis.suggestions)) return false;
  
  // Key point accuracy validation
  if (analysis.keyPointAccuracy && !Array.isArray(analysis.keyPointAccuracy)) return false;
  for (const accuracy of analysis.keyPointAccuracy || []) {
    if (accuracy.accuracy < 0 || accuracy.accuracy > 1) return false;
  }
  
  return true;
};

// ============================================================================
// Test Execution Utilities
// ============================================================================

/**
 * Runs a property test with error handling and reporting
 */
export const runPropertyTest = async (
  testName: string,
  propertyFn: () => Promise<void>,
  config = DEFAULT_PBT_CONFIG
): Promise<{ success: boolean; error?: Error; duration: number }> => {
  const startTime = performance.now();
  
  try {
    await propertyFn();
    const endTime = performance.now();
    
    return {
      success: true,
      duration: endTime - startTime,
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      success: false,
      error: error as Error,
      duration: endTime - startTime,
    };
  }
};

/**
 * Runs multiple property tests in parallel
 */
export const runPropertyTestSuite = async (
  tests: Array<{ name: string; test: () => Promise<void> }>,
  config = DEFAULT_PBT_CONFIG
): Promise<Array<{ name: string; success: boolean; error?: Error; duration: number }>> => {
  const results = await Promise.allSettled(
    tests.map(async ({ name, test }) => {
      const result = await runPropertyTest(name, test, config);
      return { name, ...result };
    })
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: tests[index].name,
        success: false,
        error: result.reason,
        duration: 0,
      };
    }
  });
};

/**
 * Generates a property test report
 */
export const generatePropertyTestReport = (
  results: Array<{ name: string; success: boolean; error?: Error; duration: number }>
): string => {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  let report = `Property Test Report\n`;
  report += `==================\n`;
  report += `Total Tests: ${totalTests}\n`;
  report += `Passed: ${passedTests}\n`;
  report += `Failed: ${failedTests}\n`;
  report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`;
  report += `Total Duration: ${totalDuration.toFixed(2)}ms\n`;
  report += `Average Duration: ${(totalDuration / totalTests).toFixed(2)}ms\n\n`;
  
  if (failedTests > 0) {
    report += `Failed Tests:\n`;
    report += `=============\n`;
    results.filter(r => !r.success).forEach(result => {
      report += `- ${result.name}: ${result.error?.message || 'Unknown error'}\n`;
    });
  }
  
  return report;
};