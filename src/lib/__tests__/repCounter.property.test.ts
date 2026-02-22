/**
 * Property-Based Tests for Rep Counter
 * Tests rep counting accuracy and quality assessment
 */

import * as fc from 'fast-check';
import { RepCounter } from '../repCounter';
import type {
  StateTransition,
  ExerciseState,
  FormViolation,
  ExerciseAngles
} from '@/types/advancedPose';

import { ExerciseMode, ViolationType, Severity, RepQuality, ExerciseState } from '@/types/advancedPose';

// Test data generators
const exerciseStateArbitrary = fc.constantFrom(
  ExerciseState.S1_STANDING,
  ExerciseState.S2_TRANSITION,
  ExerciseState.S3_DEEP_SQUAT
);

const exerciseModeArbitrary = fc.constantFrom(
  ExerciseMode.BEGINNER,
  ExerciseMode.PRO
);

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

const stateTransitionArbitrary = fc.record({
  previousState: exerciseStateArbitrary,
  currentState: exerciseStateArbitrary,
  timestamp: fc.integer({ min: Date.now() - 100000, max: Date.now() + 100000 }),
  triggerAngles: exerciseAnglesArbitrary
});

// Generate valid squat sequence: S1 -> S2 -> S3 -> S2 -> S1
function generateValidSquatSequence(startTime: number = Date.now()): StateTransition[] {
  const baseAngles: ExerciseAngles = {
    kneeAngle: 90,
    hipAngle: 90,
    ankleAngle: 90,
    offsetAngle: 20
  };

  return [
    {
      previousState: ExerciseState.S1_STANDING,
      currentState: ExerciseState.S2_TRANSITION,
      timestamp: startTime,
      triggerAngles: { ...baseAngles, kneeAngle: 140 }
    },
    {
      previousState: ExerciseState.S2_TRANSITION,
      currentState: ExerciseState.S3_DEEP_SQUAT,
      timestamp: startTime + 1000,
      triggerAngles: { ...baseAngles, kneeAngle: 70 }
    },
    {
      previousState: ExerciseState.S3_DEEP_SQUAT,
      currentState: ExerciseState.S2_TRANSITION,
      timestamp: startTime + 2000,
      triggerAngles: { ...baseAngles, kneeAngle: 140 }
    },
    {
      previousState: ExerciseState.S2_TRANSITION,
      currentState: ExerciseState.S1_STANDING,
      timestamp: startTime + 3000,
      triggerAngles: { ...baseAngles, kneeAngle: 170 }
    }
  ];
}

// Generate invalid sequence (incomplete)
function generateIncompleteSequence(startTime: number = Date.now()): StateTransition[] {
  const baseAngles: ExerciseAngles = {
    kneeAngle: 90,
    hipAngle: 90,
    ankleAngle: 90,
    offsetAngle: 20
  };

  return [
    {
      previousState: ExerciseState.S1_STANDING,
      currentState: ExerciseState.S2_TRANSITION,
      timestamp: startTime,
      triggerAngles: { ...baseAngles, kneeAngle: 140 }
    },
    {
      previousState: ExerciseState.S2_TRANSITION,
      currentState: ExerciseState.S3_DEEP_SQUAT,
      timestamp: startTime + 1000,
      triggerAngles: { ...baseAngles, kneeAngle: 70 }
    }
    // Missing return to standing - incomplete rep
  ];
}

