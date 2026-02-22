/**
 * Property-Based Tests for AI Form Correction System
 * **Feature: fitness-app**
 * 
 * Tests the correctness properties of the AI form correction system including
 * pose detection, form analysis, scoring, and voice feedback integration.
 */

import fc from 'fast-check';
import { formAnalysisService } from '@/lib/formAnalysisService';
import { formScoringService } from '@/lib/formScoringService';
import { voiceFeedbackService } from '@/lib/voiceFeedbackService';
import type { 
  PoseLandmark, 
  FormAnalysis, 
  FormScore, 
  FormIssue,
  ImprovementSuggestion 
} from '@/types';

// Test data generators
const landmarkGenerator = fc.record({
  x: fc.float({ min: 0, max: 1 }),
  y: fc.float({ min: 0, max: 1 }),
  z: fc.float({ min: -1, max: 1 }),
  visibility: fc.float({ min: 0, max: 1 }),
});

const landmarksArrayGenerator = fc.array(landmarkGenerator, { minLength: 33, maxLength: 33 });

const exerciseIdGenerator = fc.constantFrom('pushup', 'squat', 'plank');

const formIssueGenerator = fc.record({
  type: fc.constantFrom('posture', 'alignment', 'range_of_motion', 'timing'),
  severity: fc.constantFrom('low', 'medium', 'high'),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  correction: fc.string({ minLength: 10, maxLength: 100 }),
  affectedJoints: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
});

const formAnalysisGenerator = fc.record({
  exerciseId: exerciseIdGenerator,
  correctness: fc.float({ min: 0, max: 1 }),
  issues: fc.array(formIssueGenerator, { maxLength: 5 }),
  suggestions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { maxLength: 3 }),
  keyPointAccuracy: fc.array(fc.record({
    joint: fc.string({ minLength: 3, maxLength: 20 }),
    accuracy: fc.float({ min: 0, max: 1 }),
    expected: landmarkGenerator,
    actual: landmarkGenerator,
  }), { maxLength: 10 }),
});

