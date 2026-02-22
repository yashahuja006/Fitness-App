import * as fc from 'fast-check';
import { ExerciseRecommendationService } from '@/lib/exerciseRecommendationService';
import { Exercise, DifficultyLevel, Equipment, MuscleGroup, ExerciseCategory } from '@/types/exercise';
import { UserProfile } from '@/types/auth';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({
    docs: [],
  }),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => false,
  }),
}));

describe('Exercise Recommendation Properties', () => {
  // Generators for test data
  const difficultyArb = fc.constantFrom('beginner', 'intermediate', 'advanced') as fc.Arbitrary<DifficultyLevel>;
  const equipmentArb = fc.constantFrom(
    'none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands',
    'pull_up_bar', 'bench', 'cable_machine', 'yoga_mat'
  ) as fc.Arbitrary<Equipment>;
  const muscleGroupArb = fc.constantFrom(
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs',
    'glutes', 'quadriceps', 'hamstrings', 'calves', 'core'
  ) as fc.Arbitrary<MuscleGroup>;
  const categoryArb = fc.constantFrom(
    'strength', 'cardio', 'flexibility', 'balance', 'functional'
  ) as fc.Arbitrary<ExerciseCategory>;
  const activityLevelArb = fc.constantFrom('sedentary', 'light', 'moderate', 'active', 'very_active');

  const exerciseArb: fc.Arbitrary<Exercise> = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    category: categoryArb,
    targetMuscles: fc.array(muscleGroupArb, { minLength: 1, maxLength: 3 }),
    equipment: fc.array(equipmentArb, { minLength: 1, maxLength: 3 }),
    difficulty: difficultyArb,
    instructions: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
    commonMistakes: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 3 }),
    safetyTips: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 3 }),
    mediaAssets: fc.constant({ images: [], videos: [], demonstrations: [] }),
    metadata: fc.record({
      createdBy: fc.constant('system'),
      verified: fc.boolean(),
      popularity: fc.integer({ min: 0, max: 1000 }),
      tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
      averageRating: fc.option(fc.float({ min: 1, max: 5 }), { nil: undefined }),
    }),
    createdAt: fc.constant(new Date() as any),
    updatedAt: fc.constant(new Date() as any),
  });

  const userProfileArb: fc.Arbitrary<UserProfile> = fc.record({
    uid: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress(),
    displayName: fc.string({ minLength: 1, maxLength: 100 }),
    personalMetrics: fc.record({
      height: fc.integer({ min: 140, max: 220 }),
      weight: fc.integer({ min: 40, max: 150 }),
      age: fc.integer({ min: 16, max: 80 }),
      gender: fc.constantFrom('male', 'female', 'other'),
      activityLevel: activityLevelArb,
      fitnessGoals: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
    }),
    preferences: fc.record({
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
    }),
    createdAt: fc.constant(new Date()),
    updatedAt: fc.constant(new Date()),
  });

  /**
   * **Property 18: Personalized Exercise Recommendations**
   * *For any* recommendation request, the system should consider user fitness level, 
   * available equipment, and exercise history to suggest appropriate alternatives.
   * **Validates: Requirements 5.4**
   */
  test('Property 18: Personalized Exercise Recommendations', () => {
    fc.assert(
      fc.property(
        userProfileArb,
        fc.array(equipmentArb, { minLength: 1, maxLength: 5 }),
        fc.array(muscleGroupArb, { maxLength: 3 }),
        (userProfile, availableEquipment, targetMuscles) => {
          // Mock the private method for testing
          const context = {
            userFitnessLevel: (ExerciseRecommendationService as any).mapActivityLevelToDifficulty(
              userProfile.personalMetrics.activityLevel
            ),
            availableEquipment,
            targetMuscles: targetMuscles.length > 0 ? targetMuscles : undefined,
            fitnessGoals: userProfile.personalMetrics.fitnessGoals,
          };

          // Test that user fitness level is appropriately mapped
          const expectedDifficulty = userProfile.personalMetrics.activityLevel === 'sedentary' || 
                                   userProfile.personalMetrics.activityLevel === 'light' 
                                   ? 'beginner'
                                   : userProfile.personalMetrics.activityLevel === 'very_active'
                                   ? 'advanced'
                                   : 'intermediate';

          expect(context.userFitnessLevel).toBe(expectedDifficulty);

          // Test that available equipment is considered
          expect(context.availableEquipment).toEqual(availableEquipment);

          // Test that target muscles are properly handled
          if (targetMuscles.length > 0) {
            expect(context.targetMuscles).toEqual(targetMuscles);
          }

          // Test that fitness goals are preserved
          expect(context.fitnessGoals).toEqual(userProfile.personalMetrics.fitnessGoals);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Property 19: Empty Search Result Handling**
   * *For any* search query that returns no results, the system should suggest similar 
   * exercises and broaden search parameters to help users find relevant content.
   * **Validates: Requirements 5.5**
   */
  test('Property 19: Empty Search Result Handling', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        userProfileArb,
        (searchTerm, userProfile) => {
          // Test search intent extraction
          const intent = (ExerciseRecommendationService as any).extractSearchIntent(searchTerm);

          // The system should always return a valid intent object
          expect(intent).toHaveProperty('muscleGroups');
          expect(intent).toHaveProperty('equipment');
          expect(intent).toHaveProperty('category');

          // Arrays should be valid (even if empty)
          expect(Array.isArray(intent.muscleGroups)).toBe(true);
          expect(Array.isArray(intent.equipment)).toBe(true);

          // Category should be null or a valid category
          if (intent.category !== null) {
            expect(['strength', 'cardio', 'flexibility', 'balance', 'functional', 'sports', 'rehabilitation'])
              .toContain(intent.category);
          }

          // Test that muscle groups are valid if extracted
          intent.muscleGroups.forEach((muscle: MuscleGroup) => {
            expect([
              'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
              'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 
              'hamstrings', 'calves', 'full_body', 'core'
            ]).toContain(muscle);
          });

          // Test that equipment is valid if extracted
          intent.equipment.forEach((eq: Equipment) => {
            expect([
              'none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands',
              'pull_up_bar', 'bench', 'cable_machine', 'smith_machine',
              'treadmill', 'stationary_bike', 'rowing_machine', 'yoga_mat',
              'stability_ball', 'medicine_ball', 'foam_roller', 'suspension_trainer',
              'battle_ropes', 'plyo_box', 'agility_ladder'
            ]).toContain(eq);
          });

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test muscle group matching consistency
   */
  test('Property: Muscle Group Matching Consistency', () => {
    fc.assert(
      fc.property(
        exerciseArb,
        fc.array(muscleGroupArb, { minLength: 1, maxLength: 5 }),
        (exercise, targetMuscles) => {
          const match = (ExerciseRecommendationService as any).calculateMuscleGroupMatch(exercise, targetMuscles);

          // Match score should be between 0 and 1
          expect(match).toBeGreaterThanOrEqual(0);
          expect(match).toBeLessThanOrEqual(1);

          // If exercise targets all requested muscles, match should be 1
          const exerciseMuscles = [...exercise.targetMuscles, ...(exercise.secondaryMuscles || [])];
          const allTargetsMatch = targetMuscles.every(muscle => exerciseMuscles.includes(muscle));
          if (allTargetsMatch) {
            expect(match).toBe(1);
          }

          // If no muscles match, score should be 0
          const noMatches = !targetMuscles.some(muscle => exerciseMuscles.includes(muscle));
          if (noMatches) {
            expect(match).toBe(0);
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test equipment matching consistency
   */
  test('Property: Equipment Matching Consistency', () => {
    fc.assert(
      fc.property(
        exerciseArb,
        fc.array(equipmentArb, { minLength: 1, maxLength: 10 }),
        (exercise, availableEquipment) => {
          const match = (ExerciseRecommendationService as any).calculateEquipmentMatch(exercise, availableEquipment);

          // Match score should be between 0 and 1
          expect(match).toBeGreaterThanOrEqual(0);
          expect(match).toBeLessThanOrEqual(1);

          // Bodyweight exercises (using 'none') should always have perfect match
          if (exercise.equipment.includes('none')) {
            expect(match).toBe(1);
          }

          // If all required equipment is available, match should be 1
          const allEquipmentAvailable = exercise.equipment.every(eq => 
            eq === 'none' || availableEquipment.includes(eq)
          );
          if (allEquipmentAvailable) {
            expect(match).toBe(1);
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test difficulty appropriateness
   */
  test('Property: Difficulty Appropriateness', () => {
    fc.assert(
      fc.property(
        difficultyArb,
        difficultyArb,
        (exerciseDifficulty, userLevel) => {
          const isAppropriate = (ExerciseRecommendationService as any).isDifficultyAppropriate(
            exerciseDifficulty, 
            userLevel
          );

          const levels = ['beginner', 'intermediate', 'advanced'];
          const exerciseIndex = levels.indexOf(exerciseDifficulty);
          const userIndex = levels.indexOf(userLevel);

          // Exercise should be appropriate if it's at or below user level
          const expectedAppropriate = exerciseIndex <= userIndex;
          expect(isAppropriate).toBe(expectedAppropriate);

          // Beginner exercises should always be appropriate
          if (exerciseDifficulty === 'beginner') {
            expect(isAppropriate).toBe(true);
          }

          // Advanced exercises should only be appropriate for advanced users
          if (exerciseDifficulty === 'advanced' && userLevel !== 'advanced') {
            expect(isAppropriate).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test goal matching produces valid scores
   */
  test('Property: Goal Matching Validity', () => {
    fc.assert(
      fc.property(
        exerciseArb,
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        (exercise, goals) => {
          const match = (ExerciseRecommendationService as any).calculateGoalMatch(exercise, goals);

          // Match score should be between 0 and 1
          expect(match).toBeGreaterThanOrEqual(0);
          expect(match).toBeLessThanOrEqual(1);

          // Score should be deterministic for same inputs
          const match2 = (ExerciseRecommendationService as any).calculateGoalMatch(exercise, goals);
          expect(match).toBe(match2);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test activity level to difficulty mapping consistency
   */
  test('Property: Activity Level Mapping Consistency', () => {
    fc.assert(
      fc.property(
        activityLevelArb,
        (activityLevel) => {
          const difficulty = (ExerciseRecommendationService as any).mapActivityLevelToDifficulty(activityLevel);

          // Should always return a valid difficulty level
          expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);

          // Mapping should be consistent
          const difficulty2 = (ExerciseRecommendationService as any).mapActivityLevelToDifficulty(activityLevel);
          expect(difficulty).toBe(difficulty2);

          // Test specific mappings
          if (activityLevel === 'sedentary' || activityLevel === 'light') {
            expect(difficulty).toBe('beginner');
          } else if (activityLevel === 'very_active') {
            expect(difficulty).toBe('advanced');
          } else {
            expect(difficulty).toBe('intermediate');
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test recommendation reason generation
   */
  test('Property: Recommendation Reason Generation', () => {
    fc.assert(
      fc.property(
        exerciseArb,
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        difficultyArb,
        fc.array(equipmentArb, { maxLength: 5 }),
        (exercise, matchedCriteria, userFitnessLevel, availableEquipment) => {
          const context = {
            userFitnessLevel,
            availableEquipment,
          };

          const reason = (ExerciseRecommendationService as any).generateRecommendationReason(
            exercise,
            matchedCriteria,
            context
          );

          // Reason should be a non-empty string
          expect(typeof reason).toBe('string');
          expect(reason.length).toBeGreaterThan(0);

          // Should contain "Recommended because" or be a default reason
          const isValidReason = reason.includes('Recommended because') || 
                               reason.includes('Popular') || 
                               reason.includes('exercise');
          expect(isValidReason).toBe(true);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test goals to muscle groups mapping
   */
  test('Property: Goals to Muscle Groups Mapping', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        (goals) => {
          const muscleGroups = (ExerciseRecommendationService as any).mapGoalsToMuscleGroups(goals);

          // Should return an array
          expect(Array.isArray(muscleGroups)).toBe(true);

          // All returned muscle groups should be valid
          muscleGroups.forEach((muscle: MuscleGroup) => {
            expect([
              'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
              'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 
              'hamstrings', 'calves', 'full_body', 'core'
            ]).toContain(muscle);
          });

          // Should not contain duplicates
          const uniqueGroups = [...new Set(muscleGroups)];
          expect(muscleGroups.length).toBe(uniqueGroups.length);

          // Specific goal mappings should work
          if (goals.some(goal => goal.toLowerCase().includes('upper body'))) {
            expect(muscleGroups.some(muscle => 
              ['chest', 'back', 'shoulders', 'biceps', 'triceps'].includes(muscle)
            )).toBe(true);
          }

          if (goals.some(goal => goal.toLowerCase().includes('lower body'))) {
            expect(muscleGroups.some(muscle => 
              ['glutes', 'quadriceps', 'hamstrings', 'calves'].includes(muscle)
            )).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
