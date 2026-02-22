/**
 * Voice Assistant Service for Speech-to-Text and Text-to-Speech functionality
 * Integrates with Web Speech API for voice commands and audio guidance
 */

export interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: Date;
  action?: string;
  parameters?: Record<string, any>;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
  continuous: boolean;
}

export interface VoiceAssistantCallbacks {
  onCommandRecognized?: (command: VoiceCommand) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'listening' | 'processing' | 'speaking' | 'idle') => void;
}

class VoiceAssistantService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSupported = false;
  private settings: VoiceSettings;
  private callbacks: VoiceAssistantCallbacks = {};
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.settings = {
      enabled: false,
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      continuous: false,
    };

    this.initializeVoiceServices();
  }

  /**
   * Initialize Web Speech API services
   */
  private initializeVoiceServices(): void {
    if (typeof window === 'undefined') return;

    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupSpeechRecognition();
    }

    // Check for Speech Synthesis support
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.isSupported = true;
    }

    if (!this.isSupported) {
      console.warn('Voice Assistant: Web Speech API not supported in this browser');
    }
  }

  /**
   * Configure speech recognition settings
   */
  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = true;
    this.recognition.lang = this.settings.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onSpeechStart?.();
      this.callbacks.onStatusChange?.('listening');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onSpeechEnd?.();
      this.callbacks.onStatusChange?.('idle');
    };

    this.recognition.onresult = (event) => {
      this.callbacks.onStatusChange?.('processing');
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const command: VoiceCommand = {
            command: result[0].transcript.trim(),
            confidence: result[0].confidence,
            timestamp: new Date(),
          };

          this.processVoiceCommand(command);
        }
      }
    };

    this.recognition.onerror = (event) => {
      const errorMessage = this.getErrorMessage(event.error);
      console.error('Speech Recognition Error:', event.error, errorMessage);
      this.callbacks.onError?.(errorMessage);
      this.callbacks.onStatusChange?.('idle');
      this.isListening = false;
    };
  }

  /**
   * Process recognized voice command
   */
  private processVoiceCommand(command: VoiceCommand): void {
    const processedCommand = this.parseCommand(command.command);
    const enhancedCommand = { ...command, ...processedCommand };
    
    this.callbacks.onCommandRecognized?.(enhancedCommand);
  }

  /**
   * Parse voice command to extract action and parameters
   */
  private parseCommand(commandText: string): { action?: string; parameters?: Record<string, any> } {
    const lowerCommand = commandText.toLowerCase();

    // Exercise search commands
    if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      if (lowerCommand.includes('exercise')) {
        return {
          action: 'search_exercises',
          parameters: { query: this.extractSearchQuery(lowerCommand) }
        };
      }
    }

    // Workout commands
    if (lowerCommand.includes('start workout') || lowerCommand.includes('begin workout')) {
      return { action: 'start_workout' };
    }

    if (lowerCommand.includes('stop workout') || lowerCommand.includes('end workout')) {
      return { action: 'stop_workout' };
    }

    if (lowerCommand.includes('next exercise')) {
      return { action: 'next_exercise' };
    }

    if (lowerCommand.includes('previous exercise')) {
      return { action: 'previous_exercise' };
    }

    // Timer commands
    if (lowerCommand.includes('start timer')) {
      const duration = this.extractDuration(lowerCommand);
      return { action: 'start_timer', parameters: { duration } };
    }

    if (lowerCommand.includes('stop timer') || lowerCommand.includes('pause timer')) {
      return { action: 'stop_timer' };
    }

    // Navigation commands
    if (lowerCommand.includes('go to') || lowerCommand.includes('navigate to')) {
      const page = this.extractNavigationTarget(lowerCommand);
      return { action: 'navigate', parameters: { page } };
    }

    // Help commands
    if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      return { action: 'show_help' };
    }

    return { action: 'unknown_command' };
  }

  /**
   * Extract search query from voice command
   */
  private extractSearchQuery(command: string): string {
    const patterns = [
      /search (?:for )?(.+)/i,
      /find (?:me )?(.+)/i,
      /show (?:me )?(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        return match[1].replace(/exercise[s]?/i, '').trim();
      }
    }

    return '';
  }

  /**
   * Extract duration from timer commands
   */
  private extractDuration(command: string): number {
    const match = command.match(/(\d+)\s*(second[s]?|minute[s]?|hour[s]?)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('minute')) return value * 60;
      if (unit.startsWith('hour')) return value * 3600;
      return value; // seconds
    }
    return 30; // default 30 seconds
  }

  /**
   * Extract navigation target from command
   */
  private extractNavigationTarget(command: string): string {
    const targets = ['exercises', 'workouts', 'diet', 'progress', 'profile', 'chat'];
    const lowerCommand = command.toLowerCase();
    
    for (const target of targets) {
      if (lowerCommand.includes(target)) {
        return target;
      }
    }
    
    return 'home';
  }

  /**
   * Start listening for voice commands
   */
  startListening(): boolean {
    if (!this.isSupported || !this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.callbacks.onError?.('Failed to start voice recognition');
      return false;
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak text using text-to-speech
   */
  speak(text: string, options?: Partial<VoiceSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Text-to-speech not supported'));
        return;
      }

      // Cancel any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply settings
      utterance.rate = options?.rate ?? this.settings.rate;
      utterance.pitch = options?.pitch ?? this.settings.pitch;
      utterance.volume = options?.volume ?? this.settings.volume;
      utterance.lang = options?.language ?? this.settings.language;

      if (options?.voice || this.settings.voice) {
        utterance.voice = options?.voice ?? this.settings.voice!;
      }

      utterance.onstart = () => {
        this.callbacks.onStatusChange?.('speaking');
      };

      utterance.onend = () => {
        this.callbacks.onStatusChange?.('idle');
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.callbacks.onStatusChange?.('idle');
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
      this.callbacks.onStatusChange?.('idle');
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Update voice settings
   */
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.recognition) {
      this.recognition.continuous = this.settings.continuous;
      this.recognition.lang = this.settings.language;
    }
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: VoiceAssistantCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current settings
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Check if voice assistant is supported
   */
  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get error message from speech recognition error
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech was detected. Please try again.',
      'audio-capture': 'Audio capture failed. Please check your microphone.',
      'not-allowed': 'Microphone access was denied. Please allow microphone access.',
      'network': 'Network error occurred. Please check your connection.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported': 'Language not supported.',
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }
}

// Export singleton instance
export const voiceAssistantService = new VoiceAssistantService();