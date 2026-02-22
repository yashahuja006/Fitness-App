/**
 * Exercise Mode Configuration Service
 * Manages mode-specific threshold configurations and dynamic switching
 */

import type {
  ExerciseMode,
  ExerciseType,
  ExerciseThresholds,
  ModeThresholds,
  AngleThresholds
} from '@/types/advancedPose';

export interface ExerciseModeConfig {
  mode: ExerciseMode;
  exerciseType: ExerciseType;
  thresholds: ExerciseThresholds;
  feedbackConfig: {
    sensitivity: number;
    frequency: number;
    priorityThreshold: string;
  };
  analysisConfig: {
    temporalSmoothing: boolean;
    minStateTransitionTime: number;
    inactivityTimeout: number;
  };
}

export interface ModeChangeEvent {
  previousMode: ExerciseMode;
  newMode: ExerciseMode;
  exerciseType: ExerciseType;
  timestamp: number;
  configChanges: {
    thresholds: boolean;
    feedback: boolean;
    analysis: boolean;
  };
}

export type ModeChangeListener = (event: ModeChangeEvent) => void;

// Default configurations for different exercise types and modes
const DEFAULT_SQUAT_THRESHOLDS: ExerciseThresholds = {
  beginner: {
    kneeAngle: {
      s1Threshold: 155,        // More lenient for standing
      s2Range: [75, 155],      // Wider transition range
      s3Threshold: 75,         // Less deep squat required
      warningTolerance: 10     // More tolerance
    },
    hipAngle: {
      s1Threshold: 170,
      s2Range: [90, 170],
      s3Threshold: 90,
      warningTolerance: 15
    },
    offsetAngle: {
      s1Threshold: 30,         // More lenient camera positioning
      s2Range: [20, 30],
      s3Threshold: 20,
      warningTolerance: 10
    },
    feedbackSensitivity: 0.3,  // Less sensitive feedback
    inactivityTimeout: 20      // Longer timeout
  },
  pro: {
    kneeAngle: {
      s1Threshold: 160,        // Stricter for standing
      s2Range: [80, 160],      // Narrower transition range
      s3Threshold: 80,         // Deeper squat required
      warningTolerance: 5      // Less tolerance
    },
    hipAngle: {
      s1Threshold: 175,
      s2Range: [85, 175],
      s3Threshold: 85,
      warningTolerance: 8
    },
    offsetAngle: {
      s1Threshold: 25,         // Stricter camera positioning
      s2Range: [15, 25],
      s3Threshold: 15,
      warningTolerance: 5
    },
    feedbackSensitivity: 0.7,  // More sensitive feedback
    inactivityTimeout: 15      // Shorter timeout
  }
};

// Default configurations for other exercise types (extensible)
const DEFAULT_PUSHUP_THRESHOLDS: ExerciseThresholds = {
  beginner: {
    kneeAngle: {
      s1Threshold: 170,
      s2Range: [120, 170],
      s3Threshold: 120,
      warningTolerance: 12
    },
    hipAngle: {
      s1Threshold: 175,
      s2Range: [160, 175],
      s3Threshold: 160,
      warningTolerance: 10
    },
    offsetAngle: {
      s1Threshold: 35,
      s2Range: [25, 35],
      s3Threshold: 25,
      warningTolerance: 12
    },
    feedbackSensitivity: 0.25,
    inactivityTimeout: 25
  },
  pro: {
    kneeAngle: {
      s1Threshold: 175,
      s2Range: [130, 175],
      s3Threshold: 130,
      warningTolerance: 6
    },
    hipAngle: {
      s1Threshold: 180,
      s2Range: [165, 180],
      s3Threshold: 165,
      warningTolerance: 5
    },
    offsetAngle: {
      s1Threshold: 30,
      s2Range: [20, 30],
      s3Threshold: 20,
      warningTolerance: 6
    },
    feedbackSensitivity: 0.8,
    inactivityTimeout: 12
  }
};

export class ExerciseModeConfigService {
  private currentConfig: ExerciseModeConfig;
  private listeners: ModeChangeListener[] = [];
  private configHistory: ModeChangeEvent[] = [];

  constructor(
    initialMode: ExerciseMode = 'beginner' as ExerciseMode,
    exerciseType: ExerciseType = 'squat' as ExerciseType
  ) {
    this.currentConfig = this.createDefaultConfig(initialMode, exerciseType);
  }

  /**
   * Get current exercise mode configuration
   */
  getCurrentConfig(): ExerciseModeConfig {
    return { ...this.currentConfig };
  }

  /**
   * Get current exercise mode
   */
  getCurrentMode(): ExerciseMode {
    return this.currentConfig.mode;
  }

