/**
 * Integration test for the complete feedback engine system
 */

import { adaptiveFeedbackEngine } from '../adaptiveFeedbackEngine';
import {
  ViolationType,
  Severity,
  ExerciseMode,
  ViewType,
  ExerciseState
} from '@/types/advancedPose';
import type {
  FormViolation,
  ExerciseAngles,
  ViewAnalysis
} from '@/types/advancedPose';

describe('Feedback Engine Integration', () => {
  beforeEach(() => {
    adaptiveFeedbackEngine.reset();
  });

  test('should generate multimodal feedback for form violations', () => {
    const violations: FormViolation[] = [{
      type: ViolationType.KNEE_OVER_TOES,
      severity: Severity.HIGH,
      description: 'Knees extending over toes',
      correctionHint: 'Push hips back more'
    }];

    const currentState: ExerciseState = ExerciseState.S3_DEEP_SQUAT;
    const angles: ExerciseAngles = {
      kneeAngle: 85,
      hipAngle: 45,
      ankleAngle: 90,
      offsetAngle: 10
    };

    const viewAnalysis: ViewAnalysis = {
      viewType: ViewType.OPTIMAL_SIDE,
      offsetAngle: 10,
      confidence: 0.9,
      recommendations: []
    };

    const feedback = adaptiveFeedbackEngine.generateFeedback(
      violations,
      currentState,
      angles,
      viewAnalysis,
      undefined,
      ExerciseMode.BEGINNER
    );

    expect(feedback.audioMessages.length).toBeGreaterThan(0);
    expect(feedback.visualCues.length).toBeGreaterThan(0);
    expect(feedback.shouldSpeak).toBe(true);
    expect(feedback.priority).toBe('high');
  });

  test('should provide audio feedback using Web Speech API', async () => {
    // Mock speechSynthesis for testing
    const mockSpeak = jest.fn();
    const mockCancel = jest.fn();
    
    // Mock the global window object
    global.window = {
      speechSynthesis: {
        speak: mockSpeak,
        cancel: mockCancel,
        speaking: false
      }
    } as any;

    // Create a new instance to pick up the mocked speechSynthesis
    const testEngine = new (require('../adaptiveFeedbackEngine').AdaptiveFeedbackEngine)();

    await testEngine.deliverAudioFeedback(['Test message']);

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
  });

  test('should generate visual feedback cues', () => {
    const violations: FormViolation[] = [{
      type: ViolationType.FORWARD_LEAN,
      severity: Severity.MEDIUM,
      description: 'Excessive forward lean',
      correctionHint: 'Keep chest up'
    }];

    const feedback = adaptiveFeedbackEngine.generateFeedback(
      violations,
      ExerciseState.S2_TRANSITION,
      {
        kneeAngle: 120,
        hipAngle: 60,
        ankleAngle: 90,
        offsetAngle: 5
      },
      {
        viewType: ViewType.OPTIMAL_SIDE,
        offsetAngle: 5,
        confidence: 0.8,
        recommendations: []
      }
    );

    expect(feedback.visualCues).toHaveLength(2); // Rep counter + angle indicator
    expect(feedback.visualCues.some(cue => cue.type === 'rep_counter')).toBe(true);
    expect(feedback.visualCues.some(cue => cue.type === 'angle_indicator')).toBe(true);
  });

  test('should handle camera positioning issues', () => {
    const viewAnalysis: ViewAnalysis = {
      viewType: ViewType.FRONTAL,
      offsetAngle: 85,
      confidence: 0.7,
      recommendations: ['Position yourself to the side of the camera']
    };

    const feedback = adaptiveFeedbackEngine.generateFeedback(
      [],
      ExerciseState.S1_STANDING,
      {
        kneeAngle: 170,
        hipAngle: 10,
        ankleAngle: 90,
        offsetAngle: 85
      },
      viewAnalysis
    );

    expect(feedback.priority).toBe('critical');
    expect(feedback.audioMessages[0]).toContain('side of the camera');
    expect(feedback.visualCues.some(cue => cue.type === 'positioning_guide')).toBe(true);
  });
});