import * as fc from 'fast-check';
import { ExerciseService } from '../exerciseService';
import { 
  Exercise, 
  ExerciseSearchFilters, 
  ExerciseCategory, 
  DifficultyLevel, 
  Equipment, 
  MuscleGroup 
} from '@/types/exercise';

// Mock Firebase Firestore
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  writeBatch: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1640995200, nanoseconds: 0 })),
  },
}));

describe('ExerciseService - Property Tests', () => {
  describe('Search Algorithm with Relevance Scoring', () => {
    const createMockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
      id: 'test-exercise',
      name: 'Test Exercise',
      category: 'strength',
      targetMuscles: ['chest'],
      equipment: ['none'],
      difficulty: 'beginner',
      instructions: ['Step 1', 'Step 2'],
      commonMistakes: ['Mistake 1'],
      safetyTips: ['Tip 1'],
      mediaAssets: {
        images: [],
        videos: [],
        demonstrations: [],
      },
      metadata: {
        createdBy: 'system',
        verified: true,
        popularity: 50,
        tags: ['test'],
        averageRating: 4.0,
        totalRatings: 100,
      },
      createdAt: { seconds: 1640995200, nanoseconds: 0 } as any,
      updatedAt: { seconds: 1640995200, nanoseconds: 0 } as any,
      ...overrides,
    });

    const exerciseArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 3, maxLength: 50 }),
      category: fc.constantFrom<ExerciseCategory>('strength', 'cardio', 'flexibility', 'balance'),
      targetMuscles: fc.array(
        fc.constantFrom<MuscleGroup>('chest', 'back', 'shoulders', 'biceps', 'triceps'),
        { minLength: 1, maxLength: 3 }
      ),
      equipment: fc.array(
        fc.constantFrom<Equipment>('none', 'dumbbells', 'barbell', 'kettlebell'),
        { minLength: 1, maxLength: 2 }
      ),
      difficulty: fc.constantFrom<DifficultyLevel>('beginner', 'intermediate', 'advanced'),
      instructions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 3 }),
      metadata: fc.record({
        popularity: fc.integer({ min: 1, max: 100 }),
        tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
        averageRating: fc.option(fc.float({ min: 1, max: 5 })),
        totalRatings: fc.option(fc.integer({ min: 1, max: 1000 })),
      }),
    }).map(data => createMockExercise(data));

    it('Property: Search relevance scoring should be consistent and deterministic', async () => {
      await fc.assert(fc.property(
        fc.array(exerciseArb, { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (exercises, searchTerm) => {
          // Access the private method through type assertion for testing
          const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
          
          const result1 = searchWithRelevanceScoring(exercises, searchTerm);
          const result2 = searchWithRelevanceScoring(exercises, searchTerm);
          
          // Results should be identical (deterministic)
          expect(result1).toEqual(result2);
          
          // Results should be sorted by score in descending order
          for (let i = 1; i < result1.length; i++) {
            expect(result1[i - 1].score).toBeGreaterThanOrEqual(result1[i].score);
          }
          
          // All results should have positive scores
          result1.forEach(item => {
            expect(item.score).toBeGreaterThan(0);
          });
        }
      ));
    });

    it('Property: Exact name matches should receive highest scores', async () => {
      await fc.assert(fc.property(
        fc.string({ minLength: 3, maxLength: 30 }),
        fc.array(exerciseArb, { minLength: 2, maxLength: 5 }),
        (exactName, otherExercises) => {
          const exactMatchExercise = createMockExercise({ name: exactName });
          const exercises = [exactMatchExercise, ...otherExercises];
          
          const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
          const results = searchWithRelevanceScoring(exercises, exactName);
          
          if (results.length > 0) {
            // The exact match should be first (highest score)
            expect(results[0].exercise.name).toBe(exactName);
            
            // If there are other results, exact match should have higher score
            if (results.length > 1) {
              expect(results[0].score).toBeGreaterThan(results[1].score);
            }
          }
        }
      ));
    });

    it('Property: Search should handle case insensitivity correctly', async () => {
      await fc.assert(fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
        exerciseArb,
        (searchTerm, exercise) => {
          const exercises = [exercise];
          const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
          
          const lowerResults = searchWithRelevanceScoring(exercises, searchTerm.toLowerCase());
          const upperResults = searchWithRelevanceScoring(exercises, searchTerm.toUpperCase());
          const mixedResults = searchWithRelevanceScoring(exercises, searchTerm);
          
          // Case variations should produce identical scores
          expect(lowerResults.map(r => r.score)).toEqual(upperResults.map(r => r.score));
          expect(lowerResults.map(r => r.score)).toEqual(mixedResults.map(r => r.score));
        }
      ));
    });

    it('Property: Popularity and rating should influence scoring positively', async () => {
      await fc.assert(fc.property(
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 51, max: 100 }),
        fc.option(fc.float({ min: 1, max: 3 })),
        fc.option(fc.float({ min: 3.1, max: 5 })),
        (searchTerm, lowPopularity, highPopularity, lowRating, highRating) => {
          const lowPopExercise = createMockExercise({
            name: searchTerm,
            metadata: {
              createdBy: 'system',
              verified: true,
              popularity: lowPopularity,
              tags: [],
              averageRating: lowRating,
              totalRatings: 100,
            },
          });
          
          const highPopExercise = createMockExercise({
            name: searchTerm,
            metadata: {
              createdBy: 'system',
              verified: true,
              popularity: highPopularity,
              tags: [],
              averageRating: highRating,
              totalRatings: 100,
            },
          });
          
          const exercises = [lowPopExercise, highPopExercise];
          const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
          const results = searchWithRelevanceScoring(exercises, searchTerm);
          
          if (results.length === 2) {
            // Higher popularity/rating should result in higher score
            const lowPopResult = results.find(r => r.exercise.id === lowPopExercise.id);
            const highPopResult = results.find(r => r.exercise.id === highPopExercise.id);
            
            if (lowPopResult && highPopResult) {
              expect(highPopResult.score).toBeGreaterThan(lowPopResult.score);
            }
          }
        }
      ));
    });

    it('Property: Multi-word search should match individual words', async () => {
      await fc.assert(fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 2, maxLength: 4 }),
        (words) => {
          const multiWordTerm = words.join(' ');
          const exercise = createMockExercise({
            name: `Exercise with ${words[0]} and other content`,
            instructions: [`This includes ${words[1]} in the instruction`],
            metadata: {
              createdBy: 'system',
              verified: true,
              popularity: 50,
              tags: [words[2] || 'tag'],
            },
          });
          
          const exercises = [exercise];
          const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
          const results = searchWithRelevanceScoring(exercises, multiWordTerm);
          
          // Should find matches for individual words
          expect(results.length).toBeGreaterThan(0);
          expect(results[0].score).toBeGreaterThan(0);
        }
      ));
    });

    it('Property: Empty search terms should return empty results', async () => {
      await fc.assert(fc.property(
        fc.array(exerciseArb, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('', '   ', '\t', '\n'),
        (exercises, emptyTerm) => {
          const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
          const results = searchWithRelevanceScoring(exercises, emptyTerm);
          
          // Empty or whitespace-only terms should return no results
          expect(results).toEqual([]);
        }
      ));
    });

    it('Property: Search should match across all searchable fields', async () => {
      await fc.assert(fc.property(
        fc.string({ minLength: 3, maxLength: 15 }),
        (searchTerm) => {
          const exercises = [
            createMockExercise({ name: `Name with ${searchTerm}` }),
            createMockExercise({ 
              targetMuscles: [searchTerm.toLowerCase().replace(/\s+/g, '_') as MuscleGroup] 
            }),
            createMockExercise({ 
              equipment: [searchTerm.toLowerCase().replace(/\s+/g, '_') as Equipment] 
            }),
            createMockExercise({ 
              instructions: [`Instruction containing ${searchTerm}`] 
            }),
            createMockExercise({ 
              metadata: {
                createdBy: 'system',
                verified: true,
                popularity: 50,
                tags: [searchTerm.toLowerCase()],
              }
            }),
            createMockExercise({ 
              category: searchTerm.toLowerCase() as ExerciseCategory 
            }),
          ].filter(exercise => {
            // Filter out exercises with invalid enum values
            const validCategories = ['strength', 'cardio', 'flexibility', 'balance', 'functional', 'sports', 'rehabilitation'];
            const validMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core'];
            const validEquipment = ['none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'pull_up_bar', 'bench', 'cable_machine', 'smith_machine', 'treadmill', 'stationary_bike', 'rowing_machine', 'yoga_mat', 'stability_ball', 'medicine_ball', 'foam_roller', 'suspension_trainer', 'battle_ropes', 'plyo_box', 'agility_ladder'];
            
            return validCategories.includes(exercise.category) &&
                   exercise.targetMuscles.every(m => validMuscles.includes(m)) &&
                   exercise.equipment.every(e => validEquipment.includes(e));
          });
          
          if (exercises.length > 0) {
            const searchWithRelevanceScoring = (ExerciseService as any).searchWithRelevanceScoring;
            const results = searchWithRelevanceScoring(exercises, searchTerm);
            
            // Should find matches in various fields
            expect(results.length).toBeGreaterThan(0);
            results.forEach(result => {
              expect(result.score).toBeGreaterThan(0);
            });
          }
        }
      ));
    });
  });
});

/**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * These property tests verify that the exercise search algorithm:
 * - Provides consistent and deterministic relevance scoring (5.1)
 * - Handles various search inputs correctly across all fields (5.1, 5.2)
 * - Returns complete and accurate search results (5.2, 5.3)
 * - Implements proper ranking based on relevance and popularity (5.1)
 */