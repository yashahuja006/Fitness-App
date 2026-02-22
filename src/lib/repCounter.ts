/**
 * Rep Counter with Quality Assessment
 * Intelligent repetition counting system with form quality scoring
 */

import type {
  RepCounts,
  RepCountResult,
  StateTransition,
  FormViolation
} from '@/types/advancedPose';

import { ExerciseMode, ViolationType, Severity, ExerciseState, RepQuality } from '@/types/advancedPose';

export interface RepData {
  repNumber: number;
  quality: RepQuality;
  duration: number;
  violations: FormViolation[];
  stateTransitions: StateTransition[];
  startTime: number;
  endTime: number;
}

export interface RepCounterConfig {
  mode: ExerciseMode;
  inactivityTimeoutMs: number;
  minRepDurationMs: number;
  maxRepDurationMs: number;
  qualityThresholds: {
    excellent: number;    // 0.9+
    good: number;         // 0.7+
    needsImprovement: number; // 0.5+
    // Below 0.5 = poor
  };
}

const DEFAULT_CONFIG: RepCounterConfig = {
  mode: ExerciseMode.BEGINNER,
  inactivityTimeoutMs: 20000, // 20 seconds
  minRepDurationMs: 2000,     // 2 seconds minimum
  maxRepDurationMs: 15000,    // 15 seconds maximum
  qualityThresholds: {
    excellent: 0.9,
    good: 0.7,
    needsImprovement: 0.5
  }
};

export class RepCounter {
  private repCounts: RepCounts;
  private config: RepCounterConfig;
  private currentRepData: Partial<RepData> | null = null;
  private lastActivityTime: number = Date.now();
  private repHistory: RepData[] = [];
  private isInActiveRep: boolean = false;
  private lastValidSequenceTime: number = Date.now();

  constructor(config: Partial<RepCounterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.repCounts = {
      correctReps: 0,
      incorrectReps: 0,
      totalReps: 0,
      currentStreak: 0,
      sessionStartTime: Date.now()
    };
    // Initialize to allow immediate first rep
    this.lastValidSequenceTime = Date.now() - 2000;
  }

  /**
   * Process state transition and check for completed repetitions
   */
  processStateTransition(
    transition: StateTransition,
    violations: FormViolation[]
  ): RepCountResult {
    const currentTime = transition.timestamp;

    // Check for inactivity reset BEFORE updating lastActivityTime
    if (this.shouldResetDueToInactivity(currentTime)) {
      return this.resetDueToInactivity();
    }

    // Update activity time after inactivity check
    this.lastActivityTime = currentTime;

    // Start tracking a new rep if we're entering from standing
    if (transition.previousState === ExerciseState.S1_STANDING && 
        transition.currentState === ExerciseState.S2_TRANSITION &&
        !this.isInActiveRep) {
      this.startNewRep(transition);
    }

    // Add transition to current rep if we're tracking one
    if (this.currentRepData && this.isInActiveRep) {
      this.currentRepData.stateTransitions ??= [];
      this.currentRepData.stateTransitions.push(transition);
      
      // Add violations to current rep
      this.currentRepData.violations ??= [];
      this.currentRepData.violations.push(...violations);
    }

    // Check if rep is completed (back to standing)
    if (transition.currentState === ExerciseState.S1_STANDING && 
        this.isInActiveRep && 
        this.isValidRepSequence()) {
      return this.completeCurrentRep(transition.timestamp);
    }

    // Return no rep completed
    return {
      repCompleted: false,
      repQuality: RepQuality.POOR,
      feedback: this.generateProgressFeedback(transition.currentState),
      shouldReset: false
    };
  }

  /**
   * Start tracking a new repetition
   */
  private startNewRep(transition: StateTransition): void {
    this.isInActiveRep = true;
    this.currentRepData = {
      repNumber: this.repCounts.totalReps + 1,
      startTime: transition.timestamp,
      stateTransitions: [],
      violations: []
    };
  }

