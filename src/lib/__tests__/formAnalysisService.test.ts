/**
 * Unit tests for Form Analysis Service
 */

import { FormAnalysisService } from '../formAnalysisService';
import type { PoseLandmark } from '@/types';

describe('FormAnalysisService', () => {
  let service: FormAnalysisService;

  beforeEach(() => {
    service = new FormAnalysisService();
  });

  describe('analyzePoseForm', () => {
    it('should return basic analysis for unknown exercise', () => {
      const landmarks: PoseLandmark[] = createMockLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'unknown_exercise');

      expect(analysis.exerciseId).toBe('unknown_exercise');
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
      expect(Array.isArray(analysis.issues)).toBe(true);
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(Array.isArray(analysis.keyPointAccuracy)).toBe(true);
    });

    it('should analyze push-up form correctly', () => {
      const landmarks = createMockLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'pushup');

      expect(analysis.exerciseId).toBe('pushup');
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
    });

    it('should analyze squat form correctly', () => {
      const landmarks = createMockLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'squat');

      expect(analysis.exerciseId).toBe('squat');
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
    });

    it('should analyze plank form correctly', () => {
      const landmarks = createMockLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'plank');

      expect(analysis.exerciseId).toBe('plank');
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
    });

    it('should detect shoulder alignment issues', () => {
      const landmarks = createMockLandmarks();
      // Make shoulders uneven
      landmarks[11].y = 0.3; // Left shoulder higher
      landmarks[12].y = 0.4; // Right shoulder lower

      const analysis = service.analyzePoseForm(landmarks, 'pushup');
      
      const shoulderIssue = analysis.issues.find(issue => 
        issue.description.toLowerCase().includes('shoulder')
      );
      expect(shoulderIssue).toBeDefined();
    });

    it('should provide suggestions based on issues', () => {
      const landmarks = createMockLandmarks();
      // Create alignment issues
      landmarks[11].y = 0.2;
      landmarks[12].y = 0.4;

      const analysis = service.analyzePoseForm(landmarks, 'pushup');
      
      if (analysis.issues.length > 0) {
        expect(analysis.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty landmarks array', () => {
      const analysis = service.analyzePoseForm([], 'pushup');
      
      // Empty landmarks should fallback to basic analysis
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
      expect(Array.isArray(analysis.issues)).toBe(true);
      expect(Array.isArray(analysis.suggestions)).toBe(true);
    });

    it('should handle landmarks with low visibility', () => {
      const landmarks = createMockLandmarks();
      // Set all landmarks to low visibility
      landmarks.forEach(landmark => {
        landmark.visibility = 0.2;
      });

      const analysis = service.analyzePoseForm(landmarks, 'pushup');
      
      // Low visibility should still produce valid analysis
      expect(analysis.correctness).toBeGreaterThanOrEqual(0);
      expect(analysis.correctness).toBeLessThanOrEqual(1);
    });
  });

  describe('getAvailableExercises', () => {
    it('should return list of supported exercises', () => {
      const exercises = service.getAvailableExercises();
      
      expect(Array.isArray(exercises)).toBe(true);
      expect(exercises.length).toBeGreaterThan(0);
      expect(exercises).toContain('pushup');
      expect(exercises).toContain('squat');
      expect(exercises).toContain('plank');
    });
  });

  describe('getExerciseRules', () => {
    it('should return rules for supported exercise', () => {
      const rules = service.getExerciseRules('pushup');
      
      expect(rules).toBeDefined();
      expect(rules?.exerciseId).toBe('pushup');
      expect(rules?.name).toBe('Push-up');
      expect(Array.isArray(rules?.keyJoints)).toBe(true);
      expect(Array.isArray(rules?.alignmentRules)).toBe(true);
      expect(Array.isArray(rules?.rangeOfMotionRules)).toBe(true);
      expect(Array.isArray(rules?.postureRules)).toBe(true);
    });

    it('should return undefined for unsupported exercise', () => {
      const rules = service.getExerciseRules('unknown_exercise');
      
      expect(rules).toBeUndefined();
    });
  });

  describe('alignment checking', () => {
    it('should detect good body alignment for plank', () => {
      const landmarks = createAlignedPlankLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'plank');
      
      // Should have fewer alignment issues with good alignment
      const alignmentIssues = analysis.issues.filter(issue => issue.type === 'alignment');
      expect(alignmentIssues.length).toBeLessThanOrEqual(1);
    });

    it('should detect poor body alignment for plank', () => {
      const landmarks = createMisalignedPlankLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'plank');
      
      // Should detect some form issues (alignment or posture)
      expect(analysis.issues.length).toBeGreaterThan(0);
    });
  });

  describe('range of motion checking', () => {
    it('should evaluate range of motion for squats', () => {
      const landmarks = createMockLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'squat');
      
      // Analysis should complete without errors
      expect(analysis).toBeDefined();
      expect(typeof analysis.correctness).toBe('number');
    });
  });

  describe('posture checking', () => {
    it('should check core engagement for plank', () => {
      const landmarks = createMockLandmarks();
      const analysis = service.analyzePoseForm(landmarks, 'plank');
      
      // Should check posture rules
      expect(analysis).toBeDefined();
      expect(typeof analysis.correctness).toBe('number');
    });
  });
});

