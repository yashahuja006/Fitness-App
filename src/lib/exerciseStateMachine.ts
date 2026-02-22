/**
 * Exercise State Machine
 * Tracks exercise phases and transitions for squat analysis
 */

import type { 
  StateTransition, 
  ExerciseAngles,
  ExerciseThresholds 
} from '@/types/advancedPose';

import { ExerciseState, ExerciseMode } from '@/types/advancedPose';
import { exerciseModeConfigService, type ModeChangeListener } from './exerciseModeConfigService';

// Default thresholds for different exercise modes
const DEFAULT_THRESHOLDS: ExerciseThresholds = {
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

export class ExerciseStateMachine {
  private currentState: ExerciseState = ExerciseState.S1_STANDING;
  private previousState: ExerciseState = ExerciseState.S1_STANDING;
  private stateSequence: ExerciseState[] = [];
  private stateHistory: StateTransition[] = [];
  private lastTransitionTime: number = Date.now();
  private stateStartTime: number = Date.now();
  private thresholds: ExerciseThresholds = DEFAULT_THRESHOLDS;
  private currentMode: ExerciseMode = ExerciseMode.BEGINNER;
  private configServiceIntegrated: boolean = false;
  
  // Temporal smoothing for noisy data
  private recentAngles: ExerciseAngles[] = [];
  private readonly SMOOTHING_WINDOW = 3; // Number of frames to average
  private readonly MIN_STATE_DURATION = 200; // Minimum time in state (ms)
  
  // Testing mode to disable temporal smoothing
  private testingMode: boolean = false;

  constructor(mode: ExerciseMode = ExerciseMode.BEGINNER, customThresholds?: ExerciseThresholds, testingMode: boolean = false) {
    this.currentMode = mode;
    this.thresholds = customThresholds || DEFAULT_THRESHOLDS;
    this.testingMode = testingMode;
    this.resetSequence();
    
    // Integrate with config service if not in testing mode
    if (!testingMode) {
      this.integrateWithConfigService();
    }
  }

  /**
   * Update state based on current exercise angles
   */
  updateState(angles: ExerciseAngles): StateTransition {
    // Add to smoothing window
    this.recentAngles.push(angles);
    if (this.recentAngles.length > this.SMOOTHING_WINDOW) {
      this.recentAngles.shift();
    }

    // Calculate smoothed angles
    const smoothedAngles = this.calculateSmoothedAngles();
    
    // Determine new state based on knee angle (primary indicator for squats)
    const newState = this.determineStateFromAngles(smoothedAngles);
    
    // Check if state change is valid (temporal smoothing)
    const currentTime = Date.now();
    const timeInCurrentState = currentTime - this.stateStartTime;
    
    // For testing purposes, allow immediate state changes if in testing mode
    // In production, temporal smoothing prevents noise
    const shouldAllowImmediate = this.testingMode || this.recentAngles.length <= 1 || timeInCurrentState > this.MIN_STATE_DURATION;
    
    // Only allow state change if we've been in current state long enough
    // or if the change is significant, or if we're in testing mode
    if (newState !== this.currentState && 
        (shouldAllowImmediate || this.isSignificantStateChange(newState, smoothedAngles))) {
      
      this.previousState = this.currentState;
      this.currentState = newState;
      this.lastTransitionTime = currentTime;
      this.stateStartTime = currentTime;
      
      // Update state sequence for rep counting
      this.updateStateSequence(newState);
      
      // Create transition record
      const transition: StateTransition = {
        previousState: this.previousState,
        currentState: this.currentState,
        timestamp: currentTime,
        triggerAngles: smoothedAngles
      };
      
      this.stateHistory.push(transition);
      
      // Keep history manageable
      if (this.stateHistory.length > 50) {
        this.stateHistory.shift();
      }
      
      return transition;
    }
    
    // No state change - return current state as transition
    return {
      previousState: this.currentState,
      currentState: this.currentState,
      timestamp: currentTime,
      triggerAngles: smoothedAngles
    };
  }

  /**
   * Determine exercise state from angles
   */
  private determineStateFromAngles(angles: ExerciseAngles): ExerciseState {
    const modeThresholds = this.thresholds[this.currentMode];
    const kneeAngle = angles.kneeAngle;
    
    // State determination based on knee angle
    if (kneeAngle > modeThresholds.kneeAngle.s1Threshold) {
      return ExerciseState.S1_STANDING;
    } else if (kneeAngle < modeThresholds.kneeAngle.s3Threshold) {
      return ExerciseState.S3_DEEP_SQUAT;
    } else {
      return ExerciseState.S2_TRANSITION;
    }
  }

  /**
   * Check if state change is significant enough to override temporal smoothing
   */
  private isSignificantStateChange(newState: ExerciseState, angles: ExerciseAngles): boolean {
    const modeThresholds = this.thresholds[this.currentMode];
    const kneeAngle = angles.kneeAngle;
    
    // Significant changes that should override temporal smoothing
    if (this.currentState === ExerciseState.S1_STANDING && 
        kneeAngle < modeThresholds.kneeAngle.s3Threshold - 20) {
      return true; // Rapid descent to deep squat
    }
    
    if (this.currentState === ExerciseState.S3_DEEP_SQUAT && 
        kneeAngle > modeThresholds.kneeAngle.s1Threshold + 20) {
      return true; // Rapid ascent to standing
    }
    
    return false;
  }

  /**
   * Calculate smoothed angles from recent measurements
   */
  private calculateSmoothedAngles(): ExerciseAngles {
    if (this.recentAngles.length === 0) {
      throw new Error('No angle measurements available for smoothing');
    }
    
    // In testing mode, return the most recent angle without smoothing
    if (this.testingMode) {
      return this.recentAngles[this.recentAngles.length - 1];
    }
    
    if (this.recentAngles.length === 1) {
      return this.recentAngles[0];
    }
    
    // Calculate weighted average (more recent measurements have higher weight)
    let totalWeight = 0;
    const smoothed: ExerciseAngles = {
      kneeAngle: 0,
      hipAngle: 0,
      ankleAngle: 0,
      offsetAngle: 0
    };
    
    this.recentAngles.forEach((angles, index) => {
      const weight = index + 1; // More recent = higher weight
      totalWeight += weight;
      
      smoothed.kneeAngle += angles.kneeAngle * weight;
      smoothed.hipAngle += angles.hipAngle * weight;
      smoothed.ankleAngle += angles.ankleAngle * weight;
      smoothed.offsetAngle += angles.offsetAngle * weight;
    });
    
    // Normalize by total weight
    smoothed.kneeAngle /= totalWeight;
    smoothed.hipAngle /= totalWeight;
    smoothed.ankleAngle /= totalWeight;
    smoothed.offsetAngle /= totalWeight;
    
    return smoothed;
  }

  /**
   * Update state sequence for rep counting
   */
  private updateStateSequence(newState: ExerciseState): void {
    // Always add the new state to sequence
    this.stateSequence.push(newState);
    
    // Prevent sequence from growing too large
    if (this.stateSequence.length > 20) {
      this.stateSequence = this.stateSequence.slice(-10);
    }
  }

  /**
   * Check if current sequence represents a valid repetition
   */
  isValidRepetition(): boolean {
    if (this.stateSequence.length < 5) {
      return false; // Too short to be a valid rep
    }
    
    // Look for the pattern: s1 -> s2 -> s3 -> s2 -> s1 anywhere in the sequence
    const sequence = this.stateSequence;
    
    // Check if we have the complete pattern anywhere in the sequence
    for (let i = 0; i <= sequence.length - 5; i++) {
      const subSequence = sequence.slice(i, i + 5);
      if (subSequence[0] === ExerciseState.S1_STANDING &&
          subSequence[1] === ExerciseState.S2_TRANSITION &&
          subSequence[2] === ExerciseState.S3_DEEP_SQUAT &&
          subSequence[3] === ExerciseState.S2_TRANSITION &&
          subSequence[4] === ExerciseState.S1_STANDING) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for partial valid patterns (for progress feedback)
   */
  hasValidPartialSequence(): boolean {
    if (this.stateSequence.length < 3) {
      return false;
    }
    
    const sequence = this.stateSequence;
    const lastThree = sequence.slice(-3);
    
    // Check for valid partial patterns
    return (
      // Descent pattern: s1 -> s2 -> s3
      (lastThree[0] === ExerciseState.S1_STANDING &&
       lastThree[1] === ExerciseState.S2_TRANSITION &&
       lastThree[2] === ExerciseState.S3_DEEP_SQUAT) ||
      
      // Ascent pattern: s3 -> s2 -> s1
      (lastThree[0] === ExerciseState.S3_DEEP_SQUAT &&
       lastThree[1] === ExerciseState.S2_TRANSITION &&
       lastThree[2] === ExerciseState.S1_STANDING)
    );
  }

  /**
   * Get current state
   */
  getCurrentState(): ExerciseState {
    return this.currentState;
  }

  /**
   * Get state sequence
   */
  getStateSequence(): ExerciseState[] {
    return [...this.stateSequence];
  }

  /**
   * Get state history
   */
  getStateHistory(): StateTransition[] {
    return [...this.stateHistory];
  }

  /**
   * Reset sequence and history
   */
  resetSequence(): void {
    this.stateSequence = [ExerciseState.S1_STANDING];
    this.stateHistory = [];
    this.currentState = ExerciseState.S1_STANDING;
    this.previousState = ExerciseState.S1_STANDING;
    this.recentAngles = [];
    this.stateStartTime = Date.now();
    this.lastTransitionTime = Date.now();
  }

  /**
   * Set exercise mode and update thresholds
   */
  setExerciseMode(mode: ExerciseMode): void {
    this.currentMode = mode;
    
    // Update config service if integrated
    if (this.configServiceIntegrated && !this.testingMode) {
      exerciseModeConfigService.switchMode(mode);
      // Thresholds will be updated via listener
    } else {
      // Direct threshold update for testing or non-integrated mode
      // Mode change might affect current state, so re-evaluate if we have recent angles
      if (this.recentAngles.length > 0) {
        const currentAngles = this.recentAngles[this.recentAngles.length - 1];
        this.updateState(currentAngles);
      }
    }
  }

  /**
   * Get current exercise mode
   */
  getCurrentMode(): ExerciseMode {
    return this.currentMode;
  }

  /**
   * Update thresholds
   */
  setThresholds(thresholds: ExerciseThresholds): void {
    this.thresholds = thresholds;
  }

  /**
   * Get current thresholds
   */
  getThresholds(): ExerciseThresholds {
    return this.thresholds;
  }

  /**
   * Get time spent in current state
   */
  getTimeInCurrentState(): number {
    return Date.now() - this.stateStartTime;
  }

  /**
   * Get time since last transition
   */
  getTimeSinceLastTransition(): number {
    return Date.now() - this.lastTransitionTime;
  }

  /**
   * Check if user has been inactive (no state changes)
   */
  isInactive(timeoutMs?: number): boolean {
    const timeout = timeoutMs || this.thresholds[this.currentMode].inactivityTimeout * 1000;
    return this.getTimeSinceLastTransition() > timeout;
  }

  /**
   * Get exercise statistics
   */
  getStatistics(): {
    totalTransitions: number;
    timeInEachState: Record<ExerciseState, number>;
    averageTransitionTime: number;
    validSequences: number;
  } {
    const stats = {
      totalTransitions: this.stateHistory.length,
      timeInEachState: {
        [ExerciseState.S1_STANDING]: 0,
        [ExerciseState.S2_TRANSITION]: 0,
        [ExerciseState.S3_DEEP_SQUAT]: 0
      },
      averageTransitionTime: 0,
      validSequences: 0
    };

    // Calculate time in each state
    for (let i = 0; i < this.stateHistory.length - 1; i++) {
      const transition = this.stateHistory[i];
      const nextTransition = this.stateHistory[i + 1];
      const timeInState = nextTransition.timestamp - transition.timestamp;
      
      stats.timeInEachState[transition.currentState] += timeInState;
    }

    // Add current state time
    stats.timeInEachState[this.currentState] += this.getTimeInCurrentState();

    // Calculate average transition time
    if (this.stateHistory.length > 1) {
      const totalTime = this.stateHistory[this.stateHistory.length - 1].timestamp - 
                       this.stateHistory[0].timestamp;
      stats.averageTransitionTime = totalTime / this.stateHistory.length;
    }

    // Count valid sequences (simplified - count complete reps)
    let sequenceCount = 0;
    for (let i = 0; i <= this.stateSequence.length - 5; i++) {
      const subSequence = this.stateSequence.slice(i, i + 5);
      if (subSequence[0] === ExerciseState.S1_STANDING &&
          subSequence[1] === ExerciseState.S2_TRANSITION &&
          subSequence[2] === ExerciseState.S3_DEEP_SQUAT &&
          subSequence[3] === ExerciseState.S2_TRANSITION &&
          subSequence[4] === ExerciseState.S1_STANDING) {
        sequenceCount++;
      }
    }
    stats.validSequences = sequenceCount;

    return stats;
  }

  /**
   * Integrate with exercise mode configuration service
   */
  private integrateWithConfigService(): void {
    if (this.testingMode) return;

    try {
      // Set up listener for config changes
      const configChangeListener: ModeChangeListener = (event) => {
        // Update mode and thresholds immediately
        this.currentMode = event.newMode;
        this.thresholds = exerciseModeConfigService.getCurrentConfig().thresholds;
        
        // Re-evaluate current state with new thresholds if we have recent angles
        if (this.recentAngles.length > 0) {
          const currentAngles = this.recentAngles[this.recentAngles.length - 1];
          this.updateState(currentAngles);
        }
      };

      exerciseModeConfigService.addModeChangeListener(configChangeListener);
      
      // Sync initial state with config service
      const currentConfig = exerciseModeConfigService.getCurrentConfig();
      this.currentMode = currentConfig.mode;
      this.thresholds = currentConfig.thresholds;
      
      this.configServiceIntegrated = true;
    } catch (error) {
      console.warn('Failed to integrate with exercise mode config service:', error);
      this.configServiceIntegrated = false;
    }
  }
}

// Export default thresholds for testing and configuration
export { DEFAULT_THRESHOLDS };

// Export singleton instance for easy use
export const exerciseStateMachine = new ExerciseStateMachine();