  /**
   * Complete the current repetition and assess quality
   */
  private completeCurrentRep(currentTime: number): RepCountResult {
    if (!this.currentRepData?.startTime) {
      return {
        repCompleted: false,
        repQuality: RepQuality.POOR,
        feedback: 'Error: No active rep to complete',
        shouldReset: false
      };
    }

    // Calculate rep duration using the transition timestamp, not current time
    const duration = currentTime - this.currentRepData.startTime;
    
    // Check if duration is within acceptable range
    if (duration < this.config.minRepDurationMs) {
      this.isInActiveRep = false;
      this.currentRepData = null;
      return {
        repCompleted: false,
        repQuality: RepQuality.POOR,
        feedback: `Rep too fast (${duration}ms) - slow down for better form`,
        shouldReset: false
      };
    }

    if (duration > this.config.maxRepDurationMs) {
      this.isInActiveRep = false;
      this.currentRepData = null;
      return {
        repCompleted: false,
        repQuality: RepQuality.POOR,
        feedback: 'Rep too slow - maintain consistent tempo',
        shouldReset: false
      };
    }

    // Complete the rep data
    const completedRep: RepData = {
      repNumber: this.currentRepData.repNumber!,
      quality: this.assessRepQuality(this.currentRepData.violations || []),
      duration,
      violations: this.currentRepData.violations || [],
      stateTransitions: this.currentRepData.stateTransitions || [],
      startTime: this.currentRepData.startTime,
      endTime: currentTime
    };

    // Add to history
    this.repHistory.push(completedRep);

    // Update counts
    this.repCounts.totalReps++;
    if (completedRep.quality === RepQuality.EXCELLENT || completedRep.quality === RepQuality.GOOD) {
      this.repCounts.correctReps++;
      this.repCounts.currentStreak++;
    } else {
      this.repCounts.incorrectReps++;
      this.repCounts.currentStreak = 0; // Reset streak on poor form
    }

    // Reset current rep tracking
    this.isInActiveRep = false;
    this.currentRepData = null;
    this.lastValidSequenceTime = currentTime;

    return {
      repCompleted: true,
      repQuality: completedRep.quality,
      feedback: this.generateRepCompletionFeedback(completedRep),
      shouldReset: false
    };
  }

  /**
   * Assess the quality of a completed repetition
   */
  private assessRepQuality(violations: FormViolation[]): RepQuality {
    if (violations.length === 0) {
      return RepQuality.EXCELLENT;
    }

    // Calculate quality score based on violations
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

    // Ensure score doesn't go below 0
    qualityScore = Math.max(0, qualityScore);

    // Map score to quality enum
    if (qualityScore >= this.config.qualityThresholds.excellent) {
      return RepQuality.EXCELLENT;
    } else if (qualityScore >= this.config.qualityThresholds.good) {
      return RepQuality.GOOD;
    } else if (qualityScore >= this.config.qualityThresholds.needsImprovement) {
      return RepQuality.NEEDS_IMPROVEMENT;
    } else {
      return RepQuality.POOR;
    }
  }

  /**
   * Check if the current state sequence represents a valid repetition
   */
  private isValidRepSequence(): boolean {
    if (!this.currentRepData?.stateTransitions || this.currentRepData.stateTransitions.length < 3) {
      return false;
    }

    const transitions = this.currentRepData.stateTransitions;
    const states = transitions.map(t => t.currentState);

    // Look for the pattern: S2 -> S3 -> S2 (we're now transitioning to S1)
    // We need at least: transition -> deep squat -> transition (back up)
    let foundTransition = false;
    let foundDeepSquat = false;
    let foundReturnTransition = false;
    
    for (const state of states) {
      if (state === ExerciseState.S2_TRANSITION && !foundTransition) {
        foundTransition = true;
      } else if (foundTransition && state === ExerciseState.S3_DEEP_SQUAT && !foundDeepSquat) {
        foundDeepSquat = true;
      } else if (foundDeepSquat && state === ExerciseState.S2_TRANSITION && !foundReturnTransition) {
        foundReturnTransition = true;
        break; // We found the complete pattern
      }
    }

    return foundTransition && foundDeepSquat && foundReturnTransition;
  }

  /**
   * Check if we should reset due to inactivity
   */
  private shouldResetDueToInactivity(currentTime: number): boolean {
    const timeSinceLastActivity = currentTime - this.lastActivityTime;
    return timeSinceLastActivity > this.config.inactivityTimeoutMs;
  }

  /**
   * Reset counter due to inactivity
   */
  private resetDueToInactivity(): RepCountResult {
    this.isInActiveRep = false;
    this.currentRepData = null;
    
    return {
      repCompleted: false,
      repQuality: RepQuality.POOR,
      feedback: 'Session reset due to inactivity. Start your next rep!',
      shouldReset: true
    };
  }

