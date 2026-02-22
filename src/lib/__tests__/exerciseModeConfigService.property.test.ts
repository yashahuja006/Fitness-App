/**
 * Property-based tests for Exercise Mode Configuration Service
 * Tests mode-specific threshold application and immediate parameter updates
 */

import fc from 'fast-check';
import { 
  ExerciseModeConfigService, 
  exerciseModeConfigService,
  ExerciseModeUtils 
} from '../exerciseModeConfigService';
import { ExerciseMode, ExerciseType } from '@/types/advancedPose';
import type { ModeThresholds, ExerciseThresholds } from '@/types/advancedPose';

describe('ExerciseModeConfigService Property Tests', () => {
  // Test data generators
  const exerciseModeArbitrary = fc.constantFrom(
    ExerciseMode.BEGINNER,
    ExerciseMode.PRO
  );

  const exerciseTypeArbitrary = fc.constantFrom(
    'squat' as ExerciseType,
    'pushup' as ExerciseType,
    'plank' as ExerciseType,
    'deadlift' as ExerciseType,
    'bicep_curl' as ExerciseType
  );

  const angleThresholdsArbitrary = fc.record({
    s1Threshold: fc.integer({ min: 150, max: 180 }),
    s2Range: fc.tuple(
      fc.integer({ min: 70, max: 90 }),
      fc.integer({ min: 150, max: 170 })
    ).map(([min, max]) => [min, max] as [number, number]),
    s3Threshold: fc.integer({ min: 60, max: 90 }),
    warningTolerance: fc.integer({ min: 3, max: 15 })
  });

  const modeThresholdsArbitrary = fc.record({
    kneeAngle: angleThresholdsArbitrary,
    hipAngle: angleThresholdsArbitrary,
    offsetAngle: angleThresholdsArbitrary,
    feedbackSensitivity: fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }),
    inactivityTimeout: fc.integer({ min: 10, max: 60 })
  });

  describe('Property 11: Mode-Specific Threshold Application', () => {
    test('**Feature: advanced-pose-analysis, Property 11: Mode-Specific Threshold Application** - For any exercise analysis, the system should apply the correct angle thresholds (lenient for Beginner mode, strict for Pro mode) based on the currently selected exercise mode', () => {
      fc.assert(
        fc.property(
          exerciseModeArbitrary,
          exerciseTypeArbitrary,
          (mode, exerciseType) => {
            // Create a fresh service instance for each test
            const service = new ExerciseModeConfigService(mode, exerciseType);
            
            // Get current configuration
            const config = service.getCurrentConfig();
            const currentThresholds = service.getCurrentThresholds();
            
            // Verify mode is correctly set
            expect(config.mode).toBe(mode);
            expect(service.getCurrentMode()).toBe(mode);
            
            // Verify exercise type is correctly set
            expect(config.exerciseType).toBe(exerciseType);
            expect(service.getCurrentExerciseType()).toBe(exerciseType);
            
            // Verify thresholds are applied for the correct mode
            expect(currentThresholds).toEqual(config.thresholds[mode]);
            
            // Verify mode-specific characteristics
            if (mode === ExerciseMode.BEGINNER) {
              // Beginner mode should have more lenient thresholds
              const proThresholds = config.thresholds[ExerciseMode.PRO];
              
              // Beginner should have lower feedback sensitivity (more lenient)
              expect(currentThresholds.feedbackSensitivity).toBeLessThanOrEqual(
                proThresholds.feedbackSensitivity
              );
              
              // Beginner should have longer inactivity timeout (more lenient)
              expect(currentThresholds.inactivityTimeout).toBeGreaterThanOrEqual(
                proThresholds.inactivityTimeout
              );
              
              // Beginner should have larger warning tolerance (more lenient)
              expect(currentThresholds.kneeAngle.warningTolerance).toBeGreaterThanOrEqual(
                proThresholds.kneeAngle.warningTolerance
              );
            } else if (mode === ExerciseMode.PRO) {
              // Pro mode should have stricter thresholds
              const beginnerThresholds = config.thresholds[ExerciseMode.BEGINNER];
              
              // Pro should have higher feedback sensitivity (stricter)
              expect(currentThresholds.feedbackSensitivity).toBeGreaterThanOrEqual(
                beginnerThresholds.feedbackSensitivity
              );
              
              // Pro should have shorter inactivity timeout (stricter)
              expect(currentThresholds.inactivityTimeout).toBeLessThanOrEqual(
                beginnerThresholds.inactivityTimeout
              );
              
              // Pro should have smaller warning tolerance (stricter)
              expect(currentThresholds.kneeAngle.warningTolerance).toBeLessThanOrEqual(
                beginnerThresholds.kneeAngle.warningTolerance
              );
            }
            
            // Verify threshold structure is valid
            const validation = ExerciseModeUtils.validateThresholds(currentThresholds);
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
              console.error('Validation errors:', validation.errors);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Mode switching should immediately apply correct thresholds', () => {
      fc.assert(
        fc.property(
          exerciseModeArbitrary,
          exerciseModeArbitrary,
          exerciseTypeArbitrary,
          (initialMode, targetMode, exerciseType) => {
            // Skip if modes are the same
            fc.pre(initialMode !== targetMode);
            
            // Create service with initial mode
            const service = new ExerciseModeConfigService(initialMode, exerciseType);
            
            // Get initial thresholds
            const initialThresholds = service.getCurrentThresholds();
            const initialConfig = service.getCurrentConfig();
            
            // Switch mode
            const event = service.switchMode(targetMode);
            
            // Verify event details
            expect(event.previousMode).toBe(initialMode);
            expect(event.newMode).toBe(targetMode);
            expect(event.exerciseType).toBe(exerciseType);
            expect(event.configChanges.thresholds).toBe(true);
            
            // Get new thresholds
            const newThresholds = service.getCurrentThresholds();
            const newConfig = service.getCurrentConfig();
            
            // Verify mode changed
            expect(service.getCurrentMode()).toBe(targetMode);
            expect(newConfig.mode).toBe(targetMode);
            
            // Verify thresholds changed to match new mode
            expect(newThresholds).toEqual(newConfig.thresholds[targetMode]);
            expect(newThresholds).not.toEqual(initialThresholds);
            
            // Verify thresholds are different between modes (unless they happen to be identical)
            const comparison = ExerciseModeUtils.compareThresholds(
              initialConfig.thresholds[initialMode],
              newConfig.thresholds[targetMode]
            );
            
            // For default configurations, modes should have different thresholds
            if (initialMode === ExerciseMode.BEGINNER && targetMode === ExerciseMode.PRO) {
              expect(comparison.identical).toBe(false);
              expect(comparison.differences.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 12: Immediate Mode Parameter Updates', () => {
    test('**Feature: advanced-pose-analysis, Property 12: Immediate Mode Parameter Updates** - For any exercise mode change, all analysis parameters should be updated immediately to reflect the new mode settings', () => {
      fc.assert(
        fc.property(
          exerciseModeArbitrary,
          exerciseModeArbitrary,
          exerciseTypeArbitrary,
          (initialMode, newMode, exerciseType) => {
            // Skip if modes are the same
            fc.pre(initialMode !== newMode);
            
            // Create service with initial mode
            const service = new ExerciseModeConfigService(initialMode, exerciseType);
            
            // Record initial state
            const initialConfig = service.getCurrentConfig();
            const initialTimestamp = Date.now();
            
            // Switch mode and measure timing
            const startTime = performance.now();
            const event = service.switchMode(newMode);
            const endTime = performance.now();
            const switchDuration = endTime - startTime;
            
            // Verify immediate update (should complete within reasonable time)
            expect(switchDuration).toBeLessThan(100); // Less than 100ms for immediate update
            
            // Verify all parameters updated immediately
            const updatedConfig = service.getCurrentConfig();
            
            // 1. Mode should be updated immediately
            expect(service.getCurrentMode()).toBe(newMode);
            expect(updatedConfig.mode).toBe(newMode);
            
            // 2. Thresholds should be updated immediately
            const newThresholds = service.getCurrentThresholds();
            expect(newThresholds).toEqual(updatedConfig.thresholds[newMode]);
            expect(newThresholds).not.toEqual(initialConfig.thresholds[initialMode]);
            
            // 3. Feedback configuration should be updated immediately
            expect(updatedConfig.feedbackConfig.sensitivity).toBe(newThresholds.feedbackSensitivity);
            expect(updatedConfig.feedbackConfig.frequency).toBe(newMode === 'pro' ? 3000 : 2000);
            expect(updatedConfig.feedbackConfig.priorityThreshold).toBe(newMode === 'pro' ? 'medium' : 'low');
            
            // 4. Analysis configuration should be updated immediately
            expect(updatedConfig.analysisConfig.inactivityTimeout).toBe(newThresholds.inactivityTimeout);
            expect(updatedConfig.analysisConfig.minStateTransitionTime).toBe(newMode === 'pro' ? 150 : 200);
            
            // 5. Event should indicate what changed
            expect(event.configChanges.thresholds).toBe(true);
            expect(event.configChanges.feedback).toBe(true);
            expect(event.configChanges.analysis).toBe(true);
            
            // 6. Event timestamp should be recent
            expect(event.timestamp).toBeGreaterThanOrEqual(initialTimestamp);
            expect(event.timestamp).toBeLessThanOrEqual(Date.now());
            
            // 7. Configuration should be internally consistent
            expect(updatedConfig.thresholds[newMode].feedbackSensitivity).toBe(
              updatedConfig.feedbackConfig.sensitivity
            );
            expect(updatedConfig.thresholds[newMode].inactivityTimeout).toBe(
              updatedConfig.analysisConfig.inactivityTimeout
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Exercise type changes should immediately update all parameters', () => {
      fc.assert(
        fc.property(
          exerciseTypeArbitrary,
          exerciseTypeArbitrary,
          exerciseModeArbitrary,
          (initialType, newType, mode) => {
            // Skip if types are the same
            fc.pre(initialType !== newType);
            
            // Create service with initial type
            const service = new ExerciseModeConfigService(mode, initialType);
            
            // Record initial state
            const initialConfig = service.getCurrentConfig();
            
            // Switch exercise type and measure timing
            const startTime = performance.now();
            const event = service.switchExerciseType(newType);
            const endTime = performance.now();
            const switchDuration = endTime - startTime;
            
            // Verify immediate update
            expect(switchDuration).toBeLessThan(100); // Less than 100ms
            
            // Verify all parameters updated immediately
            const updatedConfig = service.getCurrentConfig();
            
            // 1. Exercise type should be updated immediately
            expect(service.getCurrentExerciseType()).toBe(newType);
            expect(updatedConfig.exerciseType).toBe(newType);
            
            // 2. Thresholds should be updated for new exercise type
            const newThresholds = service.getCurrentThresholds();
            expect(newThresholds).toEqual(updatedConfig.thresholds[mode]);
            
            // 3. Event should reflect the change
            expect(event.exerciseType).toBe(newType);
            expect(event.newMode).toBe(mode); // Mode should remain the same
            expect(event.previousMode).toBe(mode);
            
            // 4. Configuration should be valid for new exercise type
            const validation = ExerciseModeUtils.validateThresholds(newThresholds);
            expect(validation.valid).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('Threshold updates should be applied immediately', () => {
      fc.assert(
        fc.property(
          exerciseModeArbitrary,
          exerciseTypeArbitrary,
          modeThresholdsArbitrary,
          (mode, exerciseType, customThresholds) => {
            // Ensure custom thresholds are valid
            const validation = ExerciseModeUtils.validateThresholds(customThresholds);
            fc.pre(validation.valid);
            
            // Create service
            const service = new ExerciseModeConfigService(mode, exerciseType);
            
            // Get initial thresholds
            const initialThresholds = service.getCurrentThresholds();
            
            // Update thresholds and measure timing
            const startTime = performance.now();
            service.updateThresholds(mode, customThresholds);
            const endTime = performance.now();
            const updateDuration = endTime - startTime;
            
            // Verify immediate update
            expect(updateDuration).toBeLessThan(50); // Less than 50ms
            
            // Verify thresholds updated immediately
            const updatedThresholds = service.getCurrentThresholds();
            
            // Should match the custom thresholds
            expect(updatedThresholds).toEqual(customThresholds);
            expect(updatedThresholds).not.toEqual(initialThresholds);
            
            // Configuration should be updated
            const updatedConfig = service.getCurrentConfig();
            expect(updatedConfig.thresholds[mode]).toEqual(customThresholds);
            
            // Feedback and analysis configs should reflect threshold changes
            expect(updatedConfig.feedbackConfig.sensitivity).toBe(customThresholds.feedbackSensitivity);
            expect(updatedConfig.analysisConfig.inactivityTimeout).toBe(customThresholds.inactivityTimeout);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Configuration Consistency Properties', () => {
    test('Configuration should always be internally consistent', () => {
      fc.assert(
        fc.property(
          exerciseModeArbitrary,
          exerciseTypeArbitrary,
          (mode, exerciseType) => {
            const service = new ExerciseModeConfigService(mode, exerciseType);
            const config = service.getCurrentConfig();
            const thresholds = service.getCurrentThresholds();
            
            // Internal consistency checks
            expect(config.mode).toBe(mode);
            expect(config.exerciseType).toBe(exerciseType);
            expect(config.thresholds[mode]).toEqual(thresholds);
            expect(config.feedbackConfig.sensitivity).toBe(thresholds.feedbackSensitivity);
            expect(config.analysisConfig.inactivityTimeout).toBe(thresholds.inactivityTimeout);
            
            // Threshold validation
            const validation = ExerciseModeUtils.validateThresholds(thresholds);
            expect(validation.valid).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Mode strictness ordering should be consistent', () => {
      fc.assert(
        fc.property(
          exerciseTypeArbitrary,
          (exerciseType) => {
            const service = new ExerciseModeConfigService(ExerciseMode.BEGINNER, exerciseType);
            
            // Pro mode should be more strict than Beginner mode
            expect(service.isModeMoreStrict(ExerciseMode.PRO, ExerciseMode.BEGINNER)).toBe(true);
            expect(service.isModeMoreStrict(ExerciseMode.BEGINNER, ExerciseMode.PRO)).toBe(false);
            expect(service.isModeMoreStrict(ExerciseMode.BEGINNER, ExerciseMode.BEGINNER)).toBe(false);
            expect(service.isModeMoreStrict(ExerciseMode.PRO, ExerciseMode.PRO)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Service State Management Properties', () => {
    test('Service should maintain state correctly across operations', () => {
      fc.assert(
        fc.property(
          fc.array(exerciseModeArbitrary, { minLength: 2, maxLength: 5 }),
          exerciseTypeArbitrary,
          (modeSequence, exerciseType) => {
            const service = new ExerciseModeConfigService(modeSequence[0], exerciseType);
            
            // Apply sequence of mode changes
            let previousMode = modeSequence[0];
            let expectedEventCount = 0;
            
            for (let i = 1; i < modeSequence.length; i++) {
              const newMode = modeSequence[i];
              const event = service.switchMode(newMode);
              
              // Verify event consistency
              expect(event.previousMode).toBe(previousMode);
              expect(event.newMode).toBe(newMode);
              expect(event.exerciseType).toBe(exerciseType);
              
              // Only count events where mode actually changed
              if (newMode !== previousMode) {
                expectedEventCount++;
              }
              
              // Verify current state
              expect(service.getCurrentMode()).toBe(newMode);
              expect(service.getCurrentExerciseType()).toBe(exerciseType);
              
              previousMode = newMode;
            }
            
            // Final state should match last mode in sequence
            expect(service.getCurrentMode()).toBe(modeSequence[modeSequence.length - 1]);
            
            // History should contain only actual changes
            const history = service.getModeChangeHistory();
            expect(history.length).toBe(expectedEventCount);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});