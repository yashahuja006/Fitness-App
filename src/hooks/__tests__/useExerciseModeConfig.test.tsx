/**
 * Tests for useExerciseModeConfig hook
 */

import { renderHook, act } from '@testing-library/react';
import { useExerciseModeConfig } from '../useExerciseModeConfig';
import { ExerciseMode, ExerciseType } from '@/types/advancedPose';

// Mock the service to avoid side effects
jest.mock('../../lib/exerciseModeConfigService', () => ({
  exerciseModeConfigService: {
    getCurrentConfig: jest.fn(() => ({
      mode: 'beginner',
      exerciseType: 'squat',
      thresholds: {
        beginner: {
          kneeAngle: {
            s1Threshold: 155,
            s2Range: [75, 155],
            s3Threshold: 75,
            warningTolerance: 10
          },
          hipAngle: {
            s1Threshold: 170,
            s2Range: [90, 170],
            s3Threshold: 90,
            warningTolerance: 15
          },
          offsetAngle: {
            s1Threshold: 30,
            s2Range: [20, 30],
            s3Threshold: 20,
            warningTolerance: 10
          },
          feedbackSensitivity: 0.3,
          inactivityTimeout: 20
        },
        pro: {
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
        }
      },
      feedbackConfig: {
        sensitivity: 0.3,
        frequency: 2000,
        priorityThreshold: 'low'
      },
      analysisConfig: {
        temporalSmoothing: true,
        minStateTransitionTime: 200,
        inactivityTimeout: 20
      }
    })),
    switchMode: jest.fn((mode) => ({
      previousMode: 'beginner',
      newMode: mode,
      exerciseType: 'squat',
      timestamp: Date.now(),
      configChanges: {
        thresholds: true,
        feedback: true,
        analysis: true
      }
    })),
    switchExerciseType: jest.fn((type) => ({
      previousMode: 'beginner',
      newMode: 'beginner',
      exerciseType: type,
      timestamp: Date.now(),
      configChanges: {
        thresholds: true,
        feedback: false,
        analysis: false
      }
    })),
    updateThresholds: jest.fn(),
    resetToDefaults: jest.fn(() => ({
      previousMode: 'pro',
      newMode: 'beginner',
      exerciseType: 'squat',
      timestamp: Date.now(),
      configChanges: {
        thresholds: true,
        feedback: true,
        analysis: true
      }
    })),
    addModeChangeListener: jest.fn(),
    removeModeChangeListener: jest.fn(),
    getFeedbackSensitivity: jest.fn(() => 0.3),
    getInactivityTimeout: jest.fn(() => 20),
    isModeMoreStrict: jest.fn((mode1, mode2) => mode1 === 'pro' && mode2 === 'beginner'),
    getAvailableModes: jest.fn(() => ['beginner', 'pro']),
    getAvailableExerciseTypes: jest.fn(() => ['squat', 'pushup', 'plank', 'deadlift', 'bicep_curl'])
  },
  ExerciseModeUtils: {
    compareThresholds: jest.fn(() => ({ identical: false, differences: ['feedbackSensitivity'] })),
    validateThresholds: jest.fn(() => ({ valid: true, errors: [] }))
  }
}));