  /**
   * Get current exercise type
   */
  getCurrentExerciseType(): ExerciseType {
    return this.currentConfig.exerciseType;
  }

  /**
   * Get current thresholds for the active mode
   */
  getCurrentThresholds(): ModeThresholds {
    return this.currentConfig.thresholds[this.currentConfig.mode];
  }

  /**
   * Get thresholds for a specific mode
   */
  getThresholdsForMode(mode: ExerciseMode): ModeThresholds {
    return this.currentConfig.thresholds[mode];
  }

  /**
   * Switch exercise mode with immediate parameter updates
   */
  switchMode(newMode: ExerciseMode): ModeChangeEvent {
    if (newMode === this.currentConfig.mode) {
      // No change needed
      return this.createNoChangeEvent(newMode);
    }

    const previousMode = this.currentConfig.mode;
    const timestamp = Date.now();
    const oldConfig = { ...this.currentConfig };

    // Create new configuration with updated mode
    const newConfig = this.createDefaultConfig(newMode, this.currentConfig.exerciseType);
    
    // Detect what changed
    const configChanges = this.detectConfigChanges(oldConfig, newConfig);
    
    // Update current configuration
    this.currentConfig = newConfig;

    // Create mode change event
    const event: ModeChangeEvent = {
      previousMode,
      newMode,
      exerciseType: this.currentConfig.exerciseType,
      timestamp,
      configChanges
    };

    // Add to history
    this.configHistory.push(event);
    
    // Keep history manageable
    if (this.configHistory.length > 50) {
      this.configHistory.shift();
    }

    // Notify all listeners immediately
    this.notifyListeners(event);

    return event;
  }

  /**
   * Switch exercise type with mode preservation
   */
  switchExerciseType(newExerciseType: ExerciseType): ModeChangeEvent {
    if (newExerciseType === this.currentConfig.exerciseType) {
      // No change needed
      return this.createNoChangeEvent(this.currentConfig.mode);
    }

    const previousMode = this.currentConfig.mode;
    const timestamp = Date.now();

    // Create new configuration with updated exercise type
    const newConfig = this.createDefaultConfig(this.currentConfig.mode, newExerciseType);
    
    const configChanges = this.detectConfigChanges(this.currentConfig, newConfig);
    
    // Update current configuration
    this.currentConfig = newConfig;

    // Create mode change event (exercise type change also triggers this)
    const event: ModeChangeEvent = {
      previousMode,
      newMode: this.currentConfig.mode,
      exerciseType: newExerciseType,
      timestamp,
      configChanges
    };

    // Add to history
    this.configHistory.push(event);

    // Notify all listeners immediately
    this.notifyListeners(event);

    return event;
  }

  /**
   * Update specific thresholds while maintaining mode
   */
  updateThresholds(mode: ExerciseMode, thresholds: Partial<ModeThresholds>): void {
    const currentThresholds = this.currentConfig.thresholds[mode];
    
    // Merge with existing thresholds
    this.currentConfig.thresholds[mode] = {
      ...currentThresholds,
      ...thresholds
    };

    // Update feedback and analysis configs if updating current mode
    if (mode === this.currentConfig.mode) {
      const updatedThresholds = this.currentConfig.thresholds[mode];
      
      // Update feedback config
      this.currentConfig.feedbackConfig.sensitivity = updatedThresholds.feedbackSensitivity;
      
      // Update analysis config
      this.currentConfig.analysisConfig.inactivityTimeout = updatedThresholds.inactivityTimeout;
      
      // Create and notify event
      const event: ModeChangeEvent = {
        previousMode: this.currentConfig.mode,
        newMode: this.currentConfig.mode,
        exerciseType: this.currentConfig.exerciseType,
        timestamp: Date.now(),
        configChanges: {
          thresholds: true,
          feedback: Object.keys(thresholds).includes('feedbackSensitivity'),
          analysis: Object.keys(thresholds).includes('inactivityTimeout')
        }
      };

      this.configHistory.push(event);
      this.notifyListeners(event);
    }
  }

  /**
   * Update feedback configuration
   */
  updateFeedbackConfig(config: Partial<ExerciseModeConfig['feedbackConfig']>): void {
    this.currentConfig.feedbackConfig = {
      ...this.currentConfig.feedbackConfig,
      ...config
    };

    const event: ModeChangeEvent = {
      previousMode: this.currentConfig.mode,
      newMode: this.currentConfig.mode,
      exerciseType: this.currentConfig.exerciseType,
      timestamp: Date.now(),
      configChanges: {
        thresholds: false,
        feedback: true,
        analysis: false
      }
    };

    this.configHistory.push(event);
    this.notifyListeners(event);
  }

