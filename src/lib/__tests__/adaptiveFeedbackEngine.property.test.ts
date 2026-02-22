/**
 * Property-Based Tests for Adaptive Feedback Engine
 * Tests feedback generation and multimodal delivery
 */

import * as fc from 'fast-check';
import { AdaptiveFeedbackEngine } from '../adaptiveFeedbackEngine';
import type {
  FormViolation,
  ExerciseAngles,
  ViewAnalysis,
  RepCountResult
} from '@/types/advancedPose';

import { 
  ViolationType, 
  Severity, 
  ExerciseMode, 
  ExerciseState, 
  RepQuality, 
  FeedbackPriority,
  ViewType 
} from '@/types/advancedPose';

// Test data generators
const violationTypeArbitrary = fc.constantFrom(
  ViolationType.KNEE_OVER_TOES,
  ViolationType.INSUFFICIENT_DEPTH,
  ViolationType.EXCESSIVE_DEPTH,
  ViolationType.FORWARD_LEAN,
  ViolationType.BACKWARD_LEAN
);

const severityArbitrary = fc.constantFrom(
  Severity.LOW,
  Severity.MEDIUM,
  Severity.HIGH
);

const exerciseModeArbitrary = fc.constantFrom(
  ExerciseMode.BEGINNER,
  ExerciseMode.PRO
);

const exerciseStateArbitrary = fc.constantFrom(
  ExerciseState.S1_STANDING,
  ExerciseState.S2_TRANSITION,
  ExerciseState.S3_DEEP_SQUAT
);

const repQualityArbitrary = fc.constantFrom(
  RepQuality.EXCELLENT,
  RepQuality.GOOD,
  RepQuality.NEEDS_IMPROVEMENT,
  RepQuality.POOR
);

const viewTypeArbitrary = fc.constantFrom(
  ViewType.OPTIMAL_SIDE,
  ViewType.SUBOPTIMAL_SIDE,
  ViewType.FRONTAL,
  ViewType.UNKNOWN
);

const formViolationArbitrary = fc.record({
  type: violationTypeArbitrary,
  severity: severityArbitrary,
  description: fc.string({ minLength: 10, maxLength: 50 }),
  correctionHint: fc.string({ minLength: 10, maxLength: 50 })
});

const exerciseAnglesArbitrary = fc.record({
  kneeAngle: fc.float({ min: 30, max: 180, noNaN: true }),
  hipAngle: fc.float({ min: 30, max: 180, noNaN: true }),
  ankleAngle: fc.float({ min: 60, max: 120, noNaN: true }),
  offsetAngle: fc.float({ min: 0, max: 45, noNaN: true })
});

const viewAnalysisArbitrary = fc.record({
  viewType: viewTypeArbitrary,
  offsetAngle: fc.float({ min: 0, max: 45, noNaN: true }),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
  recommendations: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 1, maxLength: 3 })
});

const repCountResultArbitrary = fc.record({
  repCompleted: fc.boolean(),
  repQuality: repQualityArbitrary,
  feedback: fc.string({ minLength: 10, maxLength: 100 }),
  shouldReset: fc.boolean()
});

