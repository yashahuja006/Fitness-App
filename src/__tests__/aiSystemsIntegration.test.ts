/**
 * AI Systems Integration Tests
 * Validates that all AI systems work together seamlessly
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { voiceFeedbackService } from '@/lib/voiceFeedbackService';
import { voiceAssistantService } from '@/lib/voiceAssistantService';
import { geminiService } from '@/lib/geminiService';
import { formAnalysisService } from '@/lib/formAnalysisService';
import type { FormAnalysis, FormScore, PoseLandmark } from '@/types/pose';
import type { VoiceCommand } from '@/lib/voiceAssistantService';

// Mock Web APIs
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
};

const mockSpeechRecognition = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
}));

// Mock Gemini API
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(() => ({
    models: {
      generateContent: jest.fn(() => Promise.resolve({
        text: 'This is a helpful fitness response from the AI assistant.',
      })),
    },
  })),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

describe('AI Systems Integration', () => {
  beforeEach(() => {
    // Setup Web API mocks
    if (typeof window === 'undefined') {
      Object.defineProperty(global, 'window', {
        value: {
          speechSynthesis: mockSpeechSynthesis,
          SpeechRecognition: mockSpeechRecognition,
          webkitSpeechRecognition: mockSpeechRecognition,
        },
        writable: true,
        configurable: true,
      });
    } else {
      // Update existing window object
      Object.assign(window, {
        speechSynthesis: mockSpeechSynthesis,
        SpeechRecognition: mockSpeechRecognition,
        webkitSpeechRecognition: mockSpeechRecognition,
      });
    }

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up services
    voiceFeedbackService.stop();
    voiceAssistantService.stopListening();
    voiceAssistantService.stopSpeaking();
  });

  describe('Pose Detection + Voice Feedback Integration', () => {
    it('should provide voice feedback when form issues are detected', async () => {
      // Mock pose landmarks with poor form
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 }, // nose
        { x: 0.4, y: 0.5, z: 0, visibility: 0.8 }, // left shoulder (misaligned)
        { x: 0.6, y: 0.6, z: 0, visibility: 0.8 }, // right shoulder (misaligned)
        // ... other landmarks would be here
      ];

      // Analyze form
      const formAnalysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'pushup');
      
      // Verify form analysis detected issues
      expect(formAnalysis.issues.length).toBeGreaterThan(0);
      expect(formAnalysis.correctness).toBeLessThan(1.0);

      // Provide voice feedback
      voiceFeedbackService.provideFormFeedback(formAnalysis, 'pushup');

      // Verify voice feedback was triggered
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      // Get the spoken message
      const spokenMessage = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(spokenMessage.text).toBeDefined();
      expect(spokenMessage.text.length).toBeGreaterThan(0);
    });

    it('should provide encouragement for good form', async () => {
      // Mock pose landmarks with good form
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 }, // nose
        { x: 0.45, y: 0.5, z: 0, visibility: 0.9 }, // left shoulder (aligned)
        { x: 0.55, y: 0.5, z: 0, visibility: 0.9 }, // right shoulder (aligned)
        // ... other landmarks would be here
      ];

      // Analyze form
      const formAnalysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'pushup');
      
      // Create a good form score
      const mockFormScore: FormScore = {
        overall: 0.9,
        grade: 'A',
        breakdown: {
          alignment: 0.95,
          posture: 0.9,
          rangeOfMotion: 0.85,
          timing: 0.9,
        },
        strengths: ['Excellent alignment', 'Good posture'],
        improvements: [],
        timestamp: Date.now(),
        exerciseId: 'pushup',
        sessionId: 'test-session',
      };

      // Provide score feedback
      voiceFeedbackService.provideScoreFeedback(mockFormScore, 'pushup');

      // Verify encouraging voice feedback was provided
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      const spokenMessage = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(spokenMessage.text).toMatch(/excellent|great|good|keep it up/i);
    });
  });

  describe('Voice Assistant + Chatbot Integration', () => {
    it('should process voice commands and provide chatbot responses', async () => {
      let capturedCommand: VoiceCommand | null = null;

      // Set up voice assistant callbacks
      voiceAssistantService.setCallbacks({
        onCommandRecognized: (command) => {
          capturedCommand = command;
        },
        onStatusChange: jest.fn(),
        onError: jest.fn(),
      });

      // Simulate voice command recognition
      const mockCommand: VoiceCommand = {
        command: 'search for push up exercises',
        confidence: 0.9,
        timestamp: new Date(),
        action: 'search_exercises',
        parameters: { query: 'push up' },
      };

      // Trigger command processing
      voiceAssistantService.setCallbacks({
        onCommandRecognized: async (command) => {
          capturedCommand = command;
          
          // Process through chatbot
          const sessionId = geminiService.initializeConversation('test-user');
          const response = await geminiService.processMessage(sessionId, command.command);
          
          // Verify chatbot response
          expect(response.role).toBe('assistant');
          expect(response.content).toBeDefined();
          expect(response.content.length).toBeGreaterThan(0);
          
          // Verify response type is appropriate for exercise query
          expect(response.type).toMatch(/exercise_info|exercise_recommendation|text/);
        },
      });

      // Simulate the command being recognized
      const callbacks = voiceAssistantService['callbacks'];
      await callbacks.onCommandRecognized?.(mockCommand);

      expect(capturedCommand).toBeDefined();
      expect(capturedCommand?.action).toBe('search_exercises');
    });

    it('should handle voice navigation commands', async () => {
      const mockNavigationCommand: VoiceCommand = {
        command: 'go to exercises page',
        confidence: 0.85,
        timestamp: new Date(),
        action: 'navigate',
        parameters: { page: 'exercises' },
      };

      let navigationTriggered = false;
      
      voiceAssistantService.setCallbacks({
        onCommandRecognized: async (command) => {
          if (command.action === 'navigate') {
            navigationTriggered = true;
            
            // Provide voice confirmation
            await voiceAssistantService.speak(`Navigating to ${command.parameters?.page}`);
          }
        },
      });

      // Simulate command recognition
      const callbacks = voiceAssistantService['callbacks'];
      await callbacks.onCommandRecognized?.(mockNavigationCommand);

      expect(navigationTriggered).toBe(true);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('Complete Workout Session Integration', () => {
    it('should integrate all AI systems during a workout session', async () => {
      const sessionId = 'integration-test-session';
      const exerciseId = 'pushup';
      
      // Track all AI system interactions
      const interactions = {
        voiceFeedback: [] as string[],
        formAnalyses: [] as FormAnalysis[],
        chatbotResponses: [] as string[],
        voiceCommands: [] as VoiceCommand[],
      };

      // Set up voice feedback tracking
      const originalSpeak = mockSpeechSynthesis.speak;
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        interactions.voiceFeedback.push(utterance.text);
        return originalSpeak(utterance);
      });

      // Set up voice assistant tracking
      voiceAssistantService.setCallbacks({
        onCommandRecognized: (command) => {
          interactions.voiceCommands.push(command);
        },
      });

      // Initialize chatbot session
      const chatSessionId = geminiService.initializeConversation('test-user', {
        fitnessLevel: 'intermediate',
        availableEquipment: ['none'],
        fitnessGoals: ['strength'],
      });

      // Simulate workout session flow
      
      // 1. Session start - voice feedback
      voiceFeedbackService.provideEncouragement('start');
      expect(interactions.voiceFeedback.length).toBeGreaterThan(0);
      expect(interactions.voiceFeedback[0]).toMatch(/start|ready|focus/i);

      // 2. Form analysis during exercise
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 },
        { x: 0.45, y: 0.5, z: 0, visibility: 0.8 },
        { x: 0.55, y: 0.52, z: 0, visibility: 0.8 }, // Slightly misaligned
      ];

      const formAnalysis = formAnalysisService.analyzePoseForm(mockLandmarks, exerciseId);
      interactions.formAnalyses.push(formAnalysis);

      // 3. Voice feedback based on form
      voiceFeedbackService.provideFormFeedback(formAnalysis, exerciseId);
      
      // 4. User asks question via voice
      const voiceQuery: VoiceCommand = {
        command: 'how can I improve my push up form',
        confidence: 0.8,
        timestamp: new Date(),
        action: 'show_help',
      };

      // 5. Process query through chatbot
      const chatResponse = await geminiService.processMessage(
        chatSessionId, 
        voiceQuery.command
      );
      interactions.chatbotResponses.push(chatResponse.content);

      // 6. Provide voice response
      await voiceAssistantService.speak(chatResponse.content);

      // 7. Session completion
      voiceFeedbackService.provideEncouragement('completion');

      // Verify complete integration
      expect(interactions.voiceFeedback.length).toBeGreaterThanOrEqual(3); // Start, form feedback, completion
      expect(interactions.formAnalyses.length).toBe(1);
      expect(interactions.chatbotResponses.length).toBe(1);
      
      // Verify form analysis worked
      expect(formAnalysis.exerciseId).toBe(exerciseId);
      expect(formAnalysis.correctness).toBeGreaterThan(0);
      
      // Verify chatbot provided helpful response
      expect(chatResponse.content).toMatch(/form|push.*up|exercise|improve/i);
      
      // Verify voice feedback was contextual
      const formFeedbackMessages = interactions.voiceFeedback.filter(msg => 
        msg.includes('form') || msg.includes('alignment') || msg.includes('posture')
      );
      expect(formFeedbackMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should gracefully handle voice API failures', async () => {
      // Mock speech synthesis failure
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        utterance.onerror?.({ error: 'synthesis-failed' } as any);
      });

      // Attempt voice feedback
      voiceFeedbackService.provideEncouragement('start');

      // Should not throw error
      expect(() => {
        voiceFeedbackService.testVoice();
      }).not.toThrow();
    });

    it('should handle pose detection failures gracefully', () => {
      // Test with invalid landmarks
      const invalidLandmarks: PoseLandmark[] = [];
      
      const formAnalysis = formAnalysisService.analyzePoseForm(invalidLandmarks, 'pushup');
      
      // Should return basic analysis without crashing
      expect(formAnalysis).toBeDefined();
      expect(formAnalysis.exerciseId).toBe('pushup');
      expect(formAnalysis.correctness).toBeGreaterThanOrEqual(0);
    });

    it('should handle chatbot API failures with fallback responses', async () => {
      // Mock Gemini API failure
      const mockGenAI = {
        models: {
          generateContent: jest.fn(() => Promise.reject(new Error('API Error'))),
        },
      };

      // Override the service's genAI instance
      (geminiService as any).genAI = mockGenAI;

      const sessionId = geminiService.initializeConversation('test-user');
      const response = await geminiService.processMessage(sessionId, 'test query');

      // Should provide fallback response
      expect(response.role).toBe('assistant');
      expect(response.content).toBeDefined();
      expect(response.content).toMatch(/offline|try again|browse/i);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should manage voice feedback queue properly', async () => {
      // Queue multiple messages rapidly
      const messages = [
        'First message',
        'Second message', 
        'Third message',
        'Fourth message',
      ];

      messages.forEach(message => {
        voiceFeedbackService.provideInstructions('test', message);
      });

      // Should queue messages without overwhelming the system
      expect(voiceFeedbackService.getQueueLength()).toBeLessThanOrEqual(messages.length);
      
      // Should process messages in order
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should clean up resources properly', () => {
      // Start various AI systems
      voiceAssistantService.startListening();
      voiceFeedbackService.provideEncouragement('start');
      
      const sessionId = geminiService.initializeConversation('test-user');
      
      // Clean up
      voiceAssistantService.stopListening();
      voiceAssistantService.stopSpeaking();
      voiceFeedbackService.stop();
      geminiService.endConversation(sessionId);

      // Verify cleanup
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(voiceFeedbackService.getQueueLength()).toBe(0);
    });
  });

  describe('Cross-System Data Flow', () => {
    it('should maintain context across AI systems', async () => {
      const userId = 'test-user';
      const exerciseId = 'squat';
      
      // Initialize chatbot with user context
      const chatSessionId = geminiService.initializeConversation(userId, {
        fitnessLevel: 'beginner',
        availableEquipment: ['none'],
        fitnessGoals: ['weight_loss'],
      });

      // User asks about exercise
      const response1 = await geminiService.processMessage(
        chatSessionId, 
        'How do I do a proper squat?'
      );

      // Should provide form guidance
      expect(response1.type).toMatch(/form_guidance|exercise_info/);
      
      // Follow up with voice command
      const voiceCommand: VoiceCommand = {
        command: 'show me squat alternatives',
        confidence: 0.9,
        timestamp: new Date(),
        action: 'search_exercises',
        parameters: { query: 'squat alternatives' },
      };

      // Process through chatbot
      const response2 = await geminiService.processMessage(
        chatSessionId,
        voiceCommand.command
      );

      // Should maintain context and provide relevant alternatives
      expect(response2.type).toMatch(/exercise_recommendation|exercise_info/);
      
      // Verify conversation history is maintained
      const history = geminiService.getConversationHistory(chatSessionId);
      expect(history.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant messages
    });
  });
});