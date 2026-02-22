/**
 * Property-Based Tests for Voice Assistant System
 * Feature: fitness-app
 * 
 * Tests the correctness properties of the voice assistant system including
 * voice system activation, command processing, audio guidance delivery, and error handling.
 */

import * as fc from 'fast-check';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceAssistant } from '../VoiceAssistant';
import { voiceAssistantService, VoiceCommand, VoiceSettings } from '@/lib/voiceAssistantService';
import { TEST_CONFIG } from '@/__tests__/config/testConfig';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn(() => []),
  onvoiceschanged: null,
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: 'en-US',
  voice: null,
  onstart: null,
  onend: null,
  onerror: null,
}));

// Setup global mocks
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition),
});

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: mockSpeechSynthesisUtterance,
});

// Test data generators
const voiceCommandArbitrary = fc.record({
  command: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A')),
  confidence: fc.float({ min: 0, max: 1 }),
  timestamp: fc.date(),
  action: fc.option(fc.constantFrom(
    'search_exercises',
    'start_workout',
    'stop_workout',
    'next_exercise',
    'previous_exercise',
    'start_timer',
    'stop_timer',
    'navigate',
    'show_help',
    'unknown_command'
  ), { nil: undefined }),
  parameters: fc.option(fc.record({
    query: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    duration: fc.option(fc.integer({ min: 1, max: 3600 }), { nil: undefined }),
    page: fc.option(fc.constantFrom('exercises', 'workouts', 'diet', 'profile'), { nil: undefined }),
  }), { nil: undefined }),
}) as fc.Arbitrary<VoiceCommand>;

const voiceSettingsArbitrary = fc.record({
  enabled: fc.boolean(),
  language: fc.constantFrom('en-US', 'en-GB', 'es-ES', 'fr-FR'),
  voice: fc.option(fc.record({
    name: fc.string({ minLength: 5, maxLength: 30 }),
    lang: fc.constantFrom('en-US', 'en-GB', 'es-ES', 'fr-FR'),
  }), { nil: undefined }),
  rate: fc.float({ min: 0.5, max: 2.0 }),
  pitch: fc.float({ min: 0.5, max: 2.0 }),
  volume: fc.float({ min: 0, max: 1 }),
  continuous: fc.boolean(),
}) as fc.Arbitrary<VoiceSettings>;

const speechErrorArbitrary = fc.constantFrom(
  'no-speech',
  'audio-capture',
  'not-allowed',
  'network',
  'service-not-allowed',
  'bad-grammar',
  'language-not-supported'
);