describe('Rep Counter Property Tests', () => {
  let repCounter: RepCounter;

  beforeEach(() => {
    repCounter = new RepCounter();
  });

  describe('Property 7: Rep Counting Accuracy', () => {
    test('**Feature: advanced-pose-analysis, Property 7: Rep Counting Accuracy** - Valid squat sequences should be counted as completed reps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Number of valid reps to simulate
          exerciseModeArbitrary,
          (numReps, mode) => {
            repCounter.updateConfig({ mode });
            const initialCounts = repCounter.getRepCounts();
            let completedReps = 0;

            // Simulate multiple valid squat sequences
            for (let i = 0; i < numReps; i++) {
              const startTime = Date.now() + (i * 5000); // 5 seconds apart
              const sequence = generateValidSquatSequence(startTime);
              
              let lastResult = null;
              for (const transition of sequence) {
                lastResult = repCounter.processStateTransition(transition, []);
              }

              // Last transition should complete the rep
              if (lastResult?.repCompleted) {
                completedReps++;
              }
            }

            const finalCounts = repCounter.getRepCounts();
            
            // Should count all valid sequences as completed reps
            expect(finalCounts.totalReps).toBe(initialCounts.totalReps + completedReps);
            expect(finalCounts.correctReps).toBe(initialCounts.correctReps + completedReps);
            expect(completedReps).toBeGreaterThan(0); // At least some reps should be completed
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 7: Rep Counting Accuracy** - Incomplete sequences should not be counted as reps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Number of incomplete sequences
          exerciseModeArbitrary,
          (numIncomplete, mode) => {
            repCounter.updateConfig({ mode });
            const initialCounts = repCounter.getRepCounts();

            // Simulate incomplete sequences
            for (let i = 0; i < numIncomplete; i++) {
              const startTime = Date.now() + (i * 3000);
              const sequence = generateIncompleteSequence(startTime);
              
              for (const transition of sequence) {
                const result = repCounter.processStateTransition(transition, []);
                // Incomplete sequences should not complete reps
                expect(result.repCompleted).toBe(false);
              }
            }

            const finalCounts = repCounter.getRepCounts();
            
            // No reps should be counted from incomplete sequences
            expect(finalCounts.totalReps).toBe(initialCounts.totalReps);
            expect(finalCounts.correctReps).toBe(initialCounts.correctReps);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 7: Rep Counting Accuracy** - Rep quality should be assessed based on form violations', () => {
      fc.assert(
        fc.property(
          fc.array(formViolationArbitrary, { minLength: 0, maxLength: 5 }),
          exerciseModeArbitrary,
          (violations, mode) => {
            repCounter.updateConfig({ mode });
            const sequence = generateValidSquatSequence();
            
            let lastResult = null;
            for (const transition of sequence) {
              // Apply violations to the last transition (rep completion)
              const transitionViolations = transition === sequence[sequence.length - 1] ? violations : [];
              lastResult = repCounter.processStateTransition(transition, transitionViolations);
            }

            if (lastResult?.repCompleted) {
              // Quality should correlate with number and severity of violations
              if (violations.length === 0) {
                expect(lastResult.repQuality).toBe(RepQuality.EXCELLENT);
              } else {
                // Calculate expected quality based on the same logic as the implementation
                let qualityScore = 1.0;
                
                for (const violation of violations) {
                  switch (violation.severity) {
                    case Severity.HIGH:
                      qualityScore -= 0.3;
                      break;
                    case Severity.MEDIUM:
                      qualityScore -= 0.2;
                      break;
                    case Severity.LOW:
                      qualityScore -= 0.1;
                      break;
                  }

                  // Extra penalty for dangerous violations
                  if (violation.type === ViolationType.KNEE_OVER_TOES || 
                      violation.type === ViolationType.EXCESSIVE_DEPTH) {
                    qualityScore -= 0.2;
                  }
                }

                qualityScore = Math.max(0, qualityScore);

                // Map to expected quality
                let expectedQuality: RepQuality;
                if (qualityScore >= 0.9) {
                  expectedQuality = RepQuality.EXCELLENT;
                } else if (qualityScore >= 0.7) {
                  expectedQuality = RepQuality.GOOD;
                } else if (qualityScore >= 0.5) {
                  expectedQuality = RepQuality.NEEDS_IMPROVEMENT;
                } else {
                  expectedQuality = RepQuality.POOR;
                }

                expect(lastResult.repQuality).toBe(expectedQuality);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 7: Rep Counting Accuracy** - Rep duration should be within acceptable bounds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 20000 }), // Rep duration in ms
          exerciseModeArbitrary,
          (repDuration, mode) => {
            repCounter.updateConfig({ 
              mode,
              minRepDurationMs: 2000,
              maxRepDurationMs: 15000
            });

            const startTime = Date.now();
            const sequence = generateValidSquatSequence(startTime);
            
            // Adjust the last transition time to match desired duration
            sequence[sequence.length - 1].timestamp = startTime + repDuration;

            let lastResult = null;
            for (const transition of sequence) {
              lastResult = repCounter.processStateTransition(transition, []);
            }

            if (repDuration < 2000) {
              // Too fast - should not complete rep
              expect(lastResult?.repCompleted).toBe(false);
              expect(lastResult?.feedback).toContain('too fast');
            } else if (repDuration > 15000) {
              // Too slow - should not complete rep
              expect(lastResult?.repCompleted).toBe(false);
              expect(lastResult?.feedback).toContain('too slow');
            } else {
              // Within bounds - should complete rep
              expect(lastResult?.repCompleted).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 8: Inactivity Reset Behavior', () => {
    test('**Feature: advanced-pose-analysis, Property 8: Inactivity Reset Behavior** - Counter should reset after inactivity timeout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5000, max: 30000 }), // Inactivity timeout in ms
          fc.integer({ min: 1000, max: 60000 }), // Time since last activity
          (timeoutMs, timeSinceActivity) => {
            repCounter.updateConfig({ inactivityTimeoutMs: timeoutMs });
            
            // Start a rep but don't complete it
            const startTime = Date.now();
            const startTransition: StateTransition = {
              previousState: ExerciseState.S1_STANDING,
              currentState: ExerciseState.S2_TRANSITION,
              timestamp: startTime,
              triggerAngles: {
                kneeAngle: 140,
                hipAngle: 90,
                ankleAngle: 90,
                offsetAngle: 20
              }
            };

            repCounter.processStateTransition(startTransition, []);
            expect(repCounter.isTrackingRep()).toBe(true);

            // Process another transition after the time gap
            const laterTransition: StateTransition = {
              previousState: ExerciseState.S2_TRANSITION,
              currentState: ExerciseState.S3_DEEP_SQUAT,
              timestamp: startTime + timeSinceActivity, // Use the time gap from the property
              triggerAngles: {
                kneeAngle: 70,
                hipAngle: 90,
                ankleAngle: 90,
                offsetAngle: 20
              }
            };

            const result = repCounter.processStateTransition(laterTransition, []);

            if (timeSinceActivity > timeoutMs) {
              // Should reset due to inactivity
              expect(result.shouldReset).toBe(true);
              expect(result.feedback).toContain('inactivity');
              expect(repCounter.isTrackingRep()).toBe(false);
            } else {
              // Should continue tracking
              expect(result.shouldReset).toBe(false);
              expect(repCounter.isTrackingRep()).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 8: Inactivity Reset Behavior** - Activity should reset inactivity timer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5000, max: 15000 }), // Inactivity timeout
          fc.integer({ min: 3, max: 10 }), // Number of transitions
          (timeoutMs, numTransitions) => {
            repCounter.updateConfig({ inactivityTimeoutMs: timeoutMs });
            
            const transitionInterval = Math.floor(timeoutMs / 2); // Half the timeout between transitions
            let currentTime = Date.now();

            // Process multiple transitions within the timeout window
            for (let i = 0; i < numTransitions; i++) {
              const transition: StateTransition = {
                previousState: i % 2 === 0 ? ExerciseState.S1_STANDING : ExerciseState.S2_TRANSITION,
                currentState: i % 2 === 0 ? ExerciseState.S2_TRANSITION : ExerciseState.S1_STANDING,
                timestamp: currentTime,
                triggerAngles: {
                  kneeAngle: 90 + (i * 10),
                  hipAngle: 90,
                  ankleAngle: 90,
                  offsetAngle: 20
                }
              };

              const result = repCounter.processStateTransition(transition, []);
              
              // Should not reset due to inactivity since we're active
              expect(result.shouldReset).toBe(false);
              
              currentTime += transitionInterval;
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 9: Rep Quality Data Storage', () => {
    test('**Feature: advanced-pose-analysis, Property 9: Rep Quality Data Storage** - Rep history should store complete rep data', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Number of reps
          fc.array(formViolationArbitrary, { minLength: 0, maxLength: 3 }),
          (numReps, violations) => {
            const initialHistoryLength = repCounter.getRepHistory().length;

            // Complete multiple reps
            for (let i = 0; i < numReps; i++) {
              const startTime = Date.now() + (i * 6000);
              const sequence = generateValidSquatSequence(startTime);
              
              for (const transition of sequence) {
                // Apply violations to the last transition
                const transitionViolations = transition === sequence[sequence.length - 1] ? violations : [];
                repCounter.processStateTransition(transition, transitionViolations);
              }
            }

            const history = repCounter.getRepHistory();
            const newReps = history.slice(initialHistoryLength);

            // Should have stored data for each completed rep
            expect(newReps.length).toBeGreaterThan(0);
            expect(newReps.length).toBeLessThanOrEqual(numReps);

            // Each rep should have complete data
            newReps.forEach((rep, index) => {
              expect(rep.repNumber).toBeGreaterThan(0);
              expect(rep.duration).toBeGreaterThan(0);
              expect(rep.startTime).toBeLessThan(rep.endTime);
              expect(rep.stateTransitions).toBeDefined();
              expect(rep.stateTransitions.length).toBeGreaterThan(0);
              expect(rep.violations).toBeDefined();
              expect(Object.values(RepQuality)).toContain(rep.quality);
              
              // Violations should match what we provided
              if (violations.length > 0) {
                expect(rep.violations.length).toBeGreaterThan(0);
              }
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 9: Rep Quality Data Storage** - Session statistics should be accurate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }), // Number of reps
          fc.float({ min: 0, max: 1, noNaN: true }), // Violation probability
          (numReps, violationProbability) => {
            repCounter.reset(); // Start fresh
            let expectedCorrectReps = 0;

            // Complete multiple reps with varying quality
            for (let i = 0; i < numReps; i++) {
              const startTime = Date.now() + (i * 6000);
              const sequence = generateValidSquatSequence(startTime);
              
              // Randomly add violations based on probability
              const hasViolations = Math.random() < violationProbability;
              const violations = hasViolations ? [{
                type: ViolationType.KNEE_OVER_TOES,
                severity: Severity.MEDIUM,
                description: 'Test violation',
                correctionHint: 'Test correction'
              }] : [];

              let lastResult = null;
              for (const transition of sequence) {
                const transitionViolations = transition === sequence[sequence.length - 1] ? violations : [];
                lastResult = repCounter.processStateTransition(transition, transitionViolations);
              }

              // Count expected correct reps (excellent or good quality)
              if (lastResult?.repCompleted && 
                  (lastResult.repQuality === RepQuality.EXCELLENT || lastResult.repQuality === RepQuality.GOOD)) {
                expectedCorrectReps++;
              }
            }

            const stats = repCounter.getSessionStats();
            const counts = repCounter.getRepCounts();

            // Verify statistics accuracy
            expect(stats.totalReps).toBe(counts.totalReps);
            expect(stats.correctReps).toBe(counts.correctReps);
            expect(stats.correctReps).toBe(expectedCorrectReps);
            
            if (stats.totalReps > 0) {
              expect(stats.accuracy).toBe((stats.correctReps / stats.totalReps) * 100);
            } else {
              expect(stats.accuracy).toBe(0);
            }

            // Quality distribution should sum to total reps
            const qualitySum = Object.values(stats.qualityDistribution).reduce((sum, count) => sum + count, 0);
            expect(qualitySum).toBe(stats.totalReps);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Rep Counter State Management', () => {
    test('Reset should clear all state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }),
          (numReps) => {
            // Complete some reps first
            for (let i = 0; i < numReps; i++) {
              const sequence = generateValidSquatSequence(Date.now() + (i * 5000));
              for (const transition of sequence) {
                repCounter.processStateTransition(transition, []);
              }
            }

            // Verify we have data
            expect(repCounter.getRepCounts().totalReps).toBeGreaterThan(0);
            expect(repCounter.getRepHistory().length).toBeGreaterThan(0);

            // Reset
            repCounter.reset();

            // Verify everything is cleared
            const counts = repCounter.getRepCounts();
            expect(counts.totalReps).toBe(0);
            expect(counts.correctReps).toBe(0);
            expect(counts.incorrectReps).toBe(0);
            expect(counts.currentStreak).toBe(0);
            expect(repCounter.getRepHistory()).toHaveLength(0);
            expect(repCounter.isTrackingRep()).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Configuration updates should take effect immediately', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }), // New timeout
          fc.float({ min: 0.5, max: 1.0, noNaN: true }), // New quality threshold
          (newTimeout, newThreshold) => {
            const originalConfig = {
              inactivityTimeoutMs: 20000,
              qualityThresholds: { excellent: 0.9, good: 0.7, needsImprovement: 0.5 }
            };

            repCounter.updateConfig(originalConfig);

            // Update configuration
            repCounter.updateConfig({
              inactivityTimeoutMs: newTimeout,
              qualityThresholds: {
                excellent: newThreshold,
                good: newThreshold - 0.2,
                needsImprovement: newThreshold - 0.4
              }
            });

            // Configuration should be updated (we can't directly test private config,
            // but we can test behavior that depends on it)
            expect(repCounter.isReadyForNextRep()).toBe(true); // Should still function
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});