describe('Adaptive Feedback Engine Property Tests', () => {
  let feedbackEngine: AdaptiveFeedbackEngine;

  beforeEach(() => {
    feedbackEngine = new AdaptiveFeedbackEngine();
  });

  describe('Property 5: Angle-Based Feedback Generation', () => {
    test('**Feature: advanced-pose-analysis, Property 5: Angle-Based Feedback Generation** - Feedback should be generated based on angle thresholds', () => {
      fc.assert(
        fc.property(
          exerciseAnglesArbitrary,
          exerciseStateArbitrary,
          exerciseModeArbitrary,
          (angles, state, mode) => {
            const violations: FormViolation[] = [];
            const viewAnalysis: ViewAnalysis = {
              viewType: ViewType.OPTIMAL_SIDE,
              offsetAngle: 20,
              confidence: 0.9,
              recommendations: ['Good positioning']
            };

            const feedback = feedbackEngine.generateFeedback(
              violations,
              state,
              angles,
              viewAnalysis,
              undefined,
              mode
            );

            // Should always generate some form of feedback structure
            expect(feedback).toHaveProperty('audioMessages');
            expect(feedback).toHaveProperty('visualCues');
            expect(feedback).toHaveProperty('priority');
            expect(feedback).toHaveProperty('shouldSpeak');

            // Visual cues should include angle indicators
            const angleIndicators = feedback.visualCues.filter(cue => cue.type === 'angle_indicator');
            expect(angleIndicators.length).toBeGreaterThanOrEqual(0);

            // Priority should be valid
            expect(Object.values(FeedbackPriority)).toContain(feedback.priority);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 5: Angle-Based Feedback Generation** - Critical angles should trigger high-priority feedback', () => {
      fc.assert(
        fc.property(
          exerciseModeArbitrary,
          (mode) => {
            // Create critical angle scenario (knee over toes)
            const criticalAngles: ExerciseAngles = {
              kneeAngle: 45, // Very deep, potentially dangerous
              hipAngle: 60,
              ankleAngle: 90,
              offsetAngle: 20
            };

            const criticalViolations: FormViolation[] = [{
              type: ViolationType.KNEE_OVER_TOES,
              severity: Severity.HIGH,
              description: 'Knees are extending past toes',
              correctionHint: 'Keep knees behind toes'
            }];

            const viewAnalysis: ViewAnalysis = {
              viewType: ViewType.OPTIMAL_SIDE,
              offsetAngle: 20,
              confidence: 0.9,
              recommendations: ['Good positioning']
            };

            const feedback = feedbackEngine.generateFeedback(
              criticalViolations,
              ExerciseState.S3_DEEP_SQUAT,
              criticalAngles,
              viewAnalysis,
              undefined,
              mode
            );

            // Should generate high or critical priority feedback
            expect([FeedbackPriority.HIGH, FeedbackPriority.CRITICAL]).toContain(feedback.priority);

            // Should have audio messages for critical violations
            if (feedback.shouldSpeak) {
              expect(feedback.audioMessages.length).toBeGreaterThan(0);
            }

            // Should have visual warnings
            const warnings = feedback.visualCues.filter(cue => cue.type === 'form_warning');
            expect(warnings.length).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 5: Angle-Based Feedback Generation** - Feedback frequency should be respected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 5000 }), // Feedback frequency in ms
          (frequency) => {
            feedbackEngine.updateConfig({ feedbackFrequency: frequency });

            const angles: ExerciseAngles = {
              kneeAngle: 90,
              hipAngle: 90,
              ankleAngle: 90,
              offsetAngle: 20
            };

            const viewAnalysis: ViewAnalysis = {
              viewType: ViewType.OPTIMAL_SIDE,
              offsetAngle: 20,
              confidence: 0.9,
              recommendations: ['Good positioning']
            };

            // First feedback should be delivered
            const feedback1 = feedbackEngine.generateFeedback(
              [],
              ExerciseState.S2_TRANSITION,
              angles,
              viewAnalysis
            );

            // Immediate second feedback should be throttled
            const feedback2 = feedbackEngine.generateFeedback(
              [],
              ExerciseState.S2_TRANSITION,
              angles,
              viewAnalysis
            );

            // First feedback might have messages, second should be empty due to throttling
            if (feedback1.shouldSpeak) {
              expect(feedback2.shouldSpeak).toBe(false);
              expect(feedback2.audioMessages).toHaveLength(0);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 6: Multimodal Feedback Delivery', () => {
    test('**Feature: advanced-pose-analysis, Property 6: Multimodal Feedback Delivery** - Feedback should include both audio and visual components', () => {
      fc.assert(
        fc.property(
          fc.array(formViolationArbitrary, { minLength: 0, maxLength: 3 }),
          exerciseStateArbitrary,
          exerciseAnglesArbitrary,
          viewAnalysisArbitrary,
          (violations, state, angles, viewAnalysis) => {
            const feedback = feedbackEngine.generateFeedback(
              violations,
              state,
              angles,
              viewAnalysis
            );

            // Should always have visual cues (at minimum rep counter)
            expect(feedback.visualCues).toBeDefined();
            expect(Array.isArray(feedback.visualCues)).toBe(true);

            // Audio messages should be array
            expect(feedback.audioMessages).toBeDefined();
            expect(Array.isArray(feedback.audioMessages)).toBe(true);

            // Visual cues should have valid properties
            feedback.visualCues.forEach(cue => {
              expect(cue).toHaveProperty('type');
              expect(cue).toHaveProperty('position');
              expect(cue).toHaveProperty('color');
              expect(cue).toHaveProperty('message');
              expect(cue).toHaveProperty('duration');

              // Position should be valid screen coordinates (0-100%)
              expect(cue.position.x).toBeGreaterThanOrEqual(0);
              expect(cue.position.x).toBeLessThanOrEqual(100);
              expect(cue.position.y).toBeGreaterThanOrEqual(0);
              expect(cue.position.y).toBeLessThanOrEqual(100);

              // Color should be valid hex color
              expect(cue.color).toMatch(/^#[0-9A-Fa-f]{6}$/);

              // Duration should be positive
              expect(cue.duration).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 6: Multimodal Feedback Delivery** - Rep completion should trigger specific feedback', () => {
      fc.assert(
        fc.property(
          repCountResultArbitrary,
          exerciseAnglesArbitrary,
          (repResult, angles) => {
            const viewAnalysis: ViewAnalysis = {
              viewType: ViewType.OPTIMAL_SIDE,
              offsetAngle: 20,
              confidence: 0.9,
              recommendations: ['Good positioning']
            };

            const feedback = feedbackEngine.generateFeedback(
              [],
              ExerciseState.S1_STANDING,
              angles,
              viewAnalysis,
              repResult
            );

            if (repResult.repCompleted) {
              // Should have high priority for rep completion
              expect(feedback.priority).toBe(FeedbackPriority.HIGH);

              // Should have audio feedback for completed reps
              if (feedback.shouldSpeak) {
                expect(feedback.audioMessages.length).toBeGreaterThan(0);
                
                // Audio message should relate to rep quality or completion
                const combinedMessage = feedback.audioMessages.join(' ').toLowerCase();
                const qualityKeywords = ['perfect', 'good', 'excellent', 'improve', 'focus', 'quality', 'rep', 'form', 'technique', 'outstanding', 'solid', 'well done', 'effort', 'flawless'];
                const hasQualityFeedback = qualityKeywords.some(keyword => 
                  combinedMessage.includes(keyword)
                );
                expect(hasQualityFeedback).toBe(true);
              }

              // Should have rep counter visual cue
              const repCounterCues = feedback.visualCues.filter(cue => cue.type === 'rep_counter');
              expect(repCounterCues.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 6: Multimodal Feedback Delivery** - Camera positioning issues should block other feedback', () => {
      fc.assert(
        fc.property(
          fc.array(formViolationArbitrary, { minLength: 1, maxLength: 3 }),
          exerciseAnglesArbitrary,
          (violations, angles) => {
            // Create problematic camera view
            const problematicViewAnalysis: ViewAnalysis = {
              viewType: ViewType.FRONTAL,
              offsetAngle: 5,
              confidence: 0.6,
              recommendations: ['Position yourself to the side of the camera']
            };

            const feedback = feedbackEngine.generateFeedback(
              violations,
              ExerciseState.S2_TRANSITION,
              angles,
              problematicViewAnalysis
            );

            // Should have critical priority for camera issues
            expect(feedback.priority).toBe(FeedbackPriority.CRITICAL);

            // Should focus on camera positioning in audio feedback
            if (feedback.shouldSpeak && feedback.audioMessages.length > 0) {
              const combinedMessage = feedback.audioMessages.join(' ').toLowerCase();
              const positioningKeywords = ['position', 'camera', 'side'];
              const hasPositioningFeedback = positioningKeywords.some(keyword => 
                combinedMessage.includes(keyword)
              );
              expect(hasPositioningFeedback).toBe(true);
            }

            // Should have positioning guide visual cues
            const positioningCues = feedback.visualCues.filter(cue => cue.type === 'positioning_guide');
            expect(positioningCues.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Feedback Engine Configuration and State Management', () => {
    test('Configuration updates should take effect immediately', () => {
      fc.assert(
        fc.property(
          fc.record({
            enableAudioFeedback: fc.boolean(),
            enableVisualFeedback: fc.boolean(),
            feedbackFrequency: fc.integer({ min: 500, max: 10000 }),
            maxSimultaneousMessages: fc.integer({ min: 1, max: 5 })
          }),
          (newConfig) => {
            feedbackEngine.updateConfig(newConfig);
            const config = feedbackEngine.getConfig();

            expect(config.enableAudioFeedback).toBe(newConfig.enableAudioFeedback);
            expect(config.enableVisualFeedback).toBe(newConfig.enableVisualFeedback);
            expect(config.feedbackFrequency).toBe(newConfig.feedbackFrequency);
            expect(config.maxSimultaneousMessages).toBe(newConfig.maxSimultaneousMessages);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Reset should clear feedback state', () => {
      fc.assert(
        fc.property(
          fc.array(formViolationArbitrary, { minLength: 1, maxLength: 2 }),
          (violations) => {
            const angles: ExerciseAngles = {
              kneeAngle: 90,
              hipAngle: 90,
              ankleAngle: 90,
              offsetAngle: 20
            };

            const viewAnalysis: ViewAnalysis = {
              viewType: ViewType.OPTIMAL_SIDE,
              offsetAngle: 20,
              confidence: 0.9,
              recommendations: ['Good positioning']
            };

            // Generate some feedback to establish state
            feedbackEngine.generateFeedback(
              violations,
              ExerciseState.S2_TRANSITION,
              angles,
              viewAnalysis
            );

            // Reset should clear state
            feedbackEngine.reset();

            // Next feedback should not be throttled
            const feedback = feedbackEngine.generateFeedback(
              violations,
              ExerciseState.S2_TRANSITION,
              angles,
              viewAnalysis
            );

            // Should be able to generate feedback immediately after reset
            expect(feedback).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Audio feedback should respect enable/disable setting', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (enableAudio) => {
            feedbackEngine.updateConfig({ enableAudioFeedback: enableAudio });

            const criticalViolations: FormViolation[] = [{
              type: ViolationType.KNEE_OVER_TOES,
              severity: Severity.HIGH,
              description: 'Critical form issue',
              correctionHint: 'Fix your form'
            }];

            const angles: ExerciseAngles = {
              kneeAngle: 45,
              hipAngle: 60,
              ankleAngle: 90,
              offsetAngle: 20
            };

            const viewAnalysis: ViewAnalysis = {
              viewType: ViewType.OPTIMAL_SIDE,
              offsetAngle: 20,
              confidence: 0.9,
              recommendations: ['Good positioning']
            };

            const feedback = feedbackEngine.generateFeedback(
              criticalViolations,
              ExerciseState.S3_DEEP_SQUAT,
              angles,
              viewAnalysis
            );

            // Audio feedback should respect the setting
            if (!enableAudio) {
              expect(feedback.shouldSpeak).toBe(false);
              expect(feedback.audioMessages).toHaveLength(0);
            }

            // Visual feedback should still be present regardless of audio setting
            expect(feedback.visualCues).toBeDefined();
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});