  /**
   * Update analysis configuration
   */
  updateAnalysisConfig(config: Partial<ExerciseModeConfig['analysisConfig']>): void {
    this.currentConfig.analysisConfig = {
      ...this.currentConfig.analysisConfig,
      ...config
    };

    const event: ModeChangeEvent = {
      previousMode: this.currentConfig.mode,
      newMode: this.currentConfig.mode,
      exerciseType: this.currentConfig.exerciseType,
      timestamp: Date.now(),
      configChanges: {
        thresholds: false,
        feedback: false,
        analysis: true
      }
    };

    this.configHistory.push(event);
    this.notifyListeners(event);
  }

  /**
   * Register a listener for mode changes
   */
  addModeChangeListener(listener: ModeChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a mode change listener
   */
  removeModeChangeListener(listener: ModeChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get mode change history
   */
  getModeChangeHistory(): ModeChangeEvent[] {
    return [...this.configHistory];
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(mode?: ExerciseMode, exerciseType?: ExerciseType): ModeChangeEvent {
    const newMode = mode || 'beginner' as ExerciseMode;
    const newExerciseType = exerciseType || 'squat' as ExerciseType;
    
    const previousMode = this.currentConfig.mode;
    this.currentConfig = this.createDefaultConfig(newMode, newExerciseType);

    const event: ModeChangeEvent = {
      previousMode,
      newMode,
      exerciseType: newExerciseType,
      timestamp: Date.now(),
      configChanges: {
        thresholds: true,
        feedback: true,
        analysis: true
      }
    };

    this.configHistory.push(event);
    this.notifyListeners(event);

    return event;
  }

  /**
   * Get available exercise modes
   */
  getAvailableModes(): ExerciseMode[] {
    return ['beginner', 'pro'] as ExerciseMode[];
  }

  /**
   * Get available exercise types
   */
  getAvailableExerciseTypes(): ExerciseType[] {
    return ['squat', 'pushup', 'plank', 'deadlift', 'bicep_curl'] as ExerciseType[];
  }

  /**
   * Check if a mode is more strict than another
   */
  isModeMoreStrict(mode1: ExerciseMode, mode2: ExerciseMode): boolean {
    const strictnessOrder = { 'beginner': 1, 'pro': 2 };
    return strictnessOrder[mode1] > strictnessOrder[mode2];
  }

  /**
   * Get mode-specific feedback sensitivity
   */
  getFeedbackSensitivity(): number {
    return this.getCurrentThresholds().feedbackSensitivity;
  }

  /**
   * Get mode-specific inactivity timeout
   */
  getInactivityTimeout(): number {
    return this.getCurrentThresholds().inactivityTimeout;
  }

  /**
   * Create default configuration for mode and exercise type
   */
  private createDefaultConfig(mode: ExerciseMode, exerciseType: ExerciseType): ExerciseModeConfig {
    const thresholds = this.getDefaultThresholds(exerciseType);
    
    return {
      mode,
      exerciseType,
      thresholds,
      feedbackConfig: {
        sensitivity: thresholds[mode].feedbackSensitivity,
        frequency: mode === 'pro' ? 3000 : 2000, // Pro mode gets less frequent feedback
        priorityThreshold: mode === 'pro' ? 'medium' : 'low'
      },
      analysisConfig: {
        temporalSmoothing: true,
        minStateTransitionTime: mode === 'pro' ? 150 : 200, // Pro mode allows faster transitions
        inactivityTimeout: thresholds[mode].inactivityTimeout
      }
    };
  }

  /**
   * Get default thresholds for exercise type
   */
  private getDefaultThresholds(exerciseType: ExerciseType): ExerciseThresholds {
    switch (exerciseType) {
      case 'squat':
        return DEFAULT_SQUAT_THRESHOLDS;
      case 'pushup':
        return DEFAULT_PUSHUP_THRESHOLDS;
      default:
        // For other exercise types, use squat as base (can be extended)
        return DEFAULT_SQUAT_THRESHOLDS;
    }
  }

  /**
   * Detect what configuration aspects changed
   */
  private detectConfigChanges(
    oldConfig: ExerciseModeConfig, 
    newConfig: ExerciseModeConfig
  ): ModeChangeEvent['configChanges'] {
    return {
      thresholds: oldConfig.mode !== newConfig.mode || 
                  oldConfig.exerciseType !== newConfig.exerciseType ||
                  JSON.stringify(oldConfig.thresholds) !== JSON.stringify(newConfig.thresholds),
      feedback: JSON.stringify(oldConfig.feedbackConfig) !== JSON.stringify(newConfig.feedbackConfig),
      analysis: JSON.stringify(oldConfig.analysisConfig) !== JSON.stringify(newConfig.analysisConfig)
    };
  }

  /**
   * Create a no-change event
   */
  private createNoChangeEvent(mode: ExerciseMode): ModeChangeEvent {
    return {
      previousMode: mode,
      newMode: mode,
      exerciseType: this.currentConfig.exerciseType,
      timestamp: Date.now(),
      configChanges: {
        thresholds: false,
        feedback: false,
        analysis: false
      }
    };
  }

  /**
   * Notify all listeners of mode change
   */
  private notifyListeners(event: ModeChangeEvent): void {
    // Call listeners immediately for immediate parameter updates
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in mode change listener:', error);
      }
    });
  }
}

