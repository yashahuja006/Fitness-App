/**
 * Advanced Angle Calculator
 * Provides precise angle calculations for biomechanical analysis
 */

import type { PoseLandmark } from '@/types/pose';
import type { Landmark, ExerciseAngles } from '@/types/advancedPose';

// MediaPipe pose landmark indices for reference
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export class AngleCalculator {
  private static readonly MIN_VISIBILITY_THRESHOLD = 0.5;
  private static readonly ANGLE_PRECISION = 2; // decimal places

  /**
   * Calculate hip-knee-ankle angle for squat analysis
   * This is the primary angle for determining squat depth and form
   */
  static calculateHipKneeAnkleAngle(
    hip: Landmark, 
    knee: Landmark, 
    ankle: Landmark
  ): number {
    if (!this.isValidLandmark(hip) || !this.isValidLandmark(knee) || !this.isValidLandmark(ankle)) {
      throw new Error('Invalid landmarks: insufficient visibility or missing coordinates');
    }

    const angle = this.calculateAngleBetweenPoints(hip, knee, ankle);
    return this.roundAngle(angle);
  }

  /**
   * Calculate shoulder-hip alignment angle for posture analysis
   * Used to detect forward/backward lean during exercises
   */
  static calculateShoulderHipAlignment(
    shoulder: Landmark, 
    hip: Landmark
  ): number {
    if (!this.isValidLandmark(shoulder) || !this.isValidLandmark(hip)) {
      throw new Error('Invalid landmarks: insufficient visibility or missing coordinates');
    }

    // Calculate angle with vertical (straight down from shoulder)
    const vertical = { x: shoulder.x, y: shoulder.y + 0.1, z: shoulder.z, visibility: 1.0 };
    const angle = this.calculateAngleBetweenPoints(vertical, shoulder, hip);
    return this.roundAngle(angle);
  }

  /**
   * Calculate nose-shoulder offset angle for camera view detection
   * Used to determine if user is facing sideways (optimal) or frontal
   */
  static calculateOffsetAngle(
    nose: Landmark, 
    leftShoulder: Landmark, 
    rightShoulder: Landmark
  ): number {
    if (!this.isValidLandmark(nose) || !this.isValidLandmark(leftShoulder) || !this.isValidLandmark(rightShoulder)) {
      throw new Error('Invalid landmarks: insufficient visibility or missing coordinates');
    }

    // Calculate shoulder midpoint
    const shoulderMidpoint: Landmark = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2,
      visibility: Math.min(leftShoulder.visibility, rightShoulder.visibility)
    };

    // Calculate angle between nose and shoulder midpoint with horizontal
    const horizontal = { x: shoulderMidpoint.x + 0.1, y: shoulderMidpoint.y, z: shoulderMidpoint.z, visibility: 1.0 };
    const angle = this.calculateAngleBetweenPoints(horizontal, shoulderMidpoint, nose);
    return this.roundAngle(angle);
  }

  /**
   * Calculate angle between three points using vector mathematics
   * Point2 is the vertex of the angle
   */
  static calculateAngleBetweenPoints(
    point1: Landmark, 
    vertex: Landmark, 
    point3: Landmark
  ): number {
    // Create vectors from vertex to each point
    const vector1 = {
      x: point1.x - vertex.x,
      y: point1.y - vertex.y,
      z: point1.z - vertex.z
    };

    const vector2 = {
      x: point3.x - vertex.x,
      y: point3.y - vertex.y,
      z: point3.z - vertex.z
    };

    // Calculate dot product
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      throw new Error('Cannot calculate angle: zero-length vector detected');
    }

    // Calculate cosine of angle
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    
    // Clamp to valid range to handle floating point precision issues
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    
    // Convert to degrees
    const angleRadians = Math.acos(clampedCos);
    const angleDegrees = (angleRadians * 180) / Math.PI;

    return angleDegrees;
  }

  /**
   * Extract exercise-specific angles from pose landmarks
   * Primarily focused on squat analysis but extensible to other exercises
   */
  static extractExerciseAngles(landmarks: PoseLandmark[]): ExerciseAngles {
    if (!landmarks || landmarks.length < 33) {
      throw new Error('Insufficient landmarks: MediaPipe pose requires 33 landmarks');
    }

    try {
      // Extract key landmarks for squat analysis (using left side for consistency)
      const leftHip = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_HIP]);
      const leftKnee = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_KNEE]);
      const leftAnkle = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_ANKLE]);
      const leftShoulder = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_SHOULDER]);
      const rightShoulder = this.convertToLandmark(landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]);
      const nose = this.convertToLandmark(landmarks[POSE_LANDMARKS.NOSE]);

      // Calculate primary angles
      const kneeAngle = this.calculateHipKneeAnkleAngle(leftHip, leftKnee, leftAnkle);
      const hipAngle = this.calculateShoulderHipAlignment(leftShoulder, leftHip);
      const offsetAngle = this.calculateOffsetAngle(nose, leftShoulder, rightShoulder);

      // For ankle angle, calculate shin-foot angle (knee-ankle-foot)
      // Using a virtual foot point slightly below ankle for calculation
      const virtualFoot: Landmark = {
        x: leftAnkle.x,
        y: leftAnkle.y + 0.05, // Slightly below ankle
        z: leftAnkle.z,
        visibility: leftAnkle.visibility
      };
      const ankleAngle = this.calculateAngleBetweenPoints(leftKnee, leftAnkle, virtualFoot);

      return {
        kneeAngle,
        hipAngle,
        ankleAngle: this.roundAngle(ankleAngle),
        offsetAngle
      };
    } catch (error) {
      throw new Error(`Failed to extract exercise angles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate exercise angles for a specific exercise type
   * This method provides exercise-specific angle calculations
   */
  static calculateExerciseAngles(landmarks: PoseLandmark[], exerciseType: string): ExerciseAngles {
    // For now, all exercise types use the same angle extraction
    // This can be extended for exercise-specific calculations
    return this.extractExerciseAngles(landmarks);
  }

  /**
   * Validate if an angle is within reasonable biomechanical limits
   */
  static isValidAngle(angle: number): boolean {
    return !isNaN(angle) && isFinite(angle) && angle >= 0 && angle <= 180;
  }

  /**
   * Check if landmark has sufficient visibility and valid coordinates
   */
  private static isValidLandmark(landmark: Landmark): boolean {
    return (
      landmark &&
      typeof landmark.x === 'number' &&
      typeof landmark.y === 'number' &&
      typeof landmark.z === 'number' &&
      typeof landmark.visibility === 'number' &&
      landmark.visibility >= this.MIN_VISIBILITY_THRESHOLD &&
      !isNaN(landmark.x) &&
      !isNaN(landmark.y) &&
      !isNaN(landmark.z) &&
      isFinite(landmark.x) &&
      isFinite(landmark.y) &&
      isFinite(landmark.z)
    );
  }

  /**
   * Convert MediaPipe PoseLandmark to our Landmark interface
   */
  private static convertToLandmark(poseLandmark: PoseLandmark): Landmark {
    return {
      x: poseLandmark.x,
      y: poseLandmark.y,
      z: poseLandmark.z,
      visibility: poseLandmark.visibility
    };
  }

  /**
   * Round angle to specified precision
   */
  private static roundAngle(angle: number): number {
    return Math.round(angle * Math.pow(10, this.ANGLE_PRECISION)) / Math.pow(10, this.ANGLE_PRECISION);
  }

  /**
   * Calculate distance between two landmarks (useful for validation)
   */
  static calculateDistance(landmark1: Landmark, landmark2: Landmark): number {
    const dx = landmark1.x - landmark2.x;
    const dy = landmark1.y - landmark2.y;
    const dz = landmark1.z - landmark2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Validate landmark configuration for exercise analysis
   * Ensures landmarks are positioned reasonably for human anatomy
   */
  static validateLandmarkConfiguration(landmarks: PoseLandmark[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    try {
      const leftHip = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_HIP]);
      const leftKnee = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_KNEE]);
      const leftAnkle = this.convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_ANKLE]);

      // Check if landmarks are in reasonable anatomical order (hip above knee above ankle)
      if (leftHip.y >= leftKnee.y) {
        issues.push('Hip should be above knee in image coordinates');
      }
      if (leftKnee.y >= leftAnkle.y) {
        issues.push('Knee should be above ankle in image coordinates');
      }

      // Check if distances between joints are reasonable
      const hipKneeDistance = this.calculateDistance(leftHip, leftKnee);
      const kneeAnkleDistance = this.calculateDistance(leftKnee, leftAnkle);

      if (hipKneeDistance < 0.05) {
        issues.push('Hip and knee are too close together');
      }
      if (kneeAnkleDistance < 0.05) {
        issues.push('Knee and ankle are too close together');
      }

      // Check for reasonable proportions (thigh should be roughly similar to shin length)
      const proportionRatio = hipKneeDistance / kneeAnkleDistance;
      if (proportionRatio < 0.5 || proportionRatio > 2.0) {
        issues.push('Unusual body proportions detected - may affect analysis accuracy');
      }

    } catch (error) {
      issues.push(`Landmark validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance for convenience
export const angleCalculator = AngleCalculator;

// Export individual calculation functions for backward compatibility
export function calculateKneeAngle(landmarks: PoseLandmark[]): number | null {
  return angleCalculator.calculateKneeAngle(landmarks);
}

export function calculateHipAngle(landmarks: PoseLandmark[]): number | null {
  return angleCalculator.calculateHipAngle(landmarks);
}

export function calculateOffsetAngle(landmarks: PoseLandmark[]): number | null {
  return angleCalculator.calculateOffsetAngle(landmarks);
}