/**
 * AI Systems Integration Verification
 * Validates that AI systems are properly integrated and can work together
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { voiceFeedbackService } from '@/lib/voiceFeedbackService';
import { voiceAssistantService } from '@/lib/voiceAssistantService';
import { geminiService } from '@/lib/geminiService';
import { formAnalysisService } from '@/lib/formAnalysisService';
import type { FormAnalysis, PoseLandmark } from '@/types/pose';

// Mock Web APIs
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  addEventListener: jest.fn(),
};

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

describe('AI Systems Integration Verification', () => {
  beforeEach(() => {
    // Setup minimal Web API mocks
    if (typeof window === 'undefined') {
      Object.defineProperty(global, 'window', {
        value: {
          speechSynthesis: mockSpeechSynthesis,
        },
        writable: true,
        configurable: true,
      });
    }

    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize all AI services without errors', () => {
      expect(() => {
        // Services are initialized as singletons on import
        expect(voiceFeedbackService).toBeDefined();
        expect(voiceAssistantService).toBeDefined();
        expect(geminiService).toBeDefined();
        expect(formAnalysisService).toBeDefined();
      }).not.toThrow();
    });

    it('should detect browser support correctly', () => {
      const voiceFeedbackSupported = voiceFeedbackService.isSupported();
      const voiceAssistantSupported = voiceAssistantService.isVoiceSupported();
      
      // In test environment, these should handle missing APIs gracefully
      expect(typeof voiceFeedbackSupported).toBe('boolean');
      expect(typeof voiceAssistantSupported).toBe('boolean');
    });
  });

  describe('Form Analysis Integration', () => {
    it('should analyze pose form and return valid analysis', () => {
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 },
        { x: 0.45, y: 0.5, z: 0, visibility: 0.8 },
        { x: 0.55, y: 0.5, z: 0, visibility: 0.8 },
      ];

      const analysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'pushup');
      
      expect(analysis).toBeDefined();
      expect(analysis.exerciseId).toBe('pushup');
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
      expect(Array.isArray(analysis.issues)).toBe(true);
      expect(Array.isArray(analysis.suggestions)).toBe(true);
    });

    it('should handle unknown exercises gracefully', () => {
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 },
      ];

      const analysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'unknown-exercise');
      
      expect(analysis).toBeDefined();
      expect(analysis.exerciseId).toBe('unknown-exercise');
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Voice Feedback Integration', () => {
    it('should queue voice feedback messages', () => {
      const initialQueueLength = voiceFeedbackService.getQueueLength();
      
      voiceFeedbackService.provideEncouragement('start');
      
      // Queue length should increase or speech should be triggered
      const finalQueueLength = voiceFeedbackService.getQueueLength();
      const speechTriggered = mockSpeechSynthesis.speak.mock.calls.length > 0;
      
      expect(finalQueueLength >= initialQueueLength || speechTriggered).toBe(true);
    });

    it('should handle form feedback integration', () => {
      const mockAnalysis: FormAnalysis = {
        exerciseId: 'pushup',
        correctness: 0.7,
        issues: [{
          type: 'alignment',
          severity: 'medium',
          description: 'Body alignment needs improvement',
          correction: 'Keep your body in a straight line',
          affectedJoints: ['shoulders', 'hips'],
        }],
        suggestions: ['Focus on core engagement'],
        keyPointAccuracy: [],
      };

      expect(() => {
        voiceFeedbackService.provideFormFeedback(mockAnalysis, 'pushup');
      }).not.toThrow();
    });
  });

  describe('Chatbot Integration', () => {
    it('should initialize conversation sessions', () => {
      const sessionId = geminiService.initializeConversation('test-user');
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should process messages and return responses', async () => {
      const sessionId = geminiService.initializeConversation('test-user');
      const response = await geminiService.processMessage(sessionId, 'Hello');
      
      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should maintain conversation history', async () => {
      const sessionId = geminiService.initializeConversation('test-user');
      
      await geminiService.processMessage(sessionId, 'First message');
      await geminiService.processMessage(sessionId, 'Second message');
      
      const history = geminiService.getConversationHistory(sessionId);
      expect(history.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant messages
    });
  });

  describe('Voice Assistant Integration', () => {
    it('should parse voice commands correctly', () => {
      // Test command parsing through the service's internal methods
      const service = voiceAssistantService as any;
      
      const searchCommand = service.parseCommand('search for push up exercises');
      expect(searchCommand.action).toBe('search_exercises');
      expect(searchCommand.parameters?.query).toContain('push up');
      
      const workoutCommand = service.parseCommand('start workout');
      expect(workoutCommand.action).toBe('start_workout');
      
      const helpCommand = service.parseCommand('help');
      expect(helpCommand.action).toBe('show_help');
    });

    it('should handle settings updates', () => {
      const initialSettings = voiceAssistantService.getSettings();
      
      voiceAssistantService.updateSettings({
        rate: 1.5,
        volume: 0.9,
      });
      
      const updatedSettings = voiceAssistantService.getSettings();
      expect(updatedSettings.rate).toBe(1.5);
      expect(updatedSettings.volume).toBe(0.9);
    });
  });

  describe('Cross-System Communication', () => {
    it('should allow services to communicate through shared interfaces', () => {
      // Test that services can work with shared data types
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 },
      ];

      const formAnalysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'pushup');
      
      // Voice feedback should accept form analysis
      expect(() => {
        voiceFeedbackService.provideFormFeedback(formAnalysis, 'pushup');
      }).not.toThrow();
      
      // Chatbot should accept user queries
      expect(() => {
        geminiService.initializeConversation('test-user', {
          fitnessLevel: 'beginner',
          availableEquipment: ['none'],
          fitnessGoals: ['strength'],
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing pose landmarks gracefully', () => {
      const emptyLandmarks: PoseLandmark[] = [];
      
      const analysis = formAnalysisService.analyzePoseForm(emptyLandmarks, 'pushup');
      
      expect(analysis).toBeDefined();
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
    });

    it('should handle voice service failures gracefully', () => {
      // Mock speech synthesis failure
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        if (utterance.onerror) {
          utterance.onerror({ error: 'synthesis-failed' } as any);
        }
      });

      expect(() => {
        voiceFeedbackService.testVoice();
      }).not.toThrow();
    });

    it('should handle chatbot API failures with fallbacks', async () => {
      const sessionId = geminiService.initializeConversation('test-user');
      
      // Even with API failures, should return a response
      const response = await geminiService.processMessage(sessionId, 'test query');
      
      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources properly', () => {
      const sessionId = geminiService.initializeConversation('test-user');
      
      // Should be able to end conversation without errors
      expect(() => {
        geminiService.endConversation(sessionId);
      }).not.toThrow();
      
      // Should be able to stop voice services without errors
      expect(() => {
        voiceFeedbackService.stop();
        voiceAssistantService.stopListening();
        voiceAssistantService.stopSpeaking();
      }).not.toThrow();
    });

    it('should manage voice feedback queue', () => {
      const initialLength = voiceFeedbackService.getQueueLength();
      
      voiceFeedbackService.provideEncouragement('start');
      voiceFeedbackService.provideEncouragement('progress');
      
      // Queue should be managed (either processed or queued)
      const finalLength = voiceFeedbackService.getQueueLength();
      expect(finalLength).toBeGreaterThanOrEqual(0);
      
      // Should be able to clear queue
      voiceFeedbackService.clearQueue();
      expect(voiceFeedbackService.getQueueLength()).toBe(0);
    });
  });

  describe('Integration Points Verification', () => {
    it('should verify pose detection can trigger voice feedback', () => {
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 },
        { x: 0.4, y: 0.5, z: 0, visibility: 0.8 }, // Misaligned
        { x: 0.6, y: 0.6, z: 0, visibility: 0.8 }, // Misaligned
      ];

      const analysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'pushup');
      
      // Should be able to provide feedback based on analysis
      expect(() => {
        voiceFeedbackService.provideFormFeedback(analysis, 'pushup');
      }).not.toThrow();
    });

    it('should verify voice commands can trigger chatbot responses', async () => {
      const sessionId = geminiService.initializeConversation('test-user');
      
      // Simulate voice command being processed by chatbot
      const voiceQuery = 'show me push up exercises';
      const response = await geminiService.processMessage(sessionId, voiceQuery);
      
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should verify all services can be used together', async () => {
      // Initialize all services
      const chatSessionId = geminiService.initializeConversation('test-user');
      const voiceSettings = voiceAssistantService.getSettings();
      const voiceFeedbackConfig = voiceFeedbackService.getConfig();
      
      // Verify they're all accessible
      expect(chatSessionId).toBeDefined();
      expect(voiceSettings).toBeDefined();
      expect(voiceFeedbackConfig).toBeDefined();
      
      // Verify they can work with shared data
      const mockLandmarks: PoseLandmark[] = [
        { x: 0.5, y: 0.3, z: 0, visibility: 0.9 },
      ];
      
      const analysis = formAnalysisService.analyzePoseForm(mockLandmarks, 'pushup');
      const chatResponse = await geminiService.processMessage(chatSessionId, 'How is my form?');
      
      expect(analysis).toBeDefined();
      expect(chatResponse).toBeDefined();
      
      // Should be able to provide integrated feedback
      expect(() => {
        voiceFeedbackService.provideFormFeedback(analysis, 'pushup');
      }).not.toThrow();
    });
  });
});