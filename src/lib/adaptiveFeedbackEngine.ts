/**
 * Adaptive Feedback Engine
 * Generates real-time multimodal feedback based on form analysis
 */

import type {
  FeedbackResponse,
  VisualCue,
  ScreenPosition,
  FormViolation,
  ExerciseState,
  ExerciseAngles,
  ViewAnalysis,
  RepCountResult
} from '@/types/advancedPose';

import { ViolationType, Severity, ExerciseMode, RepQuality, FeedbackPriority, CueType } from '@/types/advancedPose';
import { exerciseModeConfigService, type ModeChangeListener } from './exerciseModeConfigService';

export interface FeedbackConfig {
  enableAudioFeedback: boolean;
  enableVisualFeedback: boolean;
  feedbackFrequency: number; // milliseconds between feedback
  priorityThreshold: FeedbackPriority;
  maxSimultaneousMessages: number;
  voiceSettings: {
    rate: number; // 0.1 to 10
    pitch: number; // 0 to 2
    volume: number; // 0 to 1
  };
}

const DEFAULT_CONFIG: FeedbackConfig = {
  enableAudioFeedback: true,
  enableVisualFeedback: true,
  feedbackFrequency: 2000, // 2 seconds
  priorityThreshold: FeedbackPriority.MEDIUM,
  maxSimultaneousMessages: 3,
  voiceSettings: {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  }
};

export class AdaptiveFeedbackEngine {
  private config: FeedbackConfig;
  private lastFeedbackTime: number = 0;
  private recentMessages: string[] = [];
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private configServiceIntegrated: boolean = false;

  constructor(config: Partial<FeedbackConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize speech synthesis if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
    
    // Integrate with config service
    this.integrateWithConfigService();
  }

  /**
   * Generate comprehensive feedback based on current analysis state
   */
  generateFeedback(
    violations: FormViolation[],
    currentState: ExerciseState,
    angles: ExerciseAngles,
    viewAnalysis: ViewAnalysis,
    repResult?: RepCountResult,
    exerciseMode: ExerciseMode = ExerciseMode.BEGINNER
  ): FeedbackResponse {
    const currentTime = Date.now();
    
    // Generate audio messages
    const audioMessages = this.generateAudioMessages(
      violations,
      currentState,
      angles,
      viewAnalysis,
      repResult,
      exerciseMode
    );

    // Generate visual cues
    const visualCues = this.generateVisualCues(
      violations,
      currentState,
      angles,
      viewAnalysis,
      repResult
    );

    // Determine priority
    const priority = this.determinePriority(violations, viewAnalysis, repResult);

    // Check if feedback should be delivered (high priority bypasses throttling)
    const shouldSpeak = this.shouldDeliverFeedback(priority, audioMessages, currentTime);

    if (shouldSpeak) {
      this.lastFeedbackTime = currentTime;
      this.updateRecentMessages(audioMessages);
    }

    return {
      audioMessages: shouldSpeak ? audioMessages : [],
      visualCues,
      priority,
      shouldSpeak
    };
  }

  /**
   * Generate audio feedback messages
   */
  private generateAudioMessages(
    violations: FormViolation[],
    currentState: ExerciseState,
    angles: ExerciseAngles,
    viewAnalysis: ViewAnalysis,
    repResult?: RepCountResult,
    exerciseMode: ExerciseMode = ExerciseMode.BEGINNER
  ): string[] {
    const messages: string[] = [];

    // Priority 1: Camera positioning issues
    if (viewAnalysis.viewType === 'frontal' || viewAnalysis.viewType === 'unknown') {
      messages.push('Please position yourself to the side of the camera for better analysis.');
      return messages; // Block other feedback until positioning is fixed
    }

    // Priority 2: Rep completion feedback
    if (repResult?.repCompleted) {
      messages.push(this.getRepCompletionMessage(repResult));
    }

    // Priority 3: Critical form violations
    const criticalViolations = violations.filter(v => v.severity === Severity.HIGH);
    if (criticalViolations.length > 0) {
      const criticalMessage = this.getCriticalViolationMessage(criticalViolations[0]);
      if (criticalMessage) {
        messages.push(criticalMessage);
      }
    }

    // Priority 4: State-specific guidance
    if (messages.length === 0) {
      const stateMessage = this.getStateSpecificMessage(currentState, angles, exerciseMode);
      if (stateMessage) {
        messages.push(stateMessage);
      }
    }

    // Priority 5: General form improvements
    if (messages.length === 0 && violations.length > 0) {
      const formMessage = this.getFormImprovementMessage(violations, exerciseMode);
      if (formMessage) {
        messages.push(formMessage);
      }
    }

    return messages.slice(0, this.config.maxSimultaneousMessages);
  }

