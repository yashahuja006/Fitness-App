/**
 * Property-Based Tests for Gemini Service (AI Chatbot Integration)
 * 
 * These tests validate the correctness properties of the AI chatbot system
 * using property-based testing with Fast-check.
 */

import * as fc from 'fast-check';
import { geminiService, ChatMessage, ConversationContext } from '../geminiService';
import { Exercise } from '../../types/exercise';

// Mock Firebase and external dependencies
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('../exerciseService', () => ({
  ExerciseService: {
    searchExercises: jest.fn(),
    getPopularExercises: jest.fn(),
  },
}));

jest.mock('../exerciseRecommendationService', () => ({
  ExerciseRecommendationService: {
    getPersonalizedRecommendations: jest.fn(),
    getAlternativeSuggestions: jest.fn(),
  },
}));

// Test data generators
const exerciseGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 3, maxLength: 100 }),
  category: fc.constantFrom('strength', 'cardio', 'flexibility', 'balance', 'functional'),
  difficulty: fc.constantFrom('beginner', 'intermediate', 'advanced'),
  targetMuscles: fc.array(fc.constantFrom('chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'glutes', 'quadriceps', 'hamstrings', 'calves'), { minLength: 1, maxLength: 4 }),
  equipment: fc.array(fc.constantFrom('none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands'), { minLength: 1, maxLength: 3 }),
  instructions: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
  metadata: fc.record({
    popularity: fc.integer({ min: 0, max: 1000 }),
    averageRating: fc.float({ min: 1, max: 5 }),
    tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
  }),
}) as fc.Arbitrary<Exercise>;

const userProfileGenerator = fc.record({
  fitnessLevel: fc.constantFrom('sedentary', 'light', 'moderate', 'active', 'very_active'),
  availableEquipment: fc.array(fc.constantFrom('none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands'), { maxLength: 5 }),
  fitnessGoals: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 3 }),
});

const messageGenerator = fc.record({
  exerciseQuery: fc.oneof(
    fc.string({ minLength: 5, maxLength: 100 }),
    fc.constantFrom(
      'show me push-up variations',
      'how to do squats properly',
      'chest exercises with dumbbells',
      'alternatives to running',
      'beginner back exercises',
      'core strengthening workout'
    )
  ),
  formQuery: fc.oneof(
    fc.string({ minLength: 5, maxLength: 100 }),
    fc.constantFrom(
      'how to improve squat form',
      'proper deadlift technique',
      'correct push-up posture',
      'bench press form tips'
    )
  ),
  recommendationQuery: fc.oneof(
    fc.string({ minLength: 5, maxLength: 100 }),
    fc.constantFrom(
      'alternatives to bench press',
      'replace running with something else',
      'substitute for pull-ups',
      'what can I do instead of squats'
    )
  ),
});