describe('Voice Assistant Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    
    // Reset voice assistant service
    voiceAssistantService.stopListening();
    voiceAssistantService.stopSpeaking();
    
    // Reset mock implementations
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis.getVoices.mockReturnValue([]);
  });

  /**
   * **Property 12: Voice System Activation**
   * **Validates: Requirements 4.1**
   * 
   * For any user enabling voice mode, the voice assistant should successfully 
   * activate speech-to-text recognition and be ready to process voice commands.
   */
  describe('Property 12: Voice System Activation', () => {
    it('should successfully activate voice system when user enables voice mode', () => {
      fc.assert(
        fc.property(
          voiceSettingsArbitrary,
          (settings) => {
            // Render voice assistant component
            render(<VoiceAssistant />);
            
            // Mock successful speech recognition support
            mockSpeechRecognition.start.mockReturnValue(undefined);
            
            // Find and click the voice activation button
            const voiceButton = screen.getByRole('button');
            expect(voiceButton).toBeInTheDocument();
            
            // Activate voice mode
            fireEvent.click(voiceButton);
            
            // Voice system should attempt to start listening
            expect(mockSpeechRecognition.start).toHaveBeenCalled();
            
            // Component should show listening state
            expect(screen.getByText(/listening/i)).toBeInTheDocument();
          }
        ),
        { numRuns: TEST_CONFIG.PBT.DEFAULT.numRuns }
      );
    });

    it('should handle voice system initialization with different settings', () => {
      fc.assert(
        fc.property(
          voiceSettingsArbitrary,
          (settings) => {
            // Update voice settings
            voiceAssistantService.updateSettings(settings);
            
            // Render component
            render(<VoiceAssistant />);
            
            // Voice system should be properly configured
            const currentSettings = voiceAssistantService.getSettings();
            expect(currentSettings.enabled).toBe(settings.enabled);
            expect(currentSettings.language).toBe(settings.language);
            expect(currentSettings.rate).toBe(settings.rate);
            expect(currentSettings.pitch).toBe(settings.pitch);
            expect(currentSettings.volume).toBe(settings.volume);
            expect(currentSettings.continuous).toBe(settings.continuous);
          }
        ),
        { numRuns: TEST_CONFIG.PBT.DEFAULT.numRuns }
      );
    });

    it('should provide fallback when voice system is not supported', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Mock unsupported browser
            Object.defineProperty(window, 'SpeechRecognition', {
              writable: true,
              value: undefined,
            });
            Object.defineProperty(window, 'webkitSpeechRecognition', {
              writable: true,
              value: undefined,
            });
            Object.defineProperty(window, 'speechSynthesis', {
              writable: true,
              value: undefined,
            });
            
            // Render component
            render(<VoiceAssistant />);
            
            // Should show unsupported message
            expect(screen.getByText(/voice assistant is not supported/i)).toBeInTheDocument();
            
            // Should not show voice controls
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Property 13: Voice Command Processing**
   * **Validates: Requirements 4.2**
   * 
   * For any valid voice command received, the system should correctly interpret 
   * and execute the appropriate action (start timer, skip exercise, etc.).
   */
  describe('Property 13: Voice Command Processing', () => {
    it('should correctly process and execute voice commands', () => {
      fc.assert(
        fc.property(
          voiceCommandArbitrary,
          (command) => {
            const mockOnCommand = jest.fn();
            
            // Render component with command handler
            render(<VoiceAssistant onCommand={mockOnCommand} />);
            
            // Simulate voice command recognition
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Command handler should be called
            expect(mockOnCommand).toHaveBeenCalledWith(command);
            
            // Should not throw during command processing
            expect(() => {
              if (callbacks.onCommandRecognized) {
                callbacks.onCommandRecognized(command);
              }
            }).not.toThrow();
          }
        ),
        { numRuns: TEST_CONFIG.PBT.DEFAULT.numRuns }
      );
    });

    it('should handle navigation commands correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            command: fc.constantFrom(
              'go to exercises',
              'navigate to workouts',
              'go to diet',
              'navigate to profile'
            ),
            confidence: fc.float({ min: 0.5, max: 1 }),
            timestamp: fc.date(),
            action: fc.constant('navigate'),
            parameters: fc.record({
              page: fc.constantFrom('exercises', 'workouts', 'diet', 'profile'),
            }),
          }),
          (command) => {
            render(<VoiceAssistant />);
            
            // Process navigation command
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Should trigger navigation
            waitFor(() => {
              expect(mockPush).toHaveBeenCalled();
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle workout control commands', () => {
      fc.assert(
        fc.property(
          fc.record({
            command: fc.constantFrom(
              'start workout',
              'stop workout',
              'next exercise',
              'previous exercise'
            ),
            confidence: fc.float({ min: 0.5, max: 1 }),
            timestamp: fc.date(),
            action: fc.constantFrom('start_workout', 'stop_workout', 'next_exercise', 'previous_exercise'),
          }),
          (command) => {
            render(<VoiceAssistant />);
            
            // Process workout command
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Should provide audio feedback
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle timer commands with parameters', () => {
      fc.assert(
        fc.property(
          fc.record({
            command: fc.string({ minLength: 10, maxLength: 30 }),
            confidence: fc.float({ min: 0.5, max: 1 }),
            timestamp: fc.date(),
            action: fc.constantFrom('start_timer', 'stop_timer'),
            parameters: fc.option(fc.record({
              duration: fc.integer({ min: 10, max: 300 }),
            }), { nil: undefined }),
          }),
          (command) => {
            render(<VoiceAssistant />);
            
            // Process timer command
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Should provide appropriate feedback
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            
            // Should handle both start and stop timer commands
            const spokenText = mockSpeechSynthesis.speak.mock.calls[0][0].text;
            if (command.action === 'start_timer') {
              expect(spokenText).toMatch(/starting timer/i);
            } else if (command.action === 'stop_timer') {
              expect(spokenText).toMatch(/timer stopped/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Property 14: Audio Guidance Delivery**
   * **Validates: Requirements 4.3**
   * 
   * For any workout scenario requiring guidance, the voice assistant should 
   * provide appropriate text-to-speech instructions and encouragement.
   */
  describe('Property 14: Audio Guidance Delivery', () => {
    it('should deliver audio guidance for all command types', () => {
      fc.assert(
        fc.property(
          voiceCommandArbitrary,
          (command) => {
            render(<VoiceAssistant />);
            
            // Process command that should trigger audio guidance
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Should provide audio feedback for recognized commands
            if (command.action && command.action !== 'unknown_command') {
              expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: TEST_CONFIG.PBT.DEFAULT.numRuns }
      );
    });

    it('should provide help guidance when requested', () => {
      fc.assert(
        fc.property(
          fc.record({
            command: fc.constantFrom('help', 'what can you do', 'show help'),
            confidence: fc.float({ min: 0.5, max: 1 }),
            timestamp: fc.date(),
            action: fc.constant('show_help'),
          }),
          (command) => {
            render(<VoiceAssistant />);
            
            // Process help command
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Should provide comprehensive help guidance
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            const spokenText = mockSpeechSynthesis.speak.mock.calls[0][0].text;
            expect(spokenText).toMatch(/help/i);
            expect(spokenText.length).toBeGreaterThan(50); // Should be comprehensive
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle text-to-speech with different voice settings', () => {
      fc.assert(
        fc.property(
          voiceSettingsArbitrary,
          fc.string({ minLength: 10, maxLength: 100 }),
          (settings, text) => {
            // Update voice settings
            voiceAssistantService.updateSettings(settings);
            
            // Test direct speech synthesis
            const speakPromise = voiceAssistantService.speak(text);
            
            // Should call speech synthesis
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            
            // Should apply correct settings
            const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
            expect(utterance.rate).toBe(settings.rate);
            expect(utterance.pitch).toBe(settings.pitch);
            expect(utterance.volume).toBe(settings.volume);
            expect(utterance.lang).toBe(settings.language);
            
            // Should not throw
            expect(speakPromise).resolves.not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should provide status updates during voice operations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('listening', 'processing', 'speaking', 'idle'),
          (status) => {
            render(<VoiceAssistant />);
            
            // Simulate status change
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onStatusChange) {
              callbacks.onStatusChange(status);
            }
            
            // Should display appropriate status
            expect(screen.getByText(new RegExp(status, 'i'))).toBeInTheDocument();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * **Property 15: Voice Recognition Error Handling**
   * **Validates: Requirements 4.4, 4.5**
   * 
   * For any voice recognition failure due to background noise or other issues, 
   * the system should request repetition or offer alternative input methods 
   * while maintaining full functionality.
   */
  describe('Property 15: Voice Recognition Error Handling', () => {
    it('should handle speech recognition errors gracefully', () => {
      fc.assert(
        fc.property(
          speechErrorArbitrary,
          (errorType) => {
            render(<VoiceAssistant />);
            
            // Simulate speech recognition error
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onError) {
              callbacks.onError(`Speech recognition error: ${errorType}`);
            }
            
            // Should provide error feedback
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            
            // Should maintain component functionality
            const voiceButton = screen.getByRole('button');
            expect(voiceButton).toBeInTheDocument();
            expect(voiceButton).not.toBeDisabled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain full functionality when voice features fail', () => {
      fc.assert(
        fc.property(
          fc.constant('voice-failure'),
          () => {
            // Mock speech recognition failure
            mockSpeechRecognition.start.mockImplementation(() => {
              throw new Error('Speech recognition failed');
            });
            
            render(<VoiceAssistant />);
            
            // Try to activate voice
            const voiceButton = screen.getByRole('button');
            fireEvent.click(voiceButton);
            
            // Should handle error gracefully
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            
            // Component should remain functional
            expect(voiceButton).toBeInTheDocument();
            expect(screen.getByText(/ready/i)).toBeInTheDocument();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide alternative input methods when voice fails', () => {
      fc.assert(
        fc.property(
          fc.constant('microphone-denied'),
          () => {
            render(<VoiceAssistant />);
            
            // Simulate microphone permission denied
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onError) {
              callbacks.onError('Microphone access was denied. Please allow microphone access.');
            }
            
            // Should provide helpful error message
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            const spokenText = mockSpeechSynthesis.speak.mock.calls[0][0].text;
            expect(spokenText).toMatch(/microphone|permission/i);
            
            // Should show alternative interaction methods
            expect(screen.getByText(/settings/i)).toBeInTheDocument();
            expect(screen.getByText(/test voice/i)).toBeInTheDocument();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle unknown commands with helpful suggestions', () => {
      fc.assert(
        fc.property(
          fc.record({
            command: fc.string({ minLength: 5, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'X')),
            confidence: fc.float({ min: 0, max: 0.5 }), // Low confidence
            timestamp: fc.date(),
            action: fc.constant('unknown_command'),
          }),
          (command) => {
            render(<VoiceAssistant />);
            
            // Process unknown command
            const callbacks = voiceAssistantService['callbacks'];
            if (callbacks.onCommandRecognized) {
              callbacks.onCommandRecognized(command);
            }
            
            // Should provide helpful response
            expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
            const spokenText = mockSpeechSynthesis.speak.mock.calls[0][0].text;
            expect(spokenText).toMatch(/didn't understand|try again|help/i);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should recover from speech synthesis errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (text) => {
            // Mock speech synthesis error
            mockSpeechSynthesis.speak.mockImplementation((utterance) => {
              if (utterance.onerror) {
                utterance.onerror({ error: 'synthesis-failed' });
              }
            });
            
            // Test speech synthesis with error
            const speakPromise = voiceAssistantService.speak(text);
            
            // Should handle error gracefully
            expect(speakPromise).rejects.toThrow();
            
            // Should reset state after error
            expect(voiceAssistantService.getIsListening()).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // Cleanup after tests
  afterEach(() => {
    // Stop any ongoing voice operations
    voiceAssistantService.stopListening();
    voiceAssistantService.stopSpeaking();
    
    // Reset voice configuration to defaults
    voiceAssistantService.updateSettings({
      enabled: false,
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      continuous: false,
    });
    
    // Restore original Web Speech API mocks
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockSpeechRecognition),
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockSpeechRecognition),
    });
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });
  });
});