  /**
   * Generate visual feedback cues
   */
  private generateVisualCues(
    violations: FormViolation[],
    currentState: ExerciseState,
    angles: ExerciseAngles,
    viewAnalysis: ViewAnalysis,
    repResult?: RepCountResult
  ): VisualCue[] {
    const cues: VisualCue[] = [];

    // Rep counter display
    cues.push({
      type: CueType.REP_COUNTER,
      position: { x: 10, y: 10 },
      color: '#FFFFFF',
      message: repResult ? `Rep ${repResult.repQuality}` : 'Ready',
      duration: 3000
    });

    // Angle indicators for knee angle
    if (angles.kneeAngle) {
      cues.push({
        type: CueType.ANGLE_INDICATOR,
        position: { x: 70, y: 60 },
        color: this.getAngleIndicatorColor(angles.kneeAngle, currentState),
        message: `${Math.round(angles.kneeAngle)}°`,
        duration: 1000
      });
    }

    // Form violation warnings
    violations.forEach((violation, index) => {
      if (violation.severity === Severity.HIGH) {
        cues.push({
          type: CueType.FORM_WARNING,
          position: { x: 50, y: 30 + (index * 10) },
          color: '#EF4444',
          message: violation.description,
          duration: 4000
        });
      }
    });

    // Camera positioning guides
    if (viewAnalysis.viewType !== 'optimal_side') {
      cues.push({
        type: CueType.POSITIONING_GUIDE,
        position: { x: 50, y: 80 },
        color: viewAnalysis.viewType === 'frontal' ? '#EF4444' : '#F59E0B',
        message: viewAnalysis.recommendations[0] || 'Adjust camera position',
        duration: 5000
      });
    }

    return cues;
  }