// Export singleton instance for global use
export const exerciseModeConfigService = new ExerciseModeConfigService();

// Export utility functions
export const ExerciseModeUtils = {
  /**
   * Compare two threshold configurations
   */
  compareThresholds(thresholds1: ModeThresholds, thresholds2: ModeThresholds): {
    identical: boolean;
    differences: string[];
  } {
    const differences: string[] = [];
    
    // Compare knee angle thresholds
    if (thresholds1.kneeAngle.s1Threshold !== thresholds2.kneeAngle.s1Threshold) {
      differences.push('kneeAngle.s1Threshold');
    }
    if (JSON.stringify(thresholds1.kneeAngle.s2Range) !== JSON.stringify(thresholds2.kneeAngle.s2Range)) {
      differences.push('kneeAngle.s2Range');
    }
    if (thresholds1.kneeAngle.s3Threshold !== thresholds2.kneeAngle.s3Threshold) {
      differences.push('kneeAngle.s3Threshold');
    }
    if (thresholds1.kneeAngle.warningTolerance !== thresholds2.kneeAngle.warningTolerance) {
      differences.push('kneeAngle.warningTolerance');
    }

    // Compare hip angle thresholds
    if (thresholds1.hipAngle.s1Threshold !== thresholds2.hipAngle.s1Threshold) {
      differences.push('hipAngle.s1Threshold');
    }
    if (JSON.stringify(thresholds1.hipAngle.s2Range) !== JSON.stringify(thresholds2.hipAngle.s2Range)) {
      differences.push('hipAngle.s2Range');
    }
    if (thresholds1.hipAngle.s3Threshold !== thresholds2.hipAngle.s3Threshold) {
      differences.push('hipAngle.s3Threshold');
    }
    if (thresholds1.hipAngle.warningTolerance !== thresholds2.hipAngle.warningTolerance) {
      differences.push('hipAngle.warningTolerance');
    }

    // Compare other thresholds
    if (thresholds1.feedbackSensitivity !== thresholds2.feedbackSensitivity) {
      differences.push('feedbackSensitivity');
    }
    if (thresholds1.inactivityTimeout !== thresholds2.inactivityTimeout) {
      differences.push('inactivityTimeout');
    }

    return {
      identical: differences.length === 0,
      differences
    };
  },

  /**
   * Validate threshold configuration
   */
  validateThresholds(thresholds: ModeThresholds): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate knee angle thresholds
    if (thresholds.kneeAngle.s1Threshold <= thresholds.kneeAngle.s3Threshold) {
      errors.push('s1Threshold must be greater than s3Threshold');
    }
    if (thresholds.kneeAngle.s2Range[0] >= thresholds.kneeAngle.s2Range[1]) {
      errors.push('s2Range minimum must be less than maximum');
    }
    if (thresholds.kneeAngle.warningTolerance < 0) {
      errors.push('warningTolerance must be non-negative');
    }

    // Validate hip angle thresholds
    if (thresholds.hipAngle.s1Threshold <= thresholds.hipAngle.s3Threshold) {
      errors.push('hip s1Threshold must be greater than s3Threshold');
    }
    if (thresholds.hipAngle.s2Range[0] >= thresholds.hipAngle.s2Range[1]) {
      errors.push('hip s2Range minimum must be less than maximum');
    }
    if (thresholds.hipAngle.warningTolerance < 0) {
      errors.push('hip warningTolerance must be non-negative');
    }

    // Validate feedback sensitivity
    if (thresholds.feedbackSensitivity < 0 || thresholds.feedbackSensitivity > 1) {
      errors.push('feedbackSensitivity must be between 0 and 1');
    }

    // Validate inactivity timeout
    if (thresholds.inactivityTimeout < 5) {
      errors.push('inactivityTimeout must be at least 5 seconds');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};