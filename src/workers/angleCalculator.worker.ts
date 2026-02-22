/**
 * Web Worker for Angle Calculations
 * Offloads computationally intensive angle calculations to prevent UI blocking
 */

import type { PoseLandmark } from '@/types/pose';
import type { Landmark, ExerciseAngles } from '@/types/advancedPose';

// MediaPipe pose landmark indices
const POSE_LANDMARKS = {
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

// Worker message types
interface WorkerMessage {
  id: string;
  type: 'CALCULATE_ANGLES' | 'CALCULATE_SINGLE_ANGLE' | 'VALIDATE_LANDMARKS';
  payload: any;
}

interface CalculateAnglesMessage extends WorkerMessage {
  type: 'CALCULATE_ANGLES';
  payload: {
    landmarks: PoseLandmark[];
  };
}

interface CalculateSingleAngleMessage extends WorkerMessage {
  type: 'CALCULATE_SINGLE_ANGLE';
  payload: {
    point1: Landmark;
    vertex: Landmark;
    point3: Landmark;
  };
}

interface ValidateLandmarksMessage extends WorkerMessage {
  type: 'VALIDATE_LANDMARKS';
  payload: {
    landmarks: PoseLandmark[];
  };
}

interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

class AngleCalculatorWorker {
  private static readonly MIN_VISIBILITY_THRESHOLD = 0.5;
  private static readonly ANGLE_PRECISION = 2;

  /**
   * Calculate hip-knee-ankle angle for squat analysis
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
      const virtualFoot: Landmark = {
        x: leftAnkle.x,
        y: leftAnkle.y + 0.05,
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
   * Validate landmark configuration
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

      // Check if landmarks are in reasonable anatomical order
      if (leftHip.y >= leftKnee.y) {
        issues.push('Hip should be above knee in image coordinates');
      }
      if (leftKnee.y >= leftAnkle.y) {
        issues.push('Knee should be above ankle in image coordinates');
      }

      // Check distances between joints
      const hipKneeDistance = this.calculateDistance(leftHip, leftKnee);
      const kneeAnkleDistance = this.calculateDistance(leftKnee, leftAnkle);

      if (hipKneeDistance < 0.05) {
        issues.push('Hip and knee are too close together');
      }
      if (kneeAnkleDistance < 0.05) {
        issues.push('Knee and ankle are too close together');
      }

      // Check proportions
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

  /**
   * Check if landmark has sufficient visibility
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
   * Calculate distance between two landmarks
   */
  private static calculateDistance(landmark1: Landmark, landmark2: Landmark): number {
    const dx = landmark1.x - landmark2.x;
    const dy = landmark1.y - landmark2.y;
    const dz = landmark1.z - landmark2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// Worker message handler
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'CALCULATE_ANGLES':
        const { landmarks } = payload as CalculateAnglesMessage['payload'];
        result = AngleCalculatorWorker.extractExerciseAngles(landmarks);
        break;
        
      case 'CALCULATE_SINGLE_ANGLE':
        const { point1, vertex, point3 } = payload as CalculateSingleAngleMessage['payload'];
        result = AngleCalculatorWorker.calculateAngleBetweenPoints(point1, vertex, point3);
        break;
        
      case 'VALIDATE_LANDMARKS':
        const { landmarks: landmarksToValidate } = payload as ValidateLandmarksMessage['payload'];
        result = AngleCalculatorWorker.validateLandmarkConfiguration(landmarksToValidate);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    const response: WorkerResponse = {
      id,
      success: true,
      data: result
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    self.postMessage(response);
  }
};

// Export types for use in main thread
export type {
  WorkerMessage,
  CalculateAnglesMessage,
  CalculateSingleAngleMessage,
  ValidateLandmarksMessage,
  WorkerResponse
};