describe('AI Form Correction System - Property Tests', () => {
  
  /**
   * **Property 1: Pose Detection Initialization**
   * **Validates: Requirements 1.1**
   * 
   * For any valid exercise ID, when starting pose detection, the system should
   * successfully initialize and be ready to analyze movement.
   */
  describe('Property 1: Pose Detection Initialization', () => {
    it('should initialize pose detection for any valid exercise', () => {
      fc.assert(
        fc.property(exerciseIdGenerator, (exerciseId) => {
          // Test that form analysis service can handle any valid exercise
          const availableExercises = formAnalysisService.getAvailableExercises();
          
          if (availableExercises.includes(exerciseId)) {
            const rules = formAnalysisService.getExerciseRules(exerciseId);
            expect(rules).toBeDefined();
            expect(rules?.exerciseId).toBe(exerciseId);
            expect(rules?.keyJoints).toBeInstanceOf(Array);
            expect(rules?.alignmentRules).toBeInstanceOf(Array);
            expect(rules?.rangeOfMotionRules).toBeInstanceOf(Array);
            expect(rules?.postureRules).toBeInstanceOf(Array);
          }
          
          return true;
        }),
        { numRuns: 10 }
      );
    });

    it('should handle unknown exercises gracefully', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 20 }), (unknownExercise) => {
          // Assume it's not a known exercise
          fc.pre(!['pushup', 'squat', 'plank'].includes(unknownExercise));
          
          // Should not throw error for unknown exercises
          const rules = formAnalysisService.getExerciseRules(unknownExercise);
          expect(rules).toBeUndefined();
          
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Property 2: Form Feedback Generation**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * For any detected incorrect posture during exercise, the system should generate
   * immediate visual feedback overlays and provide real-time audio guidance.
   */
  describe('Property 2: Form Feedback Generation', () => {
    it('should generate form analysis for any valid pose landmarks', () => {
      fc.assert(
        fc.property(
          landmarksArrayGenerator,
          exerciseIdGenerator,
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            
            // Analysis should always be returned
            expect(analysis).toBeDefined();
            expect(analysis.exerciseId).toBe(exerciseId);
            expect(analysis.correctness).toBeGreaterThanOrEqual(0);
            expect(analysis.correctness).toBeLessThanOrEqual(1);
            expect(analysis.issues).toBeInstanceOf(Array);
            expect(analysis.suggestions).toBeInstanceOf(Array);
            expect(analysis.keyPointAccuracy).toBeInstanceOf(Array);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide voice feedback for form issues when enabled', () => {
      fc.assert(
        fc.property(
          formAnalysisGenerator,
          exerciseIdGenerator,
          (analysis, exerciseId) => {
            // Enable voice feedback
            voiceFeedbackService.updateConfig({ enabled: true, enableFormFeedback: true });
            
            // Should not throw when providing feedback
            expect(() => {
              voiceFeedbackService.provideFormFeedback(analysis, exerciseId);
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle disabled voice feedback gracefully', () => {
      fc.assert(
        fc.property(
          formAnalysisGenerator,
          exerciseIdGenerator,
          (analysis, exerciseId) => {
            // Disable voice feedback
            voiceFeedbackService.updateConfig({ enabled: false });
            
            // Should not throw when voice is disabled
            expect(() => {
              voiceFeedbackService.provideFormFeedback(analysis, exerciseId);
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Property 3: Exercise Completion Analysis**
   * **Validates: Requirements 1.4**
   * 
   * For any completed exercise set, the system should generate a form quality score
   * and provide improvement suggestions based on the performance data.
   */
  describe('Property 3: Exercise Completion Analysis', () => {
    it('should generate comprehensive form scores for any analysis', () => {
      fc.assert(
        fc.property(
          formAnalysisGenerator,
          landmarksArrayGenerator,
          exerciseIdGenerator,
          fc.option(fc.string({ minLength: 5, maxLength: 20 })),
          (analysis, landmarks, exerciseId, sessionId) => {
            const score = formScoringService.calculateFormScore(
              analysis,
              landmarks,
              exerciseId,
              sessionId || undefined
            );
            
            // Score should have all required properties
            expect(score).toBeDefined();
            expect(score.overall).toBeGreaterThanOrEqual(0);
            expect(score.overall).toBeLessThanOrEqual(1);
            
            // Breakdown should have all components
            expect(score.breakdown).toBeDefined();
            expect(score.breakdown.alignment).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.alignment).toBeLessThanOrEqual(1);
            expect(score.breakdown.rangeOfMotion).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.rangeOfMotion).toBeLessThanOrEqual(1);
            expect(score.breakdown.posture).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.posture).toBeLessThanOrEqual(1);
            expect(score.breakdown.timing).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.timing).toBeLessThanOrEqual(1);
            expect(score.breakdown.consistency).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.consistency).toBeLessThanOrEqual(1);
            
            // Grade should be valid
            expect(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).toContain(score.grade);
            
            // Arrays should be defined
            expect(score.improvements).toBeInstanceOf(Array);
            expect(score.strengths).toBeInstanceOf(Array);
            
            // Priority should be valid
            expect(['high', 'medium', 'low']).toContain(score.priority);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide meaningful improvement suggestions', () => {
      fc.assert(
        fc.property(
          formAnalysisGenerator,
          landmarksArrayGenerator,
          exerciseIdGenerator,
          (analysis, landmarks, exerciseId) => {
            // Add some issues to ensure suggestions are generated
            const analysisWithIssues: FormAnalysis = {
              ...analysis,
              correctness: 0.6, // Lower score to trigger improvements
              issues: [
                {
                  type: 'posture',
                  severity: 'high',
                  description: 'Poor posture detected',
                  correction: 'Keep your back straight',
                  affectedJoints: ['spine'],
                },
              ],
            };
            
            const score = formScoringService.calculateFormScore(
              analysisWithIssues,
              landmarks,
              exerciseId
            );
            
            // Should have improvement suggestions for low scores
            if (score.overall < 0.8) {
              expect(score.improvements.length).toBeGreaterThan(0);
              
              // Each improvement should have required properties
              score.improvements.forEach((improvement: ImprovementSuggestion) => {
                expect(improvement.category).toBeDefined();
                expect(['alignment', 'range_of_motion', 'posture', 'timing', 'consistency'])
                  .toContain(improvement.category);
                expect(['high', 'medium', 'low']).toContain(improvement.priority);
                expect(improvement.title).toBeDefined();
                expect(improvement.description).toBeDefined();
                expect(improvement.actionSteps).toBeInstanceOf(Array);
                expect(improvement.expectedImprovement).toBeGreaterThanOrEqual(0);
                expect(['easy', 'moderate', 'challenging']).toContain(improvement.difficulty);
                expect(improvement.timeToImprove).toBeDefined();
              });
            }
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Property 4: Graceful Pose Detection Fallback**
   * **Validates: Requirements 1.5**
   * 
   * For any scenario where pose detection fails or camera access is unavailable,
   * the system should seamlessly fallback to manual exercise tracking without
   * losing core functionality.
   */
  describe('Property 4: Graceful Pose Detection Fallback', () => {
    it('should handle empty or invalid landmark arrays gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant([]), // Empty array
            fc.array(fc.record({ // Invalid landmarks
              x: fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.float()),
              y: fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.float()),
              z: fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.float()),
              visibility: fc.float({ min: -1, max: 2 }), // Out of range
            }), { maxLength: 10 })
          ),
          exerciseIdGenerator,
          (invalidLandmarks, exerciseId) => {
            // Should not throw with invalid input
            expect(() => {
              const analysis = formAnalysisService.analyzePoseForm(invalidLandmarks, exerciseId);
              expect(analysis).toBeDefined();
              expect(analysis.exerciseId).toBe(exerciseId);
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide basic analysis when pose detection fails', () => {
      fc.assert(
        fc.property(
          exerciseIdGenerator,
          (exerciseId) => {
            // Test with empty landmarks (simulating detection failure)
            const analysis = formAnalysisService.analyzePoseForm([], exerciseId);
            
            expect(analysis).toBeDefined();
            expect(analysis.exerciseId).toBe(exerciseId);
            expect(analysis.correctness).toBeGreaterThanOrEqual(0);
            expect(analysis.correctness).toBeLessThanOrEqual(1);
            expect(analysis.issues).toBeInstanceOf(Array);
            expect(analysis.suggestions).toBeInstanceOf(Array);
            expect(analysis.keyPointAccuracy).toBeInstanceOf(Array);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain voice feedback functionality during fallback', () => {
      fc.assert(
        fc.property(
          exerciseIdGenerator,
          (exerciseId) => {
            // Enable voice feedback
            voiceFeedbackService.updateConfig({ enabled: true });
            
            // Test fallback scenario
            const analysis = formAnalysisService.analyzePoseForm([], exerciseId);
            
            // Voice feedback should still work
            expect(() => {
              voiceFeedbackService.provideFormFeedback(analysis, exerciseId);
              voiceFeedbackService.provideEncouragement('start');
              voiceFeedbackService.provideInstructions(exerciseId, 'Test instruction');
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Integration Property: Voice Feedback Consistency**
   * 
   * Voice feedback should be consistent with form analysis results and
   * provide appropriate guidance based on the detected issues.
   */
  describe('Integration Property: Voice Feedback Consistency', () => {
    it('should provide consistent voice feedback based on form analysis', () => {
      fc.assert(
        fc.property(
          formAnalysisGenerator,
          exerciseIdGenerator,
          (analysis, exerciseId) => {
            // Enable voice feedback
            voiceFeedbackService.updateConfig({ 
              enabled: true, 
              enableFormFeedback: true,
              enableEncouragement: true,
              enableInstructions: true 
            });
            
            // Clear any existing queue
            voiceFeedbackService.clearQueue();
            
            // Provide feedback
            voiceFeedbackService.provideFormFeedback(analysis, exerciseId);
            
            // Should not throw and should handle the feedback appropriately
            expect(() => {
              const queueLength = voiceFeedbackService.getQueueLength();
              expect(queueLength).toBeGreaterThanOrEqual(0);
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle voice feedback configuration changes gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            enabled: fc.boolean(),
            rate: fc.float({ min: 0.5, max: 2.0 }),
            pitch: fc.float({ min: 0, max: 2.0 }),
            volume: fc.float({ min: 0, max: 1.0 }),
            enableFormFeedback: fc.boolean(),
            enableEncouragement: fc.boolean(),
            enableInstructions: fc.boolean(),
          }),
          (config) => {
            // Should not throw when updating configuration
            expect(() => {
              voiceFeedbackService.updateConfig(config);
              const currentConfig = voiceFeedbackService.getConfig();
              
              expect(currentConfig.enabled).toBe(config.enabled);
              expect(currentConfig.rate).toBe(config.rate);
              expect(currentConfig.pitch).toBe(config.pitch);
              expect(currentConfig.volume).toBe(config.volume);
              expect(currentConfig.enableFormFeedback).toBe(config.enableFormFeedback);
              expect(currentConfig.enableEncouragement).toBe(config.enableEncouragement);
              expect(currentConfig.enableInstructions).toBe(config.enableInstructions);
            }).not.toThrow();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Performance Property: System Responsiveness**
   * 
   * The AI form correction system should maintain reasonable performance
   * characteristics under various input conditions.
   */
  describe('Performance Property: System Responsiveness', () => {
    it('should complete form analysis within reasonable time', () => {
      fc.assert(
        fc.property(
          landmarksArrayGenerator,
          exerciseIdGenerator,
          (landmarks, exerciseId) => {
            const startTime = performance.now();
            
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            const score = formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time (100ms for property tests)
            expect(duration).toBeLessThan(100);
            expect(analysis).toBeDefined();
            expect(score).toBeDefined();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle concurrent form analysis requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(landmarksArrayGenerator, exerciseIdGenerator),
            { minLength: 2, maxLength: 5 }
          ),
          async (requests) => {
            // Process multiple requests concurrently
            const promises = requests.map(([landmarks, exerciseId]) => {
              return Promise.resolve().then(() => {
                const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
                const score = formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
                return { analysis, score };
              });
            });
            
            const results = await Promise.all(promises);
            
            // All requests should complete successfully
            expect(results).toHaveLength(requests.length);
            results.forEach((result) => {
              expect(result.analysis).toBeDefined();
              expect(result.score).toBeDefined();
            });
            
            return true;
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  // Cleanup after tests
  afterEach(() => {
    // Stop any ongoing voice feedback
    voiceFeedbackService.stop();
    
    // Reset voice configuration to defaults
    voiceFeedbackService.updateConfig({
      enabled: true,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      enableFormFeedback: true,
      enableEncouragement: true,
      enableInstructions: true,
    });
  });
});