describe('useExerciseModeConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      expect(result.current.currentMode).toBe('beginner');
      expect(result.current.currentExerciseType).toBe('squat');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    test('should initialize with custom options', () => {
      const onModeChange = jest.fn();
      const onThresholdChange = jest.fn();
      
      const { result } = renderHook(() => 
        useExerciseModeConfig({
          initialMode: 'pro' as ExerciseMode,
          initialExerciseType: 'pushup' as ExerciseType,
          onModeChange,
          onThresholdChange
        })
      );

      expect(result.current.currentMode).toBe('beginner'); // From mocked service
      expect(result.current.currentExerciseType).toBe('squat'); // From mocked service
    });
  });

  describe('Mode Switching', () => {
    test('should switch mode successfully', async () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      await act(async () => {
        const event = await result.current.switchMode('pro' as ExerciseMode);
        expect(event.newMode).toBe('pro');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should handle mode switch errors', async () => {
      const mockService = require('../../lib/exerciseModeConfigService').exerciseModeConfigService;
      mockService.switchMode.mockImplementationOnce(() => {
        throw new Error('Mode switch failed');
      });

      const { result } = renderHook(() => useExerciseModeConfig());

      await act(async () => {
        try {
          await result.current.switchMode('pro' as ExerciseMode);
        } catch (error) {
          expect(error.message).toBe('Mode switch failed');
        }
      });

      expect(result.current.error).toBe('Mode switch failed');
    });
  });

  describe('Exercise Type Switching', () => {
    test('should switch exercise type successfully', async () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      await act(async () => {
        const event = await result.current.switchExerciseType('pushup' as ExerciseType);
        expect(event.exerciseType).toBe('pushup');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Threshold Updates', () => {
    test('should update thresholds successfully', async () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      await act(async () => {
        await result.current.updateThresholds('beginner' as ExerciseMode, {
          feedbackSensitivity: 0.5
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    test('should reset to defaults successfully', async () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      await act(async () => {
        const event = await result.current.resetToDefaults();
        expect(event.newMode).toBe('beginner');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    test('should provide utility functions', () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      expect(result.current.getFeedbackSensitivity()).toBe(0.3);
      expect(result.current.getInactivityTimeout()).toBe(20);
      expect(result.current.isModeMoreStrict('pro' as ExerciseMode, 'beginner' as ExerciseMode)).toBe(true);
      expect(result.current.getAvailableModes()).toContain('beginner');
      expect(result.current.getAvailableExerciseTypes()).toContain('squat');
    });

    test('should provide comparison and validation functions', () => {
      const { result } = renderHook(() => useExerciseModeConfig());

      const comparison = result.current.compareWithMode('pro' as ExerciseMode);
      expect(comparison.identical).toBe(false);

      const validation = result.current.validateCurrentThresholds();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Auto-sync Behavior', () => {
    test('should handle auto-sync when enabled', () => {
      const onModeChange = jest.fn();
      const mockService = require('../../lib/exerciseModeConfigService').exerciseModeConfigService;
      
      renderHook(() => 
        useExerciseModeConfig({
          autoSync: true,
          onModeChange
        })
      );

      // Verify listener was added
      expect(mockService.addModeChangeListener).toHaveBeenCalled();
    });

    test('should not set up listener when auto-sync is disabled', () => {
      const mockService = require('../../lib/exerciseModeConfigService').exerciseModeConfigService;
      mockService.addModeChangeListener.mockClear();
      
      renderHook(() => 
        useExerciseModeConfig({
          autoSync: false
        })
      );

      // Verify listener was not added
      expect(mockService.addModeChangeListener).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should remove listener on unmount', () => {
      const mockService = require('../../lib/exerciseModeConfigService').exerciseModeConfigService;
      
      const { unmount } = renderHook(() => 
        useExerciseModeConfig({ autoSync: true })
      );

      unmount();

      // Verify listener was removed
      expect(mockService.removeModeChangeListener).toHaveBeenCalled();
    });
  });
});

describe('useSimpleExerciseMode', () => {
  test('should provide simplified interface', () => {
    const { useSimpleExerciseMode } = require('../useExerciseModeConfig');
    const { result } = renderHook(() => useSimpleExerciseMode());

    expect(result.current.mode).toBe('beginner');
    expect(typeof result.current.setMode).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useExerciseThresholds', () => {
  test('should provide threshold management interface', () => {
    const { useExerciseThresholds } = require('../useExerciseModeConfig');
    const { result } = renderHook(() => useExerciseThresholds());

    expect(result.current.thresholds).toBeDefined();
    expect(result.current.allThresholds).toBeDefined();
    expect(typeof result.current.updateThresholds).toBe('function');
    expect(typeof result.current.validate).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});