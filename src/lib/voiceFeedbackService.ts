/**
 * Voice Feedback Service
 * Text-to-Speech integration for real-time workout guidance and form feedback
 */

import type { FormAnalysis, FormScore, FormIssue } from '../types';

export interface VoiceFeedbackConfig {
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  language: string;
  enableFormFeedback: boolean;
  enableEncouragement: boolean;
  enableInstructions: boolean;
  feedbackFrequency: 'immediate' | 'periodic' | 'on_completion';
}

export interface VoiceFeedbackMessage {
  id: string;
  type: 'form_correction' | 'encouragement' | 'instruction' | 'completion' | 'warning';
  priority: 'high' | 'medium' | 'low';
  message: string;
  timestamp: number;
  exerciseId?: string;
  formIssue?: FormIssue;
}

export class VoiceFeedbackService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private config: VoiceFeedbackConfig;
  private messageQueue: VoiceFeedbackMessage[] = [];
  private isPlaying = false;
  private lastFeedbackTime = 0;
  private feedbackCooldown = 3000; // 3 seconds between feedback messages
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize speech synthesis
   */
  private initializeSpeechSynthesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      
      // Load voices
      this.loadVoices();
      
      // Listen for voice changes
      if (this.synthesis) {
        this.synthesis.addEventListener('voiceschanged', () => {
          this.loadVoices();
        });
      }
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
    
    // Set default voice if not already set
    if (!this.config.voice && this.voices.length > 0) {
      // Prefer English voices
      const englishVoice = this.voices.find(voice => 
        voice.lang.startsWith('en') && !voice.name.includes('Google')
      );
      this.config.voice = englishVoice || this.voices[0];
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VoiceFeedbackConfig {
    return {
      enabled: true,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      language: 'en-US',
      enableFormFeedback: true,
      enableEncouragement: true,
      enableInstructions: true,
      feedbackFrequency: 'periodic',
    };
  }

  /**
   * Check if voice feedback is supported
   */
  isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VoiceFeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceFeedbackConfig {
    return { ...this.config };
  }

  /**
   * Provide form feedback based on analysis
   */
  provideFormFeedback(analysis: FormAnalysis, exerciseId: string): void {
    if (!this.config.enabled || !this.config.enableFormFeedback) return;

    const now = Date.now();
    
    // Check cooldown for form feedback
    if (this.config.feedbackFrequency === 'periodic' && 
        now - this.lastFeedbackTime < this.feedbackCooldown) {
      return;
    }

    // Generate feedback messages based on issues
    const messages = this.generateFormFeedbackMessages(analysis, exerciseId);
    
    if (messages.length > 0) {
      // Add high priority messages to queue
      const highPriorityMessages = messages.filter(msg => msg.priority === 'high');
      if (highPriorityMessages.length > 0) {
        this.queueMessages(highPriorityMessages.slice(0, 1)); // Only one high priority message
        this.lastFeedbackTime = now;
      } else if (this.config.feedbackFrequency === 'immediate') {
        this.queueMessages(messages.slice(0, 1));
        this.lastFeedbackTime = now;
      }
    }
  }

  /**
   * Provide form score feedback
   */
  provideScoreFeedback(score: FormScore, exerciseId: string): void {
    if (!this.config.enabled || !this.config.enableEncouragement) return;

    const message = this.generateScoreFeedbackMessage(score, exerciseId);
    if (message) {
      this.queueMessage(message);
    }
  }

  /**
   * Provide exercise instructions
   */
  provideInstructions(exerciseId: string, instruction: string): void {
    if (!this.config.enabled || !this.config.enableInstructions) return;

    const message: VoiceFeedbackMessage = {
      id: `instruction_${Date.now()}`,
      type: 'instruction',
      priority: 'medium',
      message: instruction,
      timestamp: Date.now(),
      exerciseId,
    };

    this.queueMessage(message);
  }

  /**
   * Provide encouragement
   */
  provideEncouragement(type: 'start' | 'progress' | 'completion' | 'milestone'): void {
    if (!this.config.enabled || !this.config.enableEncouragement) return;

    const encouragementMessages = {
      start: [
        "Let's get started! Focus on your form.",
        "Ready to work out? Remember to maintain good posture.",
        "Time to exercise! Keep your movements controlled.",
      ],
      progress: [
        "Great job! Keep it up!",
        "You're doing well! Stay focused.",
        "Nice form! Maintain that technique.",
        "Excellent! Keep pushing yourself.",
      ],
      completion: [
        "Workout complete! Great job!",
        "Well done! You've finished your set.",
        "Excellent work! Take a moment to rest.",
      ],
      milestone: [
        "Milestone achieved! Outstanding work!",
        "You've reached a new personal best!",
        "Incredible progress! Keep it up!",
      ],
    };

    const messages = encouragementMessages[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const message: VoiceFeedbackMessage = {
      id: `encouragement_${Date.now()}`,
      type: 'encouragement',
      priority: 'low',
      message: randomMessage,
      timestamp: Date.now(),
    };

    this.queueMessage(message);
  }

  /**
   * Provide warning or safety message
   */
  provideWarning(warning: string): void {
    if (!this.config.enabled) return;

    const message: VoiceFeedbackMessage = {
      id: `warning_${Date.now()}`,
      type: 'warning',
      priority: 'high',
      message: warning,
      timestamp: Date.now(),
    };

    // Warnings get immediate priority
    this.queueMessage(message, true);
  }

  /**
   * Generate form feedback messages
   */
  private generateFormFeedbackMessages(
    analysis: FormAnalysis, 
    exerciseId: string
  ): VoiceFeedbackMessage[] {
    const messages: VoiceFeedbackMessage[] = [];

    // Focus on high severity issues first
    const highSeverityIssues = analysis.issues.filter(issue => issue.severity === 'high');
    const mediumSeverityIssues = analysis.issues.filter(issue => issue.severity === 'medium');

    // Generate messages for high severity issues
    for (const issue of highSeverityIssues.slice(0, 1)) { // Only one high severity message
      const message = this.createFormCorrectionMessage(issue, exerciseId);
      if (message) messages.push(message);
    }

    // If no high severity issues, consider medium severity
    if (messages.length === 0 && mediumSeverityIssues.length > 0) {
      const issue = mediumSeverityIssues[0];
      const message = this.createFormCorrectionMessage(issue, exerciseId);
      if (message) messages.push(message);
    }

    return messages;
  }

  /**
   * Create form correction message
   */
  private createFormCorrectionMessage(
    issue: FormIssue, 
    exerciseId: string
  ): VoiceFeedbackMessage | null {
    let voiceMessage = '';

    // Convert technical corrections to natural speech
    switch (issue.type) {
      case 'alignment':
        voiceMessage = this.convertAlignmentCorrection(issue.correction);
        break;
      case 'posture':
        voiceMessage = this.convertPostureCorrection(issue.correction);
        break;
      case 'range_of_motion':
        voiceMessage = this.convertRangeOfMotionCorrection(issue.correction);
        break;
      case 'timing':
        voiceMessage = this.convertTimingCorrection(issue.correction);
        break;
      default:
        voiceMessage = issue.correction;
    }

    if (!voiceMessage) return null;

    return {
      id: `form_correction_${Date.now()}`,
      type: 'form_correction',
      priority: issue.severity === 'high' ? 'high' : 'medium',
      message: voiceMessage,
      timestamp: Date.now(),
      exerciseId,
      formIssue: issue,
    };
  }

  /**
   * Convert alignment corrections to natural speech
   */
  private convertAlignmentCorrection(correction: string): string {
    const alignmentPhrases = {
      'straight line': 'Keep your body in a straight line',
      'aligned': 'Keep your joints aligned',
      'level': 'Keep your shoulders level',
      'centered': 'Keep your weight centered',
    };

    for (const [key, phrase] of Object.entries(alignmentPhrases)) {
      if (correction.toLowerCase().includes(key)) {
        return phrase;
      }
    }

    return correction;
  }

  /**
   * Convert posture corrections to natural speech
   */
  private convertPostureCorrection(correction: string): string {
    const posturePhrases = {
      'core': 'Engage your core muscles',
      'chest up': 'Keep your chest up',
      'back straight': 'Keep your back straight',
      'shoulders back': 'Pull your shoulders back',
    };

    for (const [key, phrase] of Object.entries(posturePhrases)) {
      if (correction.toLowerCase().includes(key)) {
        return phrase;
      }
    }

    return correction;
  }

  /**
   * Convert range of motion corrections to natural speech
   */
  private convertRangeOfMotionCorrection(correction: string): string {
    const romPhrases = {
      'full range': 'Use the full range of motion',
      'deeper': 'Go deeper in the movement',
      'lower': 'Lower yourself more',
      'extend': 'Fully extend your arms',
    };

    for (const [key, phrase] of Object.entries(romPhrases)) {
      if (correction.toLowerCase().includes(key)) {
        return phrase;
      }
    }

    return correction;
  }

  /**
   * Convert timing corrections to natural speech
   */
  private convertTimingCorrection(correction: string): string {
    const timingPhrases = {
      'slower': 'Slow down your movement',
      'controlled': 'Keep your movements controlled',
      'pause': 'Pause at the bottom',
      'steady': 'Maintain a steady pace',
    };

    for (const [key, phrase] of Object.entries(timingPhrases)) {
      if (correction.toLowerCase().includes(key)) {
        return phrase;
      }
    }

    return correction;
  }

  /**
   * Generate score feedback message
   */
  private generateScoreFeedbackMessage(
    score: FormScore, 
    exerciseId: string
  ): VoiceFeedbackMessage | null {
    let message = '';

    if (score.overall >= 0.9) {
      message = "Excellent form! Keep it up!";
    } else if (score.overall >= 0.8) {
      message = "Good form! You're doing well.";
    } else if (score.overall >= 0.7) {
      message = "Nice work! Focus on the corrections.";
    } else if (score.overall >= 0.6) {
      message = "Keep working on your form.";
    } else {
      message = "Focus on the basics. Slow down if needed.";
    }

    return {
      id: `score_feedback_${Date.now()}`,
      type: 'encouragement',
      priority: 'low',
      message,
      timestamp: Date.now(),
      exerciseId,
    };
  }

  /**
   * Queue a message for speech
   */
  private queueMessage(message: VoiceFeedbackMessage, immediate = false): void {
    if (immediate) {
      this.messageQueue.unshift(message);
    } else {
      this.messageQueue.push(message);
    }
    
    this.processQueue();
  }

  /**
   * Queue multiple messages
   */
  private queueMessages(messages: VoiceFeedbackMessage[]): void {
    this.messageQueue.push(...messages);
    this.processQueue();
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.messageQueue.length === 0 || !this.synthesis) {
      return;
    }

    const message = this.messageQueue.shift();
    if (!message) return;

    await this.speakMessage(message);
  }

  /**
   * Speak a message using TTS
   */
  private async speakMessage(message: VoiceFeedbackMessage): Promise<void> {
    if (!this.synthesis || !this.config.enabled) return;

    return new Promise((resolve) => {
      this.isPlaying = true;
      
      const utterance = new SpeechSynthesisUtterance(message.message);
      
      // Configure utterance
      utterance.voice = this.config.voice || null;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;
      utterance.lang = this.config.language;

      // Set up event handlers
      utterance.onend = () => {
        this.isPlaying = false;
        this.currentUtterance = null;
        resolve();
        
        // Process next message in queue
        setTimeout(() => this.processQueue(), 500);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        this.isPlaying = false;
        this.currentUtterance = null;
        resolve();
        
        // Process next message in queue
        setTimeout(() => this.processQueue(), 500);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech and clear queue
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.messageQueue = [];
    this.isPlaying = false;
    this.currentUtterance = null;
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis && this.isPlaying) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis && this.isPlaying) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current message queue length
   */
  getQueueLength(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Test voice synthesis
   */
  testVoice(message = "Voice feedback is working correctly."): void {
    const testMessage: VoiceFeedbackMessage = {
      id: `test_${Date.now()}`,
      type: 'instruction',
      priority: 'medium',
      message,
      timestamp: Date.now(),
    };

    this.queueMessage(testMessage, true);
  }
}

// Export singleton instance
export const voiceFeedbackService = new VoiceFeedbackService();