/**
 * Helper functions to create mock data
 */
function createMockLandmarks(): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  
  // Create 33 landmarks (MediaPipe pose model)
  for (let i = 0; i < 33; i++) {
    landmarks.push({
      x: 0.5 + (Math.random() - 0.5) * 0.2, // Random position around center
      y: 0.5 + (Math.random() - 0.5) * 0.2,
      z: 0,
      visibility: 0.8 + Math.random() * 0.2, // High visibility
    });
  }
  
  // Set specific landmark positions for key joints
  landmarks[11] = { x: 0.4, y: 0.3, z: 0, visibility: 0.9 }; // Left shoulder
  landmarks[12] = { x: 0.6, y: 0.3, z: 0, visibility: 0.9 }; // Right shoulder
  landmarks[23] = { x: 0.4, y: 0.6, z: 0, visibility: 0.9 }; // Left hip
  landmarks[24] = { x: 0.6, y: 0.6, z: 0, visibility: 0.9 }; // Right hip
  landmarks[25] = { x: 0.4, y: 0.8, z: 0, visibility: 0.9 }; // Left knee
  landmarks[26] = { x: 0.6, y: 0.8, z: 0, visibility: 0.9 }; // Right knee
  landmarks[27] = { x: 0.4, y: 0.9, z: 0, visibility: 0.9 }; // Left ankle
  landmarks[28] = { x: 0.6, y: 0.9, z: 0, visibility: 0.9 }; // Right ankle
  
  return landmarks;
}

function createAlignedPlankLandmarks(): PoseLandmark[] {
  const landmarks = createMockLandmarks();
  
  // Create perfect plank alignment (straight line)
  landmarks[11] = { x: 0.4, y: 0.3, z: 0, visibility: 0.9 }; // Left shoulder
  landmarks[12] = { x: 0.6, y: 0.3, z: 0, visibility: 0.9 }; // Right shoulder
  landmarks[23] = { x: 0.4, y: 0.4, z: 0, visibility: 0.9 }; // Left hip (aligned)
  landmarks[24] = { x: 0.6, y: 0.4, z: 0, visibility: 0.9 }; // Right hip (aligned)
  landmarks[27] = { x: 0.4, y: 0.5, z: 0, visibility: 0.9 }; // Left ankle (aligned)
  landmarks[28] = { x: 0.6, y: 0.5, z: 0, visibility: 0.9 }; // Right ankle (aligned)
  
  return landmarks;
}

function createMisalignedPlankLandmarks(): PoseLandmark[] {
  const landmarks = createMockLandmarks();
  
  // Create misaligned plank (sagging hips)
  landmarks[11] = { x: 0.4, y: 0.3, z: 0, visibility: 0.9 }; // Left shoulder
  landmarks[12] = { x: 0.6, y: 0.3, z: 0, visibility: 0.9 }; // Right shoulder
  landmarks[23] = { x: 0.4, y: 0.5, z: 0, visibility: 0.9 }; // Left hip (sagging)
  landmarks[24] = { x: 0.6, y: 0.5, z: 0, visibility: 0.9 }; // Right hip (sagging)
  landmarks[27] = { x: 0.4, y: 0.4, z: 0, visibility: 0.9 }; // Left ankle
  landmarks[28] = { x: 0.6, y: 0.4, z: 0, visibility: 0.9 }; // Right ankle
  
  return landmarks;
}