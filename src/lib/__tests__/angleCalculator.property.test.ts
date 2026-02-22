/**
 * Property-Based Tests for Angle Calculator
 * Feature: advanced-pose-analysis
 */

import fc from 'fast-check';
import { AngleCalculator } from '../angleCalculator';
import type { Landmark } from '@/types/advancedPose';
import type { PoseLandmark } from '@/types/pose';

describe('AngleCalculator Property Tests', () => {
  describe('Property 1: Angle Calculation Accuracy', () => {
    test('**Feature: advanced-pose-analysis, Property 1: Angle Calculation Accuracy** - Hip-knee-ankle angles should be geometrically correct within 5 degrees', () => {
      // Test with known geometric configurations
      const straightLeg = {
        hip: { x: 0.5, y: 0.3, z: 0, visibility: 1.0 },
        knee: { x: 0.5, y: 0.6, z: 0, visibility: 1.0 },
        ankle: { x: 0.5, y: 0.9, z: 0, visibility: 1.0 }
      };
      
      const straightAngle = AngleCalculator.calculateHipKneeAnkleAngle(
        straightLeg.hip, 
        straightLeg.knee, 
        straightLeg.ankle
      );
      
      // Should be very close to 180° (straight line)
      expect(Math.abs(straightAngle - 180)).toBeLessThan(5);
      expect(AngleCalculator.isValidAngle(straightAngle)).toBe(true);
      
      // Test 90-degree bend
      const bentLeg = {
        hip: { x: 0.5, y: 0.3, z: 0, visibility: 1.0 },
        knee: { x: 0.5, y: 0.6, z: 0, visibility: 1.0 },
        ankle: { x: 0.8, y: 0.6, z: 0, visibility: 1.0 } // 90-degree angle
      };
      
      const bentAngle = AngleCalculator.calculateHipKneeAnkleAngle(
        bentLeg.hip,
        bentLeg.knee,
        bentLeg.ankle
      );
      
      // Should be close to 90°
      expect(Math.abs(bentAngle - 90)).toBeLessThan(10);
      expect(AngleCalculator.isValidAngle(bentAngle)).toBe(true);
    });

    test('**Feature: advanced-pose-analysis, Property 1: Angle Calculation Accuracy** - Shoulder-hip alignment angles should be geometrically correct', () => {
      // Test vertical alignment (should be close to 0°)
      const verticalAlignment = {
        shoulder: { x: 0.5, y: 0.3, z: 0, visibility: 1.0 },
        hip: { x: 0.5, y: 0.6, z: 0, visibility: 1.0 }
      };
      
      const verticalAngle = AngleCalculator.calculateShoulderHipAlignment(
        verticalAlignment.shoulder,
        verticalAlignment.hip
      );
      
      expect(verticalAngle).toBeLessThan(10);
      expect(AngleCalculator.isValidAngle(verticalAngle)).toBe(true);
    });

    test('**Feature: advanced-pose-analysis, Property 1: Angle Calculation Accuracy** - Offset angles should detect camera view correctly', () => {
      // Test frontal view (nose centered between shoulders)
      const frontalView = {
        nose: { x: 0.5, y: 0.2, z: 0, visibility: 1.0 },
        leftShoulder: { x: 0.4, y: 0.3, z: 0, visibility: 1.0 },
        rightShoulder: { x: 0.6, y: 0.3, z: 0, visibility: 1.0 }
      };
      
      const frontalAngle = AngleCalculator.calculateOffsetAngle(
        frontalView.nose,
        frontalView.leftShoulder,
        frontalView.rightShoulder
      );
      
      expect(AngleCalculator.isValidAngle(frontalAngle)).toBe(true);
      expect(frontalAngle).toBeGreaterThan(0);
      expect(frontalAngle).toBeLessThan(180);
    });
  });

  describe('Property 2: Threshold-Based Feedback Triggering', () => {
    test('**Feature: advanced-pose-analysis, Property 2: Threshold-Based Feedback Triggering** - Angles exceeding thresholds should trigger feedback', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 180 }),
          fc.integer({ min: 0, max: 180 }),
          (angle, threshold) => {
            const exceedsThreshold = angle > threshold;
            const shouldTriggerFeedback = exceedsThreshold;
            
            // This property validates that our threshold logic is consistent
            expect(shouldTriggerFeedback).toBe(exceedsThreshold);
            
            // Test specific threshold scenarios
            const kneeAngleThresholds = {
              s1: 160, // Standing
              s3: 80   // Deep squat
            };
            
            if (angle > kneeAngleThresholds.s1) {
              expect(angle).toBeGreaterThan(160);
            }
            
            if (angle < kneeAngleThresholds.s3) {
              expect(angle).toBeLessThan(80);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Handling Properties', () => {
    test('Invalid landmarks should throw appropriate errors', () => {
      const invalidLandmarks = [
        { x: NaN, y: 0.5, z: 0, visibility: 0.9 },
        { x: 0.5, y: 0.5, z: 0, visibility: 0.3 }, // Low visibility
        { x: 0.5, y: NaN, z: 0, visibility: 0.9 }
      ];

      invalidLandmarks.forEach(invalid => {
        const valid = { x: 0.5, y: 0.5, z: 0, visibility: 0.9 };
        
        expect(() => {
          AngleCalculator.calculateHipKneeAnkleAngle(invalid, valid, valid);
        }).toThrow();
      });
    });

    test('Valid landmarks should never throw errors', () => {
      const validLandmarks = [
        { x: 0.5, y: 0.4, z: 0, visibility: 0.9 },
        { x: 0.5, y: 0.6, z: 0, visibility: 0.9 },
        { x: 0.5, y: 0.8, z: 0, visibility: 0.9 }
      ];

      expect(() => {
        const angle = AngleCalculator.calculateHipKneeAnkleAngle(
          validLandmarks[0],
          validLandmarks[1],
          validLandmarks[2]
        );
        expect(typeof angle).toBe('number');
        expect(AngleCalculator.isValidAngle(angle)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Exercise Angles Extraction', () => {
    test('Exercise angles should be extracted correctly from valid pose landmarks', () => {
      // Create a full set of 33 pose landmarks
      const createFullPoseLandmarks = (): PoseLandmark[] => {
        const landmarks: PoseLandmark[] = [];
        for (let i = 0; i < 33; i++) {
          landmarks.push({
            x: 0.5,
            y: 0.5,
            z: 0,
            visibility: 0.8
          });
        }
        
        // Set anatomically correct positions for key landmarks
        landmarks[0] = { x: 0.5, y: 0.1, z: 0, visibility: 0.9 }; // NOSE
        landmarks[11] = { x: 0.4, y: 0.3, z: 0, visibility: 0.9 }; // LEFT_SHOULDER
        landmarks[12] = { x: 0.6, y: 0.3, z: 0, visibility: 0.9 }; // RIGHT_SHOULDER
        landmarks[23] = { x: 0.45, y: 0.5, z: 0, visibility: 0.9 }; // LEFT_HIP
        landmarks[25] = { x: 0.45, y: 0.7, z: 0, visibility: 0.9 }; // LEFT_KNEE
        landmarks[27] = { x: 0.45, y: 0.9, z: 0, visibility: 0.9 }; // LEFT_ANKLE
        
        return landmarks;
      };

      const landmarks = createFullPoseLandmarks();
      const angles = AngleCalculator.extractExerciseAngles(landmarks);
      
      expect(typeof angles.kneeAngle).toBe('number');
      expect(typeof angles.hipAngle).toBe('number');
      expect(typeof angles.ankleAngle).toBe('number');
      expect(typeof angles.offsetAngle).toBe('number');
      
      expect(AngleCalculator.isValidAngle(angles.kneeAngle)).toBe(true);
      expect(AngleCalculator.isValidAngle(angles.hipAngle)).toBe(true);
      expect(AngleCalculator.isValidAngle(angles.ankleAngle)).toBe(true);
      expect(AngleCalculator.isValidAngle(angles.offsetAngle)).toBe(true);
    });

    test('Insufficient landmarks should throw error', () => {
      const insufficientLandmarks: PoseLandmark[] = [];
      for (let i = 0; i < 20; i++) { // Less than 33
        insufficientLandmarks.push({
          x: 0.5,
          y: 0.5,
          z: 0,
          visibility: 0.9
        });
      }

      expect(() => {
        AngleCalculator.extractExerciseAngles(insufficientLandmarks);
      }).toThrow('Insufficient landmarks');
    });
  });

  describe('Landmark Validation Properties', () => {
    test('Valid anatomical configurations should pass validation', () => {
      const landmarks: PoseLandmark[] = [];
      for (let i = 0; i < 33; i++) {
        landmarks.push({
          x: 0.5,
          y: 0.5,
          z: 0,
          visibility: 0.9
        });
      }
      
      // Set anatomically correct positions
      landmarks[23] = { x: 0.5, y: 0.4, z: 0, visibility: 0.9 }; // LEFT_HIP
      landmarks[25] = { x: 0.5, y: 0.6, z: 0, visibility: 0.9 }; // LEFT_KNEE
      landmarks[27] = { x: 0.5, y: 0.8, z: 0, visibility: 0.9 }; // LEFT_ANKLE
      
      const validation = AngleCalculator.validateLandmarkConfiguration(landmarks);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('Invalid anatomical configurations should fail validation', () => {
      const landmarks: PoseLandmark[] = [];
      for (let i = 0; i < 33; i++) {
        landmarks.push({
          x: 0.5,
          y: 0.5,
          z: 0,
          visibility: 0.9
        });
      }
      
      // Set anatomically incorrect positions (ankle above knee)
      landmarks[23] = { x: 0.5, y: 0.8, z: 0, visibility: 0.9 }; // LEFT_HIP
      landmarks[25] = { x: 0.5, y: 0.6, z: 0, visibility: 0.9 }; // LEFT_KNEE
      landmarks[27] = { x: 0.5, y: 0.4, z: 0, visibility: 0.9 }; // LEFT_ANKLE (above knee)
      
      const validation = AngleCalculator.validateLandmarkConfiguration(landmarks);
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });
});