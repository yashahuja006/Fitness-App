/**
 * Debug tests for RepCounter to understand why reps aren't completing
 */

import { RepCounter } from '../repCounter';
import { ExerciseState } from '@/types/advancedPose';

describe('RepCounter Debug Tests', () => {
  let repCounter: RepCounter;

  beforeEach(() => {
    repCounter = new RepCounter();
  });

  test('should complete a simple valid squat sequence', () => {
    const baseTime = Date.now();
    
    // Step 1: S1 -> S2 (start rep)
    const transition1 = {
      previousState: ExerciseState.S1_STANDING,
      currentState: ExerciseState.S2_TRANSITION,
      timestamp: baseTime,
      triggerAngles: { kneeAngle: 140, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }
    };
    
    const result1 = repCounter.processStateTransition(transition1, []);
    expect(result1.repCompleted).toBe(false);
    expect(repCounter.isTrackingRep()).toBe(true);

    // Step 2: S2 -> S3 (deep squat)
    const transition2 = {
      previousState: ExerciseState.S2_TRANSITION,
      currentState: ExerciseState.S3_DEEP_SQUAT,
      timestamp: baseTime + 2000, // 2 seconds later
      triggerAngles: { kneeAngle: 70, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }
    };
    
    const result2 = repCounter.processStateTransition(transition2, []);
    expect(result2.repCompleted).toBe(false);
    expect(repCounter.isTrackingRep()).toBe(true);

    // Step 3: S3 -> S2 (coming up)
    const transition3 = {
      previousState: ExerciseState.S3_DEEP_SQUAT,
      currentState: ExerciseState.S2_TRANSITION,
      timestamp: baseTime + 4000, // 4 seconds total
      triggerAngles: { kneeAngle: 140, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }
    };
    
    const result3 = repCounter.processStateTransition(transition3, []);
    expect(result3.repCompleted).toBe(false);
    expect(repCounter.isTrackingRep()).toBe(true);

    // Step 4: S2 -> S1 (complete rep) - Make sure total duration is > 2 seconds
    const transition4 = {
      previousState: ExerciseState.S2_TRANSITION,
      currentState: ExerciseState.S1_STANDING,
      timestamp: baseTime + 5000, // 5 seconds total - well above minimum
      triggerAngles: { kneeAngle: 170, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }
    };
    
    const result4 = repCounter.processStateTransition(transition4, []);

    // Should complete the rep
    expect(result4.repCompleted).toBe(true);
    expect(repCounter.getRepCounts().totalReps).toBe(1);
    expect(repCounter.isTrackingRep()).toBe(false);
  });

  test('should track state transitions correctly', () => {
    const baseTime = Date.now();
    
    // Start a rep
    const transition1 = {
      previousState: ExerciseState.S1_STANDING,
      currentState: ExerciseState.S2_TRANSITION,
      timestamp: baseTime,
      triggerAngles: { kneeAngle: 140, hipAngle: 90, ankleAngle: 90, offsetAngle: 20 }
    };
    
    repCounter.processStateTransition(transition1, []);
    
    const currentRep = repCounter.getCurrentRepData();
    
    expect(repCounter.isTrackingRep()).toBe(true);
    expect(currentRep?.stateTransitions).toHaveLength(1);
    expect(currentRep?.stateTransitions?.[0].currentState).toBe(ExerciseState.S2_TRANSITION);
  });
});