describe('Gemini Service Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 8: Query Processing and Response Generation
   * For any valid user message, the chatbot should process the query and generate an appropriate response
   * **Validates: Requirements 3.1**
   */
  test('Property 8: Query Processing and Response Generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        userProfileGenerator,
        async (userMessage, userProfile) => {
          // Initialize conversation
          const sessionId = geminiService.initializeConversation('test-user', userProfile);
          
          // Process message
          const response = await geminiService.processMessage(sessionId, userMessage);
          
          // Verify response properties
          expect(response).toBeDefined();
          expect(response.id).toBeTruthy();
          expect(response.role).toBe('assistant');
          expect(response.content).toBeTruthy();
          expect(response.timestamp).toBeInstanceOf(Date);
          expect(['text', 'exercise_info', 'exercise_recommendation', 'form_guidance']).toContain(response.type);
          
          // Verify conversation history is maintained
          const history = geminiService.getConversationHistory(sessionId);
          expect(history.length).toBeGreaterThanOrEqual(2); // User message + assistant response
          expect(history[history.length - 2].role).toBe('user');
          expect(history[history.length - 1].role).toBe('assistant');
          
          // Cleanup
          geminiService.endConversation(sessionId);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Exercise Information Completeness
   * For any exercise-related query, the chatbot should provide complete information when exercises are found
   * **Validates: Requirements 3.2, 3.4**
   */
  test('Property 9: Exercise Information Completeness', async () => {
    const { ExerciseService } = require('../exerciseService');
    
    await fc.assert(
      fc.asyncProperty(
        messageGenerator.map(m => m.exerciseQuery),
        userProfileGenerator,
        fc.array(exerciseGenerator, { minLength: 1, maxLength: 5 }),
        async (exerciseQuery, userProfile, mockExercises) => {
          // Mock exercise service to return exercises
          ExerciseService.searchExercises.mockResolvedValue({
            exercises: mockExercises,
            totalCount: mockExercises.length,
            hasMore: false,
            filters: {},
          });
          
          // Initialize conversation and process query
          const sessionId = geminiService.initializeConversation('test-user', userProfile);
          const response = await geminiService.processMessage(sessionId, exerciseQuery);
          
          // Verify exercise information is included
          if (response.metadata?.exercises && response.metadata.exercises.length > 0) {
            const exercises = response.metadata.exercises;
            
            // Each exercise should have complete information
            exercises.forEach((exercise: Exercise) => {
              expect(exercise.id).toBeTruthy();
              expect(exercise.name).toBeTruthy();
              expect(exercise.category).toBeTruthy();
              expect(exercise.difficulty).toBeTruthy();
              expect(exercise.targetMuscles).toBeDefined();
              expect(exercise.targetMuscles.length).toBeGreaterThan(0);
              expect(exercise.equipment).toBeDefined();
              expect(exercise.instructions).toBeDefined();
              expect(exercise.instructions.length).toBeGreaterThan(0);
            });
            
            // Response should mention exercise details
            expect(response.content.length).toBeGreaterThan(10);
            expect(response.type).toMatch(/exercise_info|exercise_recommendation/);
          }
          
          geminiService.endConversation(sessionId);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10: Exercise Recommendation Accuracy
   * For any recommendation request, the chatbot should suggest suitable alternatives based on user context
   * **Validates: Requirements 3.3**
   */
  test('Property 10: Exercise Recommendation Accuracy', async () => {
    const { ExerciseRecommendationService } = require('../exerciseRecommendationService');
    
    await fc.assert(
      fc.asyncProperty(
        messageGenerator.map(m => m.recommendationQuery),
        userProfileGenerator,
        fc.array(exerciseGenerator, { minLength: 1, maxLength: 6 }),
        async (recommendationQuery, userProfile, mockRecommendations) => {
          // Filter mock recommendations to match user fitness level
          const appropriateExercises = mockRecommendations.map(exercise => {
            // Adjust difficulty based on user fitness level
            if (userProfile.fitnessLevel === 'sedentary' || userProfile.fitnessLevel === 'light') {
              return { ...exercise, difficulty: 'beginner' as const };
            } else if (userProfile.fitnessLevel === 'moderate') {
              return { ...exercise, difficulty: fc.sample(fc.constantFrom('beginner', 'intermediate'), 1)[0] as const };
            }
            return exercise;
          });
          
          // Mock recommendation service
          const mockRecommendationResults = appropriateExercises.map(exercise => ({
            exercise,
            score: Math.random() * 100,
            reason: `Recommended because it matches your ${userProfile.fitnessLevel} fitness level`,
            matchedCriteria: ['fitness level', 'available equipment'],
          }));
          
          ExerciseRecommendationService.getPersonalizedRecommendations.mockResolvedValue(mockRecommendationResults);
          ExerciseRecommendationService.getAlternativeSuggestions.mockResolvedValue(mockRecommendationResults);
          
          // Initialize conversation and process recommendation query
          const sessionId = geminiService.initializeConversation('test-user', userProfile);
          const response = await geminiService.processMessage(sessionId, recommendationQuery);
          
          // Verify recommendations are contextually appropriate
          if (response.metadata?.exercises && response.metadata.exercises.length > 0) {
            const exercises = response.metadata.exercises;
            
            // Recommendations should be relevant to user profile
            exercises.forEach((exercise: Exercise) => {
              // Should have appropriate difficulty for user's fitness level
              if (userProfile.fitnessLevel === 'sedentary' || userProfile.fitnessLevel === 'light') {
                expect(['beginner', 'intermediate']).toContain(exercise.difficulty);
              }
              
              // Should consider available equipment (allow bodyweight exercises for empty equipment)
              if (userProfile.availableEquipment.length > 0) {
                const hasMatchingEquipment = exercise.equipment.some(eq => 
                  eq === 'none' || userProfile.availableEquipment.includes(eq)
                );
                expect(hasMatchingEquipment).toBe(true);
              } else {
                // If no equipment specified, should allow bodyweight exercises
                expect(exercise.equipment).toContain('none');
              }
            });
            
            expect(response.type).toBe('exercise_recommendation');
            expect(response.content).toContain('alternative');
          }
          
          geminiService.endConversation(sessionId);
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property 11: Query Error Handling
   * For any unclear or problematic query, the chatbot should provide helpful suggestions and error recovery
   * **Validates: Requirements 3.5**
   */
  test('Property 11: Query Error Handling', async () => {
    const { ExerciseService } = require('../exerciseService');
    
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 5 }), // Very short queries
          fc.constantFrom('', '   ', 'xyz', '???', '123'), // Unclear queries
          fc.string({ minLength: 500, maxLength: 1000 }) // Very long queries
        ),
        userProfileGenerator,
        async (unclearQuery, userProfile) => {
          // Mock empty search results to trigger error handling
          ExerciseService.searchExercises.mockResolvedValue({
            exercises: [],
            totalCount: 0,
            hasMore: false,
            filters: {},
          });
          
          ExerciseService.getPopularExercises.mockResolvedValue([]);
          
          // Initialize conversation and process unclear query
          const sessionId = geminiService.initializeConversation('test-user', userProfile);
          const response = await geminiService.processMessage(sessionId, unclearQuery);
          
          // Verify error handling provides helpful guidance
          expect(response).toBeDefined();
          expect(response.role).toBe('assistant');
          expect(response.content).toBeTruthy();
          expect(response.content.length).toBeGreaterThan(20);
          
          // Should provide helpful suggestions
          const contentLower = response.content.toLowerCase();
          const hasHelpfulContent = 
            contentLower.includes('suggest') ||
            contentLower.includes('try') ||
            contentLower.includes('help') ||
            contentLower.includes('browse') ||
            contentLower.includes('search') ||
            contentLower.includes('specific') ||
            contentLower.includes('example') ||
            contentLower.includes('alternative') ||
            contentLower.includes('recommendation');
          
          expect(hasHelpfulContent).toBe(true);
          
          // Should provide action buttons for recovery (metadata should exist)
          expect(response.metadata).toBeDefined();
          if (response.metadata?.actions) {
            expect(response.metadata.actions.length).toBeGreaterThan(0);
            response.metadata.actions.forEach(action => {
              expect(action.type).toBeTruthy();
              expect(action.label).toBeTruthy();
              expect(action.data).toBeDefined();
            });
          } else {
            // If no actions, at least metadata should be present with empty actions array
            expect(response.metadata.actions).toBeDefined();
          }
          
          geminiService.endConversation(sessionId);
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Additional Property: Conversation Context Maintenance
   * For any sequence of messages, the conversation context should be properly maintained
   */
  test('Property: Conversation Context Maintenance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 3, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        userProfileGenerator,
        async (messages, userProfile) => {
          const sessionId = geminiService.initializeConversation('test-user', userProfile);
          
          // Send multiple messages
          for (const message of messages) {
            await geminiService.processMessage(sessionId, message);
          }
          
          // Verify conversation history
          const history = geminiService.getConversationHistory(sessionId);
          expect(history.length).toBe(messages.length * 2); // Each message gets a response
          
          // Verify alternating user/assistant pattern
          for (let i = 0; i < history.length; i++) {
            if (i % 2 === 0) {
              expect(history[i].role).toBe('user');
            } else {
              expect(history[i].role).toBe('assistant');
            }
          }
          
          // Verify message ordering by timestamp
          for (let i = 1; i < history.length; i++) {
            expect(history[i].timestamp.getTime()).toBeGreaterThanOrEqual(
              history[i - 1].timestamp.getTime()
            );
          }
          
          geminiService.endConversation(sessionId);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Additional Property: Session Management
   * For any session operations, the service should properly manage conversation lifecycle
   */
  test('Property: Session Management', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        userProfileGenerator,
        async (userIds, userProfile) => {
          const sessionIds: string[] = [];
          
          // Create multiple sessions
          for (const userId of userIds) {
            const sessionId = geminiService.initializeConversation(userId, userProfile);
            expect(sessionId).toBeTruthy();
            expect(sessionId).toContain('session_');
            sessionIds.push(sessionId);
          }
          
          // Verify each session is independent
          for (const sessionId of sessionIds) {
            const history = geminiService.getConversationHistory(sessionId);
            expect(history).toEqual([]);
            
            // Add a message to each session
            await geminiService.processMessage(sessionId, 'test message');
            const updatedHistory = geminiService.getConversationHistory(sessionId);
            expect(updatedHistory.length).toBe(2);
          }
          
          // Clean up sessions
          for (const sessionId of sessionIds) {
            geminiService.endConversation(sessionId);
            const history = geminiService.getConversationHistory(sessionId);
            expect(history).toEqual([]);
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});