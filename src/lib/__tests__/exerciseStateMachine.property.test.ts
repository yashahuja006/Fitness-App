/**
 * Property-Based Tests for Exercise State Machine
 * Feature: advanced-pose-analysis
 */

import fc from 'fast-check';
import { ExerciseStateMachine, DEFAULT_THRESHOLDS } from '../exerciseStateMachine';
import { ExerciseState, ExerciseMode, type ExerciseAngles } from '@/types/advancedPose';

describe('ExerciseStateMachine Property Tests', () => {
  describe('Property 3: State Machine Transitions', () => {
    test('**Feature: advanced-pose-analysis, Property 3: State Machine Transitions** - State transitions should be correct based on knee angles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 180 }),
          (kneeAngle) => {
            const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
            const angles: ExerciseAngles = {
              kneeAngle,
              hipAngle: 90,
              ankleAngle: 90,
              offsetAngle: 20
            };

            const transition = stateMachine.updateState(angles);
            const currentState = stateMachine.getCurrentState();
            
            // Verify state transitions based on thresholds
            const beginnerThresholds = DEFAULT_THRESHOLDS.beginner;
            
            if (kneeAngle > beginnerThresholds.kneeAngle.s1Threshold) {
              expect(currentState).toBe(ExerciseState.S1_STANDING);
            } else if (kneeAngle < beginnerThresholds.kneeAngle.s3Threshold) {
              expect(currentState).toBe(ExerciseState.S3_DEEP_SQUAT);
            } else {
              expect(currentState).toBe(ExerciseState.S2_TRANSITION);
            }
            
            // Verify transition object structure
            expect(transition).toHaveProperty('previousState');
            expect(transition).toHaveProperty('currentState');
            expect(transition).toHaveProperty('timestamp');
            expect(transition).toHaveProperty('triggerAngles');
            expect(typeof transition.timestamp).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 3: State Machine Transitions** - Pro mode should have stricter thresholds than Beginner mode', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 75, max: 165 }), // Angles in the transition range
          (kneeAngle) => {
            const beginnerMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
            const proMachine = new ExerciseStateMachine(ExerciseMode.PRO);
            
            const angles: ExerciseAngles = {
              kneeAngle,
              hipAngle: 90,
              ankleAngle: 90,
              offsetAngle: 20
            };

            beginnerMachine.updateState(angles);
            proMachine.updateState(angles);
            
            const beginnerState = beginnerMachine.getCurrentState();
            const proState = proMachine.getCurrentState();
            
            // Verify thresholds are different
            const beginnerThresholds = DEFAULT_THRESHOLDS.beginner;
            const proThresholds = DEFAULT_THRESHOLDS.pro;
            
            expect(proThresholds.kneeAngle.s1Threshold).toBeGreaterThan(beginnerThresholds.kneeAngle.s1Threshold);
            expect(proThresholds.kneeAngle.s3Threshold).toBeGreaterThan(beginnerThresholds.kneeAngle.s3Threshold);
            
            // Both should be valid states
            expect(Object.values(ExerciseState)).toContain(beginnerState);
            expect(Object.values(ExerciseState)).toContain(proState);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Valid Repetition Recognition', () => {
    test('**Feature: advanced-pose-analysis, Property 4: Valid Repetition Recognition** - Complete squat sequence should be recognized as valid repetition', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER, undefined, true); // Enable testing mode
      
      // Simulate a complete squat sequence: s1 -> s2 -> s3 -> s2 -> s1
      const squatSequence = [
        { kneeAngle: 170, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }, // s1 - Standing
        { kneeAngle: 120, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }, // s2 - Transition down
        { kneeAngle: 70, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 },  // s3 - Deep squat
        { kneeAngle: 120, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }, // s2 - Transition up
        { kneeAngle: 170, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }  // s1 - Standing
      ];

      // Process the sequence
      squatSequence.forEach(angles => {
        stateMachine.updateState(angles);
      });

      // Should recognize as valid repetition
      expect(stateMachine.isValidRepetition()).toBe(true);
      
      // State sequence should contain the expected pattern
      const stateSequence = stateMachine.getStateSequence();
      expect(stateSequence.length).toBeGreaterThanOrEqual(5);
      
      // Should end in standing position
      expect(stateMachine.getCurrentState()).toBe(ExerciseState.S1_STANDING);
    });

    test('**Feature: advanced-pose-analysis, Property 4: Valid Repetition Recognition** - Incomplete sequences should not be valid repetitions', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 180 }), { minLength: 1, maxLength: 4 }),
          (kneeAngles) => {
            const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
            
            // Process incomplete sequence
            kneeAngles.forEach(kneeAngle => {
              const angles: ExerciseAngles = {
                kneeAngle,
                hipAngle: 90,
                ankleAngle: 90,
                offsetAngle: 20
              };
              stateMachine.updateState(angles);
            });

            // Incomplete sequences should not be valid (unless they happen to form a complete pattern)
            const stateSequence = stateMachine.getStateSequence();
            if (stateSequence.length < 5) {
              expect(stateMachine.isValidRepetition()).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 4: Valid Repetition Recognition** - Invalid sequences should be flagged as improper form', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
      
      // Simulate invalid sequence: s1 -> s3 (skipping transition)
      const invalidSequence = [
        { kneeAngle: 170, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }, // s1 - Standing
        { kneeAngle: 70, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 },  // s3 - Deep squat (skipped s2)
        { kneeAngle: 170, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }  // s1 - Standing
      ];

      // Process the invalid sequence
      invalidSequence.forEach(angles => {
        stateMachine.updateState(angles);
      });

      // Should not recognize as valid repetition
      expect(stateMachine.isValidRepetition()).toBe(false);
    });
  });

  describe('State Machine Properties', () => {
    test('State machine should maintain consistent state', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 180 }), { minLength: 1, maxLength: 10 }),
          (kneeAngles) => {
            const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
            
            kneeAngles.forEach(kneeAngle => {
              const angles: ExerciseAngles = {
                kneeAngle,
                hipAngle: 90,
                ankleAngle: 90,
                offsetAngle: 20
              };
              
              const transition = stateMachine.updateState(angles);
              const currentState = stateMachine.getCurrentState();
              
              // Current state should match transition current state
              expect(currentState).toBe(transition.currentState);
              
              // State should be valid
              expect(Object.values(ExerciseState)).toContain(currentState);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('State sequence should grow monotonically', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
      let previousLength = stateMachine.getStateSequence().length;
      
      // Add some state transitions
      const angles: ExerciseAngles = {
        kneeAngle: 120,
        hipAngle: 90,
        ankleAngle: 90,
        offsetAngle: 20
      };
      
      for (let i = 0; i < 5; i++) {
        stateMachine.updateState(angles);
        const currentLength = stateMachine.getStateSequence().length;
        
        // Sequence should grow or stay same (due to smoothing)
        expect(currentLength).toBeGreaterThanOrEqual(previousLength);
        previousLength = currentLength;
      }
    });

    test('Reset should clear all state', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
      
      // Add some state transitions
      const angles: ExerciseAngles = {
        kneeAngle: 120,
        hipAngle: 90,
        ankleAngle: 90,
        offsetAngle: 20
      };
      
      stateMachine.updateState(angles);
      stateMachine.updateState({ ...angles, kneeAngle: 70 });
      
      // Verify state exists
      expect(stateMachine.getStateSequence().length).toBeGreaterThan(1);
      expect(stateMachine.getStateHistory().length).toBeGreaterThan(0);
      
      // Reset
      stateMachine.resetSequence();
      
      // Verify reset
      expect(stateMachine.getCurrentState()).toBe(ExerciseState.S1_STANDING);
      expect(stateMachine.getStateSequence()).toEqual([ExerciseState.S1_STANDING]);
      expect(stateMachine.getStateHistory()).toEqual([]);
    });

    test('Mode changes should update thresholds immediately', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
      
      expect(stateMachine.getCurrentMode()).toBe(ExerciseMode.BEGINNER);
      
      // Change mode
      stateMachine.setExerciseMode(ExerciseMode.PRO);
      
      expect(stateMachine.getCurrentMode()).toBe(ExerciseMode.PRO);
      
      // Thresholds should be different
      const thresholds = stateMachine.getThresholds();
      expect(thresholds.pro).toBeDefined();
      expect(thresholds.beginner).toBeDefined();
    });

    test('Inactivity detection should work correctly', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
      
      // Initially should not be inactive
      expect(stateMachine.isInactive(1000)).toBe(false);
      
      // Add a small delay to ensure time passes
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Wait for 10ms
      }
      
      // Test with very short timeout
      expect(stateMachine.isInactive(1)).toBe(true);
    });

    test('Statistics should be calculated correctly', () => {
      const stateMachine = new ExerciseStateMachine(ExerciseMode.BEGINNER);
      
      // Add some transitions
      const angles1: ExerciseAngles = { kneeAngle: 170, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 };
      const angles2: ExerciseAngles = { kneeAngle: 120, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 };
      const angles3: ExerciseAngles = { kneeAngle: 70, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 };
      
      stateMachine.updateState(angles1);
      stateMachine.updateState(angles2);
      stateMachine.updateState(angles3);
      
      const stats = stateMachine.getStatistics();
      
      expect(typeof stats.totalTransitions).toBe('number');
      expect(typeof stats.averageTransitionTime).toBe('number');
      expect(typeof stats.validSequences).toBe('number');
      expect(stats.timeInEachState).toHaveProperty(ExerciseState.S1_STANDING);
      expect(stats.timeInEachState).toHaveProperty(ExerciseState.S2_TRANSITION);
      expect(stats.timeInEachState).toHaveProperty(ExerciseState.S3_DEEP_SQUAT);
    });
  });
});