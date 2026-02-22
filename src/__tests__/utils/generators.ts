/**
 * Fast-check generators for property-based testing
 * Centralized test data generators for consistent testing across the application
 */

import * as fc from 'fast-check';
import { UserProfile, PersonalMetrics, UserPreferences } from '@/types/auth';
import { Exercise, ExerciseCategory, MuscleGroup, Equipment } from '@/types/exercise';

// ============================================================================
// Basic Data Generators
// ============================================================================

/**
 * Safe email generator that produces valid email addresses
 */
export const safeEmailArbitrary = fc
  .string({ minLength: 3, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9]/g, 'a'))
  .filter(s => s.length >= 3)
  .map(s => `${s}@example.com`);

/**
 * Safe password generator that meets minimum requirements
 */
export const safePasswordArbitrary = fc
  .string({ minLength: 6, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9]/g, 'A'))
  .filter(s => s.length >= 6);

/**
 * Safe display name generator
 */
export const safeDisplayNameArbitrary = fc
  .string({ minLength: 1, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A'))
  .filter(s => s.trim().length >= 1);

/**
 * Safe UID generator for Firebase users
 */
export const safeUidArbitrary = fc
  .string({ minLength: 10, maxLength: 30 })
  .map(s => s.replace(/[^a-zA-Z0-9]/g, 'u'));

// ============================================================================
// User Profile Generators
// ============================================================================

/**
 * Personal metrics generator with realistic constraints
 */
export const personalMetricsArbitrary = fc.record({
  height: fc.float({ min: Math.fround(100), max: Math.fround(250), noNaN: true }),
  weight: fc.float({ min: Math.fround(30), max: Math.fround(300), noNaN: true }),
  age: fc.integer({ min: 13, max: 120 }),
  gender: fc.constantFrom('male', 'female', 'other'),
  activityLevel: fc.constantFrom('sedentary', 'light', 'moderate', 'active', 'very_active'),
  fitnessGoals: fc.array(
    fc.constantFrom(
      'Weight Loss',
      'Muscle Gain',
      'Endurance',
      'Strength',
      'Flexibility',
      'General Fitness'
    ),
    { minLength: 1, maxLength: 5 }
  ),
}) as fc.Arbitrary<PersonalMetrics>;

/**
 * User preferences generator
 */
export const userPreferencesArbitrary = fc.record({
  units: fc.constantFrom('metric', 'imperial'),
  theme: fc.constantFrom('light', 'dark', 'auto'),
  notifications: fc.record({
    workoutReminders: fc.boolean(),
    progressUpdates: fc.boolean(),
    socialUpdates: fc.boolean(),
    systemUpdates: fc.boolean(),
  }),
  privacy: fc.record({
    profileVisibility: fc.constantFrom('public', 'friends', 'private'),
    shareProgress: fc.boolean(),
    shareWorkouts: fc.boolean(),
  }),
}) as fc.Arbitrary<UserPreferences>;

/**
 * Complete user profile generator
 */
export const userProfileArbitrary = fc.record({
  uid: safeUidArbitrary,
  email: safeEmailArbitrary,
  displayName: safeDisplayNameArbitrary,
  personalMetrics: personalMetricsArbitrary,
  preferences: userPreferencesArbitrary,
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
}) as fc.Arbitrary<UserProfile>;

/**
 * Firebase user object generator
 */
export const firebaseUserArbitrary = fc.record({
  uid: safeUidArbitrary,
  email: safeEmailArbitrary,
  displayName: fc.option(safeDisplayNameArbitrary, { nil: null }),
  photoURL: fc.option(fc.constant('https://example.com/photo.jpg'), { nil: null }),
});

/**
 * User registration data generator
 */
export const userRegistrationDataArbitrary = fc.record({
  email: safeEmailArbitrary,
  password: safePasswordArbitrary,
  displayName: safeDisplayNameArbitrary,
});

// ============================================================================
// Exercise Data Generators
// ============================================================================

/**
 * Exercise category generator
 */
export const exerciseCategoryArbitrary = fc.constantFrom(
  'strength',
  'cardio',
  'flexibility',
  'balance',
  'sports',
  'rehabilitation'
) as fc.Arbitrary<ExerciseCategory>;

/**
 * Muscle group generator
 */
export const muscleGroupArbitrary = fc.constantFrom(
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'glutes',
  'calves',
  'full_body'
) as fc.Arbitrary<MuscleGroup>;

/**
 * Equipment generator
 */
export const equipmentArbitrary = fc.constantFrom(
  'none',
  'dumbbells',
  'barbell',
  'resistance_bands',
  'kettlebell',
  'pull_up_bar',
  'bench',
  'yoga_mat',
  'treadmill',
  'stationary_bike'
) as fc.Arbitrary<Equipment>;

/**
 * Exercise generator with realistic data
 */
export const exerciseArbitrary = fc.record({
  id: safeUidArbitrary,
  name: fc.string({ minLength: 3, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A')),
  category: exerciseCategoryArbitrary,
  targetMuscles: fc.array(muscleGroupArbitrary, { minLength: 1, maxLength: 3 }),
  equipment: fc.array(equipmentArbitrary, { minLength: 0, maxLength: 2 }),
  difficulty: fc.constantFrom('beginner', 'intermediate', 'advanced'),
  instructions: fc.array(
    fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
    { minLength: 3, maxLength: 8 }
  ),
  commonMistakes: fc.array(
    fc.string({ minLength: 10, maxLength: 80 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
    { minLength: 1, maxLength: 5 }
  ),
  safetyTips: fc.array(
    fc.string({ minLength: 10, maxLength: 80 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
    { minLength: 1, maxLength: 5 }
  ),
  mediaAssets: fc.record({
    images: fc.array(fc.constant('https://example.com/image.jpg'), { maxLength: 3 }),
    videos: fc.array(fc.constant('https://example.com/video.mp4'), { maxLength: 2 }),
    demonstrations: fc.array(fc.constant('https://example.com/demo.gif'), { maxLength: 2 }),
  }),
  poseKeypoints: fc.array(
    fc.record({
      name: fc.constantFrom('nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'),
      x: fc.float({ min: 0, max: 1 }),
      y: fc.float({ min: 0, max: 1 }),
      visibility: fc.float({ min: 0, max: 1 }),
    }),
    { maxLength: 10 }
  ),
  metadata: fc.record({
    createdBy: safeUidArbitrary,
    verified: fc.boolean(),
    popularity: fc.integer({ min: 0, max: 1000 }),
    tags: fc.array(
      fc.string({ minLength: 3, maxLength: 15 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a')),
      { maxLength: 5 }
    ),
  }),
}) as fc.Arbitrary<Exercise>;

// ============================================================================
// Workout Data Generators
// ============================================================================

/**
 * Workout session generator
 */
export const workoutSessionArbitrary = fc.record({
  id: safeUidArbitrary,
  userId: safeUidArbitrary,
  exercises: fc.array(
    fc.record({
      exerciseId: safeUidArbitrary,
      sets: fc.array(
        fc.record({
          reps: fc.integer({ min: 1, max: 50 }),
          weight: fc.option(fc.float({ min: 0, max: 500 }), { nil: null }),
          duration: fc.option(fc.integer({ min: 10, max: 3600 }), { nil: null }),
          restTime: fc.integer({ min: 30, max: 300 }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      formScores: fc.array(fc.float({ min: Math.fround(0), max: Math.fround(1) }), { maxLength: 5 }),
      feedback: fc.array(
        fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
        { maxLength: 3 }
      ),
      duration: fc.integer({ min: 60, max: 1800 }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  startTime: fc.date(),
  endTime: fc.date(),
  totalDuration: fc.integer({ min: 300, max: 7200 }),
  averageFormScore: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
  caloriesBurned: fc.integer({ min: 50, max: 1000 }),
  notes: fc.option(
    fc.string({ minLength: 10, maxLength: 200 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
    { nil: null }
  ),
});

// ============================================================================
// Diet Plan Generators
// ============================================================================

/**
 * Meal generator
 */
export const mealArbitrary = fc.record({
  id: safeUidArbitrary,
  name: fc.string({ minLength: 5, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A')),
  ingredients: fc.array(
    fc.record({
      name: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A')),
      amount: fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
      unit: fc.constantFrom('g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece'),
      calories: fc.integer({ min: 1, max: 500 }),
      macros: fc.record({
        protein: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        carbohydrates: fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
        fats: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        fiber: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
      }),
    }),
    { minLength: 2, maxLength: 10 }
  ),
  instructions: fc.array(
    fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
    { minLength: 3, maxLength: 8 }
  ),
  prepTime: fc.integer({ min: 5, max: 120 }),
  calories: fc.integer({ min: 50, max: 1500 }),
  macros: fc.record({
    protein: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
    carbohydrates: fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
    fats: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
    fiber: fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
  }),
});

/**
 * Diet plan generator
 */
export const dietPlanArbitrary = fc.record({
  id: safeUidArbitrary,
  userId: safeUidArbitrary,
  planType: fc.constantFrom('weight_loss', 'muscle_gain', 'maintenance', 'endurance'),
  dailyCalories: fc.integer({ min: 1200, max: 4000 }),
  macronutrients: fc.record({
    protein: fc.float({ min: Math.fround(10), max: Math.fround(200), noNaN: true }),
    carbohydrates: fc.float({ min: Math.fround(20), max: Math.fround(400), noNaN: true }),
    fats: fc.float({ min: Math.fround(15), max: Math.fround(150), noNaN: true }),
    fiber: fc.float({ min: Math.fround(20), max: Math.fround(50), noNaN: true }),
  }),
  meals: fc.array(
    fc.record({
      day: fc.integer({ min: 1, max: 7 }),
      meals: fc.record({
        breakfast: mealArbitrary,
        lunch: mealArbitrary,
        dinner: mealArbitrary,
        snacks: fc.array(mealArbitrary, { maxLength: 3 }),
      }),
      totalCalories: fc.integer({ min: 1200, max: 4000 }),
      macroBreakdown: fc.record({
        protein: fc.float({ min: Math.fround(10), max: Math.fround(200), noNaN: true }),
        carbohydrates: fc.float({ min: Math.fround(20), max: Math.fround(400), noNaN: true }),
        fats: fc.float({ min: Math.fround(15), max: Math.fround(150), noNaN: true }),
        fiber: fc.float({ min: Math.fround(20), max: Math.fround(50), noNaN: true }),
      }),
    }),
    { minLength: 1, maxLength: 7 }
  ),
  duration: fc.integer({ min: 7, max: 90 }),
  restrictions: fc.array(
    fc.constantFrom('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb'),
    { maxLength: 3 }
  ),
  generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  lastModified: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
});

// ============================================================================
// AI/ML Data Generators
// ============================================================================

/**
 * Pose landmark generator for computer vision testing
 */
export const poseLandmarkArbitrary = fc.record({
  x: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
  y: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
  z: fc.float({ min: Math.fround(-1), max: Math.fround(1) }),
  visibility: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
});

/**
 * Form analysis generator
 */
export const formAnalysisArbitrary = fc.record({
  exerciseId: safeUidArbitrary,
  correctness: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
  issues: fc.array(
    fc.record({
      type: fc.constantFrom('posture', 'alignment', 'range_of_motion', 'timing'),
      severity: fc.constantFrom('low', 'medium', 'high'),
      description: fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
      correction: fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
      affectedJoints: fc.array(
        fc.constantFrom('shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'),
        { maxLength: 3 }
      ),
    }),
    { maxLength: 5 }
  ),
  suggestions: fc.array(
    fc.string({ minLength: 10, maxLength: 80 }).map(s => s.replace(/[^a-zA-Z0-9 .,]/g, 'A')),
    { maxLength: 3 }
  ),
  keyPointAccuracy: fc.array(
    fc.record({
      joint: fc.constantFrom('shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'),
      accuracy: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
    }),
    { maxLength: 10 }
  ),
});

/**
 * Chat message generator
 */
export const chatMessageArbitrary = fc.record({
  id: safeUidArbitrary,
  role: fc.constantFrom('user', 'assistant'),
  content: fc.string({ minLength: 5, maxLength: 200 }).map(s => s.replace(/[^a-zA-Z0-9 .,?!]/g, 'A')),
  timestamp: fc.date(),
  metadata: fc.record({
    confidence: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1) }), { nil: null }),
    sources: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 }), { nil: null }),
    actions: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 20 }), { maxLength: 2 }), { nil: null }),
  }),
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a valid user profile with consistent data relationships
 */
export const generateValidUserProfile = (): UserProfile => {
  return fc.sample(userProfileArbitrary, 1)[0];
};

/**
 * Generate multiple user profiles for testing
 */
export const generateUserProfiles = (count: number): UserProfile[] => {
  return fc.sample(userProfileArbitrary, count);
};

/**
 * Generate a valid exercise with consistent data
 */
export const generateValidExercise = (): Exercise => {
  return fc.sample(exerciseArbitrary, 1)[0];
};

/**
 * Generate multiple exercises for testing
 */
export const generateExercises = (count: number): Exercise[] => {
  return fc.sample(exerciseArbitrary, count);
};

/**
 * Generate test data with specific constraints
 */
export const generateConstrainedData = <T>(
  arbitrary: fc.Arbitrary<T>,
  constraints: Partial<T>
): T => {
  const generated = fc.sample(arbitrary, 1)[0];
  return { ...generated, ...constraints };
};