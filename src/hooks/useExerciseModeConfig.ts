/**
 * React hook for exercise mode configuration management
 * Provides state management and integration with ExerciseModeConfigService
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  exerciseModeConfigService, 
  type ExerciseModeConfig, 
  type ModeChangeEvent,
  type ModeChangeListener 
} from '@/lib/exerciseModeConfigService';
import type {
  ExerciseMode,
  ExerciseType,
  ExerciseThresholds,
  ModeThresholds
} from '@/types/advancedPose';

export interface UseExerciseModeConfigOptions {
  initialMode?: ExerciseMode;
  initialExerciseType?: ExerciseType;
  autoSync?: boolean; // Whether to automatically sync with service changes
  onModeChange?: (event: ModeChangeEvent) => void;
  onThresholdChange?: (thresholds: ExerciseThresholds) => void;
  onConfigChange?: (config: ExerciseModeConfig) => void;
}

export interface UseExerciseModeConfigReturn {
  // Current state
  currentMode: ExerciseMode;
  currentExerciseType: ExerciseType;
  currentConfig: ExerciseModeConfig;
  currentThresholds: ModeThresholds;
  allThresholds: ExerciseThresholds;
  
  // Configuration actions
  switchMode: (mode: ExerciseMode) => Promise<ModeChangeEvent>;
  switchExerciseType: (type: ExerciseType) => Promise<ModeChangeEvent>;
  updateThresholds: (mode: ExerciseMode, thresholds: Partial<ModeThresholds>) => Promise<void>;
  resetToDefaults: (mode?: ExerciseMode, exerciseType?: ExerciseType) => Promise<ModeChangeEvent>;
  
  // Utility functions
  getFeedbackSensitivity: () => number;
  getInactivityTimeout: () => number;
  isModeMoreStrict: (mode1: ExerciseMode, mode2: ExerciseMode) => boolean;
  getAvailableModes: () => ExerciseMode[];
  getAvailableExerciseTypes: () => ExerciseType[];
  
  // State management
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  changeHistory: ModeChangeEvent[];
  
  // Advanced features
  compareWithMode: (mode: ExerciseMode) => {
    identical: boolean;
    differences: string[];
  };
  validateCurrentThresholds: () => {
    valid: boolean;
    errors: string[];
  };
}

export function useExerciseModeConfig(
  options: UseExerciseModeConfigOptions = {}
): UseExerciseModeConfigReturn {
  const {
    initialMode = 'beginner' as ExerciseMode,
    initialExerciseType = 'squat' as ExerciseType,
    autoSync = true,
    onModeChange,
    onThresholdChange,
    onConfigChange
  } = options;

  // State
  const [currentConfig, setCurrentConfig] = useState<ExerciseModeConfig>(() => 
    exerciseModeConfigService.getCurrentConfig()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changeHistory, setChangeHistory] = useState<ModeChangeEvent[]>([]);
  
  // Refs for stable callbacks
  const onModeChangeRef = useRef(onModeChange);
  const onThresholdChangeRef = useRef(onThresholdChange);
  const onConfigChangeRef = useRef(onConfigChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onModeChangeRef.current = onModeChange;
    onThresholdChangeRef.current = onThresholdChange;
    onConfigChangeRef.current = onConfigChange;
  }, [onModeChange, onThresholdChange, onConfigChange]);

  // Initialize service with initial values
  useEffect(() => {
    const initializeConfig = async () => {
      setIsLoading(true);
      try {
        // Set initial mode and exercise type if different from current
        const currentServiceConfig = exerciseModeConfigService.getCurrentConfig();
        
        if (currentServiceConfig.mode !== initialMode) {
          await exerciseModeConfigService.switchMode(initialMode);
        }
        
        if (currentServiceConfig.exerciseType !== initialExerciseType) {
          await exerciseModeConfigService.switchExerciseType(initialExerciseType);
        }
        
        // Update local state
        setCurrentConfig(exerciseModeConfigService.getCurrentConfig());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize configuration');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConfig();
  }, [initialMode, initialExerciseType]);

  // Set up service listener for auto-sync
  useEffect(() => {
    if (!autoSync) return;

    const handleModeChange: ModeChangeListener = (event) => {
      // Update local state
      setCurrentConfig(exerciseModeConfigService.getCurrentConfig());
      
      // Update change history
      setChangeHistory(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 changes
      
      // Reset unsaved changes flag on external changes
      setHasUnsavedChanges(false);
      
      // Notify callbacks
      onModeChangeRef.current?.(event);
      onThresholdChangeRef.current?.(exerciseModeConfigService.getCurrentConfig().thresholds);
      onConfigChangeRef.current?.(exerciseModeConfigService.getCurrentConfig());
    };

    exerciseModeConfigService.addModeChangeListener(handleModeChange);
    
    return () => {
      exerciseModeConfigService.removeModeChangeListener(handleModeChange);
    };
  }, [autoSync]);

  // Switch exercise mode
  const switchMode = useCallback(async (mode: ExerciseMode): Promise<ModeChangeEvent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const event = exerciseModeConfigService.switchMode(mode);
      
      if (autoSync) {
        // State will be updated by listener
        return event;
      } else {
        // Manual sync
        setCurrentConfig(exerciseModeConfigService.getCurrentConfig());
        setChangeHistory(prev => [event, ...prev.slice(0, 19)]);
        
        // Notify callbacks
        onModeChangeRef.current?.(event);
        onThresholdChangeRef.current?.(exerciseModeConfigService.getCurrentConfig().thresholds);
        onConfigChangeRef.current?.(exerciseModeConfigService.getCurrentConfig());
      }
      
      setHasUnsavedChanges(false);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch mode';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoSync]);

  // Switch exercise type
  const switchExerciseType = useCallback(async (type: ExerciseType): Promise<ModeChangeEvent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const event = exerciseModeConfigService.switchExerciseType(type);
      
      if (!autoSync) {
        // Manual sync
        setCurrentConfig(exerciseModeConfigService.getCurrentConfig());
        setChangeHistory(prev => [event, ...prev.slice(0, 19)]);
        
        // Notify callbacks
        onModeChangeRef.current?.(event);
        onThresholdChangeRef.current?.(exerciseModeConfigService.getCurrentConfig().thresholds);
        onConfigChangeRef.current?.(exerciseModeConfigService.getCurrentConfig());
      }
      
      setHasUnsavedChanges(false);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch exercise type';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoSync]);

  // Update thresholds
  const updateThresholds = useCallback(async (
    mode: ExerciseMode, 
    thresholds: Partial<ModeThresholds>
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      exerciseModeConfigService.updateThresholds(mode, thresholds);
      
      if (!autoSync) {
        // Manual sync
        setCurrentConfig(exerciseModeConfigService.getCurrentConfig());
        
        // Notify callbacks
        onThresholdChangeRef.current?.(exerciseModeConfigService.getCurrentConfig().thresholds);
        onConfigChangeRef.current?.(exerciseModeConfigService.getCurrentConfig());
      }
      
      setHasUnsavedChanges(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update thresholds';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoSync]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (
    mode?: ExerciseMode, 
    exerciseType?: ExerciseType
  ): Promise<ModeChangeEvent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const event = exerciseModeConfigService.resetToDefaults(mode, exerciseType);
      
      if (!autoSync) {
        // Manual sync
        setCurrentConfig(exerciseModeConfigService.getCurrentConfig());
        setChangeHistory(prev => [event, ...prev.slice(0, 19)]);
        
        // Notify callbacks
        onModeChangeRef.current?.(event);
        onThresholdChangeRef.current?.(exerciseModeConfigService.getCurrentConfig().thresholds);
        onConfigChangeRef.current?.(exerciseModeConfigService.getCurrentConfig());
      }
      
      setHasUnsavedChanges(false);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset to defaults';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoSync]);

  // Utility functions
  const getFeedbackSensitivity = useCallback((): number => {
    return exerciseModeConfigService.getFeedbackSensitivity();
  }, []);

  const getInactivityTimeout = useCallback((): number => {
    return exerciseModeConfigService.getInactivityTimeout();
  }, []);

  const isModeMoreStrict = useCallback((mode1: ExerciseMode, mode2: ExerciseMode): boolean => {
    return exerciseModeConfigService.isModeMoreStrict(mode1, mode2);
  }, []);

  const getAvailableModes = useCallback((): ExerciseMode[] => {
    return exerciseModeConfigService.getAvailableModes();
  }, []);

  const getAvailableExerciseTypes = useCallback((): ExerciseType[] => {
    return exerciseModeConfigService.getAvailableExerciseTypes();
  }, []);

  // Compare with another mode
  const compareWithMode = useCallback((mode: ExerciseMode) => {
    const currentThresholds = currentConfig.thresholds[currentConfig.mode];
    const compareThresholds = currentConfig.thresholds[mode];
    
    // Import utility function
    const { ExerciseModeUtils } = require('@/lib/exerciseModeConfigService');
    return ExerciseModeUtils.compareThresholds(currentThresholds, compareThresholds);
  }, [currentConfig]);

  // Validate current thresholds
  const validateCurrentThresholds = useCallback(() => {
    const currentThresholds = currentConfig.thresholds[currentConfig.mode];
    
    // Import utility function
    const { ExerciseModeUtils } = require('@/lib/exerciseModeConfigService');
    return ExerciseModeUtils.validateThresholds(currentThresholds);
  }, [currentConfig]);

  // Mark as having unsaved changes when thresholds are modified locally
  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Derived state
  const currentMode = currentConfig.mode;
  const currentExerciseType = currentConfig.exerciseType;
  const currentThresholds = currentConfig.thresholds[currentConfig.mode];
  const allThresholds = currentConfig.thresholds;

  return {
    // Current state
    currentMode,
    currentExerciseType,
    currentConfig,
    currentThresholds,
    allThresholds,
    
    // Configuration actions
    switchMode,
    switchExerciseType,
    updateThresholds,
    resetToDefaults,
    
    // Utility functions
    getFeedbackSensitivity,
    getInactivityTimeout,
    isModeMoreStrict,
    getAvailableModes,
    getAvailableExerciseTypes,
    
    // State management
    isLoading,
    error,
    hasUnsavedChanges,
    changeHistory,
    
    // Advanced features
    compareWithMode,
    validateCurrentThresholds
  };
}

// Export utility hook for simple mode switching
export function useSimpleExerciseMode(
  initialMode: ExerciseMode = 'beginner' as ExerciseMode
) {
  const {
    currentMode,
    switchMode,
    isLoading,
    error
  } = useExerciseModeConfig({
    initialMode,
    autoSync: true
  });

  return {
    mode: currentMode,
    setMode: switchMode,
    isLoading,
    error
  };
}

// Export utility hook for threshold management
export function useExerciseThresholds(
  mode: ExerciseMode = 'beginner' as ExerciseMode,
  exerciseType: ExerciseType = 'squat' as ExerciseType
) {
  const {
    currentThresholds,
    allThresholds,
    updateThresholds,
    validateCurrentThresholds,
    isLoading,
    error
  } = useExerciseModeConfig({
    initialMode: mode,
    initialExerciseType: exerciseType,
    autoSync: true
  });

  return {
    thresholds: currentThresholds,
    allThresholds,
    updateThresholds: (thresholds: Partial<ModeThresholds>) => 
      updateThresholds(mode, thresholds),
    validate: validateCurrentThresholds,
    isLoading,
    error
  };
}