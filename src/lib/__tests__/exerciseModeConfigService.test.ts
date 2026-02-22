/**
 * Unit tests for Exercise Mode Configuration Service
 * Tests specific examples and edge cases
 */

import { 
  ExerciseModeConfigService, 
  exerciseModeConfigService,
  ExerciseModeUtils 
} from '../exerciseModeConfigService';
import { ExerciseMode, ExerciseType } from '@/types/advancedPose';
import type { ModeThresholds } from '@/types/advancedPose';

describe('ExerciseModeConfigService Unit Tests', () => {
  let service: ExerciseModeConfigService;

  beforeEach(() => {
    // Create fresh service instance for each test
    service = new ExerciseModeConfigService();
  });

  describe('Initialization', () => {
    test('should initialize with default beginner mode and squat exercise', () => {
      const config = service.getCurrentConfig();
      
      expect(service.getCurrentMode()).toBe(ExerciseMode.BEGINNER);
      expect(service.getCurrentExerciseType()).toBe('squat');
      expect(config.mode).toBe(ExerciseMode.BEGINNER);
      expect(config.exerciseType).toBe('squat');
    });

    test('should initialize with custom mode and exercise type', () => {
      const customService = new ExerciseModeConfigService(ExerciseMode.PRO, 'pushup' as ExerciseType);
      
      expect(customService.getCurrentMode()).toBe(ExerciseMode.PRO);
      expect(customService.getCurrentExerciseType()).toBe('pushup');
    });

    test('should have valid default thresholds', () => {
      const thresholds = service.getCurrentThresholds();
      const validation = ExerciseModeUtils.validateThresholds(thresholds);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Mode Switching', () => {
    test('should switch from beginner to pro mode', () => {
      expect(service.getCurrentMode()).toBe(ExerciseMode.BEGINNER);
      
      const event = service.switchMode(ExerciseMode.PRO);
      
      expect(event.previousMode).toBe(ExerciseMode.BEGINNER);
      expect(event.newMode).toBe(ExerciseMode.PRO);
      expect(event.configChanges.thresholds).toBe(true);
      expect(service.getCurrentMode()).toBe(ExerciseMode.PRO);
    });

    test('should not create event when switching to same mode', () => {
      const event = service.switchMode(ExerciseMode.BEGINNER);
      
      expect(event.previousMode).toBe(ExerciseMode.BEGINNER);
      expect(event.newMode).toBe(ExerciseMode.BEGINNER);
      expect(event.configChanges.thresholds).toBe(false);
      expect(event.configChanges.feedback).toBe(false);
      expect(event.configChanges.analysis).toBe(false);
    });

    test('should update feedback configuration when switching modes', () => {
      // Start in beginner mode
      const beginnerConfig = service.getCurrentConfig();
      expect(beginnerConfig.feedbackConfig.frequency).toBe(2000);
      expect(beginnerConfig.feedbackConfig.priorityThreshold).toBe('low');
      
      // Switch to pro mode
      service.switchMode(ExerciseMode.PRO);
      const proConfig = service.getCurrentConfig();
      
      expect(proConfig.feedbackConfig.frequency).toBe(3000);
      expect(proConfig.feedbackConfig.priorityThreshold).toBe('medium');
    });

    test('should update analysis configuration when switching modes', () => {
      // Start in beginner mode
      const beginnerConfig = service.getCurrentConfig();
      expect(beginnerConfig.analysisConfig.minStateTransitionTime).toBe(200);
      
      // Switch to pro mode
      service.switchMode(ExerciseMode.PRO);
      const proConfig = service.getCurrentConfig();
      
      expect(proConfig.analysisConfig.minStateTransitionTime).toBe(150);
    });
  });

  describe('Exercise Type Switching', () => {
    test('should switch from squat to pushup exercise', () => {
      expect(service.getCurrentExerciseType()).toBe('squat');
      
      const event = service.switchExerciseType('pushup' as ExerciseType);
      
      expect(event.exerciseType).toBe('pushup');
      expect(event.configChanges.thresholds).toBe(true);
      expect(service.getCurrentExerciseType()).toBe('pushup');
    });

    test('should preserve mode when switching exercise type', () => {
      service.switchMode(ExerciseMode.PRO);
      expect(service.getCurrentMode()).toBe(ExerciseMode.PRO);
      
      service.switchExerciseType('deadlift' as ExerciseType);
      
      expect(service.getCurrentMode()).toBe(ExerciseMode.PRO);
      expect(service.getCurrentExerciseType()).toBe('deadlift');
    });

    test('should not create significant event when switching to same exercise type', () => {
      const event = service.switchExerciseType('squat' as ExerciseType);
      
      expect(event.exerciseType).toBe('squat');
      expect(event.configChanges.thresholds).toBe(false);
      expect(event.configChanges.feedback).toBe(false);
      expect(event.configChanges.analysis).toBe(false);
    });
  });

  describe('Threshold Management', () => {
    test('should update specific thresholds', () => {
      const originalThresholds = service.getCurrentThresholds();
      const customThresholds: Partial<ModeThresholds> = {
        feedbackSensitivity: 0.8,
        inactivityTimeout: 25
      };
      
      service.updateThresholds(ExerciseMode.BEGINNER, customThresholds);
      const updatedThresholds = service.getCurrentThresholds();
      
      expect(updatedThresholds.feedbackSensitivity).toBe(0.8);
      expect(updatedThresholds.inactivityTimeout).toBe(25);
      // Other thresholds should remain unchanged
      expect(updatedThresholds.kneeAngle).toEqual(originalThresholds.kneeAngle);
    });

    test('should update feedback and analysis configs when thresholds change', () => {
      service.updateThresholds(ExerciseMode.BEGINNER, {
        feedbackSensitivity: 0.9,
        inactivityTimeout: 30
      });
      
      const config = service.getCurrentConfig();
      expect(config.feedbackConfig.sensitivity).toBe(0.9);
      expect(config.analysisConfig.inactivityTimeout).toBe(30);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate correct thresholds', () => {
      const validThresholds: ModeThresholds = {
        kneeAngle: {
          s1Threshold: 160,
          s2Range: [80, 160],
          s3Threshold: 80,
          warningTolerance: 5
        },
        hipAngle: {
          s1Threshold: 175,
          s2Range: [85, 175],
          s3Threshold: 85,
          warningTolerance: 8
        },
        offsetAngle: {
          s1Threshold: 25,
          s2Range: [15, 25],
          s3Threshold: 15,
          warningTolerance: 5
        },
        feedbackSensitivity: 0.7,
        inactivityTimeout: 15
      };
      
      const validation = ExerciseModeUtils.validateThresholds(validThresholds);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid thresholds', () => {
      const invalidThresholds: ModeThresholds = {
        kneeAngle: {
          s1Threshold: 80, // Invalid: should be greater than s3Threshold
          s2Range: [80, 160],
          s3Threshold: 160, // Invalid: should be less than s1Threshold
          warningTolerance: -5 // Invalid: should be non-negative
        },
        hipAngle: {
          s1Threshold: 175,
          s2Range: [175, 85], // Invalid: min should be less than max
          s3Threshold: 85,
          warningTolerance: 8
        },
        offsetAngle: {
          s1Threshold: 25,
          s2Range: [15, 25],
          s3Threshold: 15,
          warningTolerance: 5
        },
        feedbackSensitivity: 1.5, // Invalid: should be between 0 and 1
        inactivityTimeout: 2 // Invalid: should be at least 5 seconds
      };
      
      const validation = ExerciseModeUtils.validateThresholds(invalidThresholds);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('s1Threshold must be greater than s3Threshold');
      expect(validation.errors).toContain('hip s2Range minimum must be less than maximum');
      expect(validation.errors).toContain('warningTolerance must be non-negative');
      expect(validation.errors).toContain('feedbackSensitivity must be between 0 and 1');
      expect(validation.errors).toContain('inactivityTimeout must be at least 5 seconds');
    });
  });

  describe('Threshold Comparison', () => {
    test('should detect identical thresholds', () => {
      const thresholds1 = service.getCurrentThresholds();
      const thresholds2 = { ...thresholds1 };
      
      const comparison = ExerciseModeUtils.compareThresholds(thresholds1, thresholds2);
      expect(comparison.identical).toBe(true);
      expect(comparison.differences).toHaveLength(0);
    });

    test('should detect different thresholds', () => {
      const beginnerService = new ExerciseModeConfigService(ExerciseMode.BEGINNER);
      const proService = new ExerciseModeConfigService(ExerciseMode.PRO);
      
      const beginnerThresholds = beginnerService.getCurrentThresholds();
      const proThresholds = proService.getCurrentThresholds();
      
      const comparison = ExerciseModeUtils.compareThresholds(beginnerThresholds, proThresholds);
      expect(comparison.identical).toBe(false);
      expect(comparison.differences.length).toBeGreaterThan(0);
    });
  });

  describe('Mode Strictness', () => {
    test('should correctly identify mode strictness', () => {
      expect(service.isModeMoreStrict(ExerciseMode.PRO, ExerciseMode.BEGINNER)).toBe(true);
      expect(service.isModeMoreStrict(ExerciseMode.BEGINNER, ExerciseMode.PRO)).toBe(false);
      expect(service.isModeMoreStrict(ExerciseMode.BEGINNER, ExerciseMode.BEGINNER)).toBe(false);
      expect(service.isModeMoreStrict(ExerciseMode.PRO, ExerciseMode.PRO)).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    test('should return correct feedback sensitivity', () => {
      const sensitivity = service.getFeedbackSensitivity();
      const thresholds = service.getCurrentThresholds();
      
      expect(sensitivity).toBe(thresholds.feedbackSensitivity);
    });

    test('should return correct inactivity timeout', () => {
      const timeout = service.getInactivityTimeout();
      const thresholds = service.getCurrentThresholds();
      
      expect(timeout).toBe(thresholds.inactivityTimeout);
    });

    test('should return available modes', () => {
      const modes = service.getAvailableModes();
      
      expect(modes).toContain(ExerciseMode.BEGINNER);
      expect(modes).toContain(ExerciseMode.PRO);
      expect(modes).toHaveLength(2);
    });

    test('should return available exercise types', () => {
      const types = service.getAvailableExerciseTypes();
      
      expect(types).toContain('squat');
      expect(types).toContain('pushup');
      expect(types).toContain('plank');
      expect(types).toContain('deadlift');
      expect(types).toContain('bicep_curl');
      expect(types.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset to defaults', () => {
      // Make some changes
      service.switchMode(ExerciseMode.PRO);
      service.switchExerciseType('pushup' as ExerciseType);
      service.updateThresholds(ExerciseMode.PRO, { feedbackSensitivity: 0.9 });
      
      // Reset to defaults
      const event = service.resetToDefaults();
      
      expect(event.newMode).toBe(ExerciseMode.BEGINNER);
      expect(event.exerciseType).toBe('squat');
      expect(service.getCurrentMode()).toBe(ExerciseMode.BEGINNER);
      expect(service.getCurrentExerciseType()).toBe('squat');
      
      // Thresholds should be back to defaults
      const thresholds = service.getCurrentThresholds();
      const validation = ExerciseModeUtils.validateThresholds(thresholds);
      expect(validation.valid).toBe(true);
    });

    test('should reset to specific mode and exercise type', () => {
      const event = service.resetToDefaults(ExerciseMode.PRO, 'deadlift' as ExerciseType);
      
      expect(event.newMode).toBe(ExerciseMode.PRO);
      expect(event.exerciseType).toBe('deadlift');
      expect(service.getCurrentMode()).toBe(ExerciseMode.PRO);
      expect(service.getCurrentExerciseType()).toBe('deadlift');
    });
  });

  describe('Event History', () => {
    test('should track mode change history', () => {
      const initialHistory = service.getModeChangeHistory();
      expect(initialHistory).toHaveLength(0);
      
      service.switchMode(ExerciseMode.PRO);
      service.switchExerciseType('pushup' as ExerciseType);
      service.switchMode(ExerciseMode.BEGINNER);
      
      const history = service.getModeChangeHistory();
      expect(history).toHaveLength(3);
      
      // Events should be in chronological order (oldest first, as they're added to end)
      expect(history[2].newMode).toBe(ExerciseMode.BEGINNER); // Last change
      expect(history[1].exerciseType).toBe('pushup'); // Second change  
      expect(history[0].newMode).toBe(ExerciseMode.PRO); // First change
    });

    test('should limit history size', () => {
      // Create many changes to test history limit
      for (let i = 0; i < 60; i++) {
        const mode = i % 2 === 0 ? ExerciseMode.BEGINNER : ExerciseMode.PRO;
        service.switchMode(mode);
      }
      
      const history = service.getModeChangeHistory();
      expect(history.length).toBeLessThanOrEqual(50); // Should be limited to 50 entries
    });
  });

  describe('Listener Management', () => {
    test('should add and remove listeners', () => {
      let eventReceived = false;
      const listener = () => { eventReceived = true; };
      
      service.addModeChangeListener(listener);
      service.switchMode(ExerciseMode.PRO);
      
      expect(eventReceived).toBe(true);
      
      // Reset and remove listener
      eventReceived = false;
      service.removeModeChangeListener(listener);
      service.switchMode(ExerciseMode.BEGINNER);
      
      expect(eventReceived).toBe(false);
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = () => { throw new Error('Test error'); };
      const workingListener = jest.fn();
      
      service.addModeChangeListener(errorListener);
      service.addModeChangeListener(workingListener);
      
      // Should not throw error and should still call working listener
      expect(() => service.switchMode(ExerciseMode.PRO)).not.toThrow();
      
      // Give time for async listener calls
      setTimeout(() => {
        expect(workingListener).toHaveBeenCalled();
      }, 10);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid mode switches', () => {
      const events = [];
      
      // Perform rapid switches
      events.push(service.switchMode(ExerciseMode.PRO));
      events.push(service.switchMode(ExerciseMode.BEGINNER));
      events.push(service.switchMode(ExerciseMode.PRO));
      
      // All events should be valid
      events.forEach(event => {
        expect(event.timestamp).toBeGreaterThan(0);
        expect(event.configChanges).toBeDefined();
      });
      
      // Final state should be correct
      expect(service.getCurrentMode()).toBe(ExerciseMode.PRO);
    });

    test('should handle concurrent threshold updates', () => {
      const updates = [
        { feedbackSensitivity: 0.5 },
        { inactivityTimeout: 20 },
        { feedbackSensitivity: 0.7, inactivityTimeout: 25 }
      ];
      
      // Apply updates rapidly
      updates.forEach(update => {
        service.updateThresholds(ExerciseMode.BEGINNER, update);
      });
      
      // Final state should reflect last update
      const thresholds = service.getCurrentThresholds();
      expect(thresholds.feedbackSensitivity).toBe(0.7);
      expect(thresholds.inactivityTimeout).toBe(25);
    });
  });
});