  /**
   * Generate feedback for rep completion
   */
  private generateRepCompletionFeedback(rep: RepData): string {
    const qualityMessages = {
      [RepQuality.EXCELLENT]: [
        'Perfect rep! Excellent form maintained throughout.',
        'Outstanding! Keep up that perfect technique.',
        'Flawless execution! You\'re in the zone.'
      ],
      [RepQuality.GOOD]: [
        'Good rep! Minor form adjustments could make it perfect.',
        'Nice work! Just a few small improvements needed.',
        'Solid rep! You\'re maintaining good form.'
      ],
      [RepQuality.NEEDS_IMPROVEMENT]: [
        'Rep completed, but focus on your form.',
        'Good effort! Let\'s work on technique for the next one.',
        'Rep counted, but there\'s room for improvement.'
      ],
      [RepQuality.POOR]: [
        'Rep completed with significant form issues.',
        'Focus on proper technique over speed.',
        'Form needs attention - quality over quantity!'
      ]
    };

    const messages = qualityMessages[rep.quality];
    const baseMessage = messages[Math.floor(Math.random() * messages.length)];

    // Add specific feedback based on violations
    if (rep.violations.length > 0) {
      const primaryViolation = rep.violations.find(v => v.severity === Severity.HIGH) || rep.violations[0];
      return `${baseMessage} ${primaryViolation.correctionHint}`;
    }

    // Add streak information for good reps
    if (rep.quality === RepQuality.EXCELLENT || rep.quality === RepQuality.GOOD) {
      if (this.repCounts.currentStreak >= 5) {
        return `${baseMessage} Amazing ${this.repCounts.currentStreak} rep streak!`;
      } else if (this.repCounts.currentStreak >= 3) {
        return `${baseMessage} Great ${this.repCounts.currentStreak} rep streak going!`;
      }
    }

    return baseMessage;
  }

  /**
   * Generate progress feedback during rep
   */
  private generateProgressFeedback(currentState: ExerciseState): string {
    switch (currentState) {
      case ExerciseState.S1_STANDING:
        return this.isInActiveRep ? 'Great! Return to starting position.' : 'Ready for your next rep!';
      case ExerciseState.S2_TRANSITION:
        return this.isInActiveRep ? 'Good transition - maintain control.' : 'Starting rep - keep good form.';
      case ExerciseState.S3_DEEP_SQUAT:
        return 'Perfect depth! Now drive back up.';
      default:
        return 'Keep going!';
    }
  }

  /**
   * Get current rep counts
   */
  getRepCounts(): RepCounts {
    return { ...this.repCounts };
  }

  /**
   * Get rep history
   */
  getRepHistory(): RepData[] {
    return [...this.repHistory];
  }

  /**
   * Get current rep data (if in progress)
   */
  getCurrentRepData(): Partial<RepData> | null {
    return this.currentRepData ? { ...this.currentRepData } : null;
  }

  /**
   * Check if currently tracking a rep
   */
  isTrackingRep(): boolean {
    return this.isInActiveRep;
  }

  /**
   * Reset all counts and history
   */
  reset(): void {
    this.repCounts = {
      correctReps: 0,
      incorrectReps: 0,
      totalReps: 0,
      currentStreak: 0,
      sessionStartTime: Date.now()
    };
    this.repHistory = [];
    this.currentRepData = null;
    this.isInActiveRep = false;
    this.lastActivityTime = Date.now();
    this.lastValidSequenceTime = Date.now();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RepCounterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalReps: number;
    correctReps: number;
    accuracy: number;
    averageRepDuration: number;
    currentStreak: number;
    sessionDuration: number;
    qualityDistribution: Record<RepQuality, number>;
  } {
    const sessionDuration = Date.now() - this.repCounts.sessionStartTime;
    const accuracy = this.repCounts.totalReps > 0 ? 
      (this.repCounts.correctReps / this.repCounts.totalReps) * 100 : 0;
    
    const averageRepDuration = this.repHistory.length > 0 ?
      this.repHistory.reduce((sum, rep) => sum + rep.duration, 0) / this.repHistory.length : 0;

    const qualityDistribution = {
      [RepQuality.EXCELLENT]: 0,
      [RepQuality.GOOD]: 0,
      [RepQuality.NEEDS_IMPROVEMENT]: 0,
      [RepQuality.POOR]: 0
    };

    this.repHistory.forEach(rep => {
      qualityDistribution[rep.quality]++;
    });

    return {
      totalReps: this.repCounts.totalReps,
      correctReps: this.repCounts.correctReps,
      accuracy,
      averageRepDuration,
      currentStreak: this.repCounts.currentStreak,
      sessionDuration,
      qualityDistribution
    };
  }

  /**
   * Force complete current rep (for testing or manual intervention)
   */
  forceCompleteRep(): RepCountResult | null {
    if (!this.isInActiveRep || !this.currentRepData) {
      return null;
    }

    return this.completeCurrentRep(Date.now());
  }

  /**
   * Check if enough time has passed since last valid sequence
   */
  isReadyForNextRep(): boolean {
    const timeSinceLastRep = Date.now() - this.lastValidSequenceTime;
    return timeSinceLastRep > 1000; // 1 second minimum between reps
  }
}

// Export default instance for easy use
export const repCounter = new RepCounter();