  /**
   * Get rep completion message
   */
  private getRepCompletionMessage(repResult: RepCountResult): string {
    const qualityMessages = {
      [RepQuality.EXCELLENT]: [
        'Perfect rep! Excellent form.',
        'Outstanding technique!',
        'Flawless execution!'
      ],
      [RepQuality.GOOD]: [
        'Good rep! Nice work.',
        'Solid form, keep it up.',
        'Well done!'
      ],
      [RepQuality.NEEDS_IMPROVEMENT]: [
        'Rep completed. Focus on form.',
        'Good effort, improve technique.',
        'Keep working on your form.'
      ],
      [RepQuality.POOR]: [
        'Rep counted. Focus on quality.',
        'Slow down and focus on form.',
        'Quality over quantity.'
      ]
    };

    const messages = qualityMessages[repResult.repQuality];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get critical violation message
   */
  private getCriticalViolationMessage(violation: FormViolation): string {
    const criticalMessages = {
      [ViolationType.KNEE_OVER_TOES]: 'Keep your knees behind your toes to prevent injury.',
      [ViolationType.EXCESSIVE_DEPTH]: 'Don\'t go too deep. Stop at 90 degrees.',
      [ViolationType.FORWARD_LEAN]: 'Keep your chest up and back straight.',
      [ViolationType.BACKWARD_LEAN]: 'Lean slightly forward, engage your core.',
      [ViolationType.INSUFFICIENT_DEPTH]: 'Go deeper. Aim for 90 degrees at the knee.'
    };

    return criticalMessages[violation.type] || violation.correctionHint;
  }

  /**
   * Get state-specific guidance message
   */
  private getStateSpecificMessage(
    currentState: ExerciseState,
    angles: ExerciseAngles,
    exerciseMode: ExerciseMode
  ): string | null {
    const beginnerMessages = {
      's1': ['Ready for your next rep!', 'Take your time, focus on form.'],
      's2': ['Control the movement down.', 'Keep your core engaged.'],
      's3': ['Good depth! Now drive back up.', 'Push through your heels.']
    };

    const proMessages = {
      's1': ['Maintain tension between reps.', 'Ready for the next rep.'],
      's2': ['Control the descent.', 'Feel the stretch in your glutes.'],
      's3': ['Explosive drive up!', 'Power through your heels.']
    };

    const messages = exerciseMode === ExerciseMode.PRO ? proMessages : beginnerMessages;
    const stateMessages = messages[currentState];
    
    if (stateMessages && Math.random() < 0.3) { // 30% chance to give state guidance
      return stateMessages[Math.floor(Math.random() * stateMessages.length)];
    }

    return null;
  }

  /**
   * Get form improvement message
   */
  private getFormImprovementMessage(violations: FormViolation[], exerciseMode: ExerciseMode): string | null {
    if (violations.length === 0) return null;

    // Focus on the most severe violation
    const sortedViolations = violations.sort((a, b) => {
      const severityOrder = { [Severity.HIGH]: 3, [Severity.MEDIUM]: 2, [Severity.LOW]: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const primaryViolation = sortedViolations[0];
    
    if (exerciseMode === ExerciseMode.BEGINNER && primaryViolation.severity === Severity.LOW) {
      return null; // Don't overwhelm beginners with minor corrections
    }

    return primaryViolation.correctionHint;
  }

  /**
   * Determine feedback priority
   */
  private determinePriority(
    violations: FormViolation[],
    viewAnalysis: ViewAnalysis,
    repResult?: RepCountResult
  ): FeedbackPriority {
    // Critical: Camera positioning issues
    if (viewAnalysis.viewType === 'frontal' || viewAnalysis.viewType === 'unknown') {
      return FeedbackPriority.CRITICAL;
    }

    // High: Critical form violations or rep completion
    if (violations.some(v => v.severity === Severity.HIGH) || repResult?.repCompleted) {
      return FeedbackPriority.HIGH;
    }

    // Medium: Medium severity violations
    if (violations.some(v => v.severity === Severity.MEDIUM)) {
      return FeedbackPriority.MEDIUM;
    }

    // Low: Minor violations or general guidance
    return FeedbackPriority.LOW;
  }

  /**
   * Check if feedback should be delivered
   */
  private shouldDeliverFeedback(priority: FeedbackPriority, messages: string[], currentTime: number): boolean {
    if (!this.config.enableAudioFeedback || messages.length === 0) {
      return false;
    }

    // Always deliver critical and high priority feedback (bypass throttling)
    if (priority === FeedbackPriority.CRITICAL || priority === FeedbackPriority.HIGH) {
      return true;
    }

    // Check throttling for lower priority feedback
    if (currentTime - this.lastFeedbackTime < this.config.feedbackFrequency) {
      return false;
    }

    // Check priority threshold
    const priorityOrder = {
      [FeedbackPriority.LOW]: 1,
      [FeedbackPriority.MEDIUM]: 2,
      [FeedbackPriority.HIGH]: 3,
      [FeedbackPriority.CRITICAL]: 4
    };

    return priorityOrder[priority] >= priorityOrder[this.config.priorityThreshold];
  }

  /**
   * Get color for angle indicator
   */
  private getAngleIndicatorColor(angle: number, state: ExerciseState): string {
    if (state === 's3') { // Deep squat
      return angle < 90 ? '#10B981' : '#F59E0B'; // Green if good depth, yellow if not deep enough
    } else if (state === 's1') { // Standing
      return angle > 160 ? '#10B981' : '#F59E0B'; // Green if standing straight
    }
    return '#6B7280'; // Gray for transition
  }

  /**
   * Deliver audio feedback using Web Speech API
   */
  async deliverAudioFeedback(messages: string[]): Promise<void> {
    if (!this.speechSynthesis || !this.config.enableAudioFeedback || messages.length === 0) {
      return;
    }

    // Cancel any ongoing speech
    this.speechSynthesis.cancel();

    // Combine messages
    const combinedMessage = messages.join('. ');

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(combinedMessage);
    this.currentUtterance.rate = this.config.voiceSettings.rate;
    this.currentUtterance.pitch = this.config.voiceSettings.pitch;
    this.currentUtterance.volume = this.config.voiceSettings.volume;

    // Speak the message
    this.speechSynthesis.speak(this.currentUtterance);
  }

  /**
   * Update recent messages to avoid repetition
   */
  private updateRecentMessages(messages: string[]): void {
    this.recentMessages.push(...messages);
    
    // Keep only recent messages (last 10)
    if (this.recentMessages.length > 10) {
      this.recentMessages = this.recentMessages.slice(-10);
    }
  }

  /**
   * Create empty feedback response
   */
  private createEmptyFeedback(): FeedbackResponse {
    return {
      audioMessages: [],
      visualCues: [],
      priority: FeedbackPriority.LOW,
      shouldSpeak: false
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FeedbackConfig {
    return { ...this.config };
  }

  /**
   * Reset feedback state
   */
  reset(): void {
    this.lastFeedbackTime = 0;
    this.recentMessages = [];
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Stop current audio feedback
   */
  stopAudioFeedback(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Check if audio feedback is currently playing
   */
  isAudioPlaying(): boolean {
    return this.speechSynthesis?.speaking || false;
  }

  /**
   * Integrate with exercise mode configuration service
   */
  private integrateWithConfigService(): void {
    try {
      // Set up listener for config changes
      const configChangeListener: ModeChangeListener = (event) => {
        // Update feedback configuration based on new mode
        const currentConfig = exerciseModeConfigService.getCurrentConfig();
        
        // Update feedback frequency and sensitivity based on mode
        this.updateConfig({
          feedbackFrequency: currentConfig.feedbackConfig.frequency,
          priorityThreshold: currentConfig.feedbackConfig.priorityThreshold as FeedbackPriority
        });
      };

      exerciseModeConfigService.addModeChangeListener(configChangeListener);
      
      // Sync initial state with config service
      const currentConfig = exerciseModeConfigService.getCurrentConfig();
      this.updateConfig({
        feedbackFrequency: currentConfig.feedbackConfig.frequency,
        priorityThreshold: currentConfig.feedbackConfig.priorityThreshold as FeedbackPriority
      });
      
      this.configServiceIntegrated = true;
    } catch (error) {
      console.warn('Failed to integrate with exercise mode config service:', error);
      this.configServiceIntegrated = false;
    }
  }
}

// Export default instance for easy use
export const adaptiveFeedbackEngine = new AdaptiveFeedbackEngine();