/**
 * Voice Coach Service
 * Provides real-time voice feedback for exercise form correction
 */

export interface VoiceCoachOptions {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  voice?: SpeechSynthesisVoice;
}

export class VoiceCoachService {
  private synthesis: SpeechSynthesis;
  private options: VoiceCoachOptions;
  private lastSpokenTime: number = 0;
  private minSpeechInterval: number = 3000; // Minimum 3 seconds between voice feedback
  private isInitialized: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor(options: Partial<VoiceCoachOptions> = {}) {
    this.options = {
      enabled: true,
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      ...options
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.initializeVoices();
    } else {
      console.warn('Speech synthesis not supported in this browser');
      this.options.enabled = false;
    }
  }

  private async initializeVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices();
        
        // Prefer female voices for fitness coaching
        const preferredVoice = this.voices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('zira')
        ) || this.voices.find(voice => voice.lang.startsWith('en')) || this.voices[0];

        if (preferredVoice) {
          this.options.voice = preferredVoice;
        }

        this.isInitialized = true;
        resolve();
      };

      if (this.voices.length > 0) {
        loadVoices();
      } else {
        this.synthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        // Fallback timeout
        setTimeout(loadVoices, 1000);
      }
    });
  }

  public async speak(text: string, priority: boolean = false): Promise<void> {
    if (!this.options.enabled || !text.trim()) return;

    const now = Date.now();
    
    // Skip if not enough time has passed (unless high priority)
    if (!priority && (now - this.lastSpokenTime) < this.minSpeechInterval) {
      return;
    }

    // Cancel current speech if high priority
    if (priority && this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    // Wait for initialization
    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.options.rate;
    utterance.pitch = this.options.pitch;
    utterance.volume = this.options.volume;

    if (this.options.voice) {
      utterance.voice = this.options.voice;
    }

    utterance.onstart = () => {
      this.lastSpokenTime = now;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
    };

    this.synthesis.speak(utterance);
  }

  public stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  public setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public isEnabled(): boolean {
    return this.options.enabled;
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  // Exercise-specific voice feedback
  public getFormFeedback(exerciseId: string, angle: number, stage: string): string {
    const feedbackMap: Record<string, Record<string, string[]>> = {
      'push-ups': {
        'too-high': [
          "Go lower! Get your chest closer to the ground.",
          "Lower your body more for a complete push-up.",
          "Drop down further - you've got this!"
        ],
        'perfect-depth': [
          "Perfect depth! Great form!",
          "Excellent push-up depth!",
          "That's the perfect range - keep it up!"
        ],
        'good-extension': [
          "Great extension! Ready for the next rep.",
          "Perfect push-up! Nice control.",
          "Excellent form - maintain that posture!"
        ],
        'body-alignment': [
          "Keep your body straight like a plank.",
          "Maintain a straight line from head to heels.",
          "Engage your core - stay rigid!"
        ]
      },
      'squats': {
        'too-shallow': [
          "Go deeper! Squat below parallel.",
          "Lower your hips more - you can do it!",
          "Deeper squat for better results!"
        ],
        'perfect-depth': [
          "Perfect squat depth! Excellent form!",
          "Great depth - that's how it's done!",
          "Outstanding squat form!"
        ],
        'good-extension': [
          "Perfect squat! Drive through your heels.",
          "Excellent squat - great power!",
          "Nice squat! Keep that form consistent."
        ],
        'posture': [
          "Keep your chest up and back straight.",
          "Maintain good posture - chest proud!",
          "Great posture - knees tracking over toes!"
        ]
      },
      'bicep-curls': {
        'incomplete-curl': [
          "Curl higher! Bring it all the way up.",
          "Full range of motion - curl to your shoulder!",
          "Higher curl for maximum muscle activation!"
        ],
        'perfect-curl': [
          "Perfect curl! Feel that squeeze!",
          "Excellent bicep contraction!",
          "That's a perfect curl - great control!"
        ],
        'good-extension': [
          "Good extension! Control the weight down.",
          "Perfect lowering - controlled movement!",
          "Excellent control on the negative!"
        ],
        'elbow-stability': [
          "Keep your elbows stable at your sides.",
          "Don't swing - control the movement!",
          "Elbows steady - isolate those biceps!"
        ]
      }
    };

    const exerciseFeedback = feedbackMap[exerciseId];
    if (!exerciseFeedback) return '';

    // Determine feedback category based on exercise and angle
    let category = '';
    
    if (exerciseId === 'push-ups') {
      if (angle < 70) category = 'perfect-depth';
      else if (angle < 90) category = 'perfect-depth';
      else if (angle > 160) category = 'good-extension';
      else if (angle > 100) category = 'too-high';
      else category = 'body-alignment';
    } else if (exerciseId === 'squats') {
      if (angle < 80) category = 'perfect-depth';
      else if (angle < 90) category = 'perfect-depth';
      else if (angle > 160) category = 'good-extension';
      else if (angle > 100) category = 'too-shallow';
      else category = 'posture';
    } else if (exerciseId === 'bicep-curls') {
      if (angle < 40) category = 'perfect-curl';
      else if (angle < 50) category = 'perfect-curl';
      else if (angle > 160) category = 'good-extension';
      else if (angle > 70) category = 'incomplete-curl';
      else category = 'elbow-stability';
    }

    const messages = exerciseFeedback[category];
    if (messages && messages.length > 0) {
      return messages[Math.floor(Math.random() * messages.length)];
    }

    return '';
  }

  // Motivational messages
  public getMotivationalMessage(repCount: number): string {
    const messages = [
      "You're doing great! Keep it up!",
      "Excellent work! Stay focused!",
      "Perfect form! You're crushing it!",
      "Amazing effort! Keep pushing!",
      "Outstanding! Maintain that intensity!",
      "Fantastic! You're getting stronger!",
      "Incredible form! Keep going!",
      "You're on fire! Don't stop now!"
    ];

    if (repCount > 0 && repCount % 5 === 0) {
      return `${repCount} reps! ${messages[Math.floor(Math.random() * messages.length)]}`;
    }

    return '';
  }

  // Encouragement for starting
  public getStartMessage(exerciseId: string): string {
    const exerciseNames: Record<string, string> = {
      'push-ups': 'push-ups',
      'squats': 'squats',
      'bicep-curls': 'bicep curls'
    };

    const messages = [
      `Let's start those ${exerciseNames[exerciseId]}! Focus on perfect form.`,
      `Ready for ${exerciseNames[exerciseId]}? I'll guide you through each rep.`,
      `Time for ${exerciseNames[exerciseId]}! Remember, quality over quantity.`,
      `Let's do this! Perfect ${exerciseNames[exerciseId]} coming up.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Warning messages for poor form
  public getWarningMessage(exerciseId: string): string {
    const warnings: Record<string, string[]> = {
      'push-ups': [
        "Watch your form! Keep your body straight.",
        "Slow down and focus on proper alignment.",
        "Quality over speed - perfect your form first."
      ],
      'squats': [
        "Check your posture! Keep your chest up.",
        "Focus on your form - knees over toes.",
        "Slow and controlled - perfect your technique."
      ],
      'bicep-curls': [
        "Control the movement! Don't use momentum.",
        "Keep those elbows stable at your sides.",
        "Slow and controlled - feel the muscle work."
      ]
    };

    const exerciseWarnings = warnings[exerciseId] || warnings['push-ups'];
    return exerciseWarnings[Math.floor(Math.random() * exerciseWarnings.length)];
  }
}