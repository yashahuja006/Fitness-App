/**
 * Web Worker for Angle Calculations
 * Offloads heavy angle computation from the main thread for better performance
 * 
 * Task 16.1: Performance optimization - Web Worker integration
 * Requirements: 8.2, 8.3
 */

import type { PoseLandmark } from '@/types/pose';
import type { Landmark, ExerciseAngles } from '@/types/advancedPose';

// MediaPipe pose landmark indices
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

const MIN_VISIBILITY_THRESHOLD = 0.5;
const ANGLE_PRECISION = 2;

/**
 * Calculate angle between three points using vector mathematics
 */
function calculateAngleBetweenPoints(
  point1: Landmark,
  vertex: Landmark,
  point3: Landmark
): number {
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y,
    z: point1.z - vertex.z,
  };

  const vector2 = {
    x: point3.x - vertex.x,
    y: point3.y - vertex.y,
    z: point3.z - vertex.z,
  };

  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2);
  const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    throw new Error('Cannot calculate angle: zero-length vector detected');
  }

  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const angleRadians = Math.acos(clampedCos);
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

/**
 * Round angle to specified precision
 */
function roundAngle(angle: number): number {
  return Math.round(angle * Math.pow(10, ANGLE_PRECISION)) / Math.pow(10, ANGLE_PRECISION);
}

/**
 * Check if landmark has sufficient visibility
 */
function isValidLandmark(landmark: Landmark): boolean {
  return (
    landmark &&
    typeof landmark.x === 'number' &&
    typeof landmark.y === 'number' &&
    typeof landmark.z === 'number' &&
    typeof landmark.visibility === 'number' &&
    landmark.visibility >= MIN_VISIBILITY_THRESHOLD &&
    !isNaN(landmark.x) &&
    !isNaN(landmark.y) &&
    !isNaN(landmark.z) &&
    isFinite(landmark.x) &&
    isFinite(landmark.y) &&
    isFinite(landmark.z)
  );
}

/**
 * Convert PoseLandmark to Landmark
 */
function convertToLandmark(poseLandmark: PoseLandmark): Landmark {
  return {
    x: poseLandmark.x,
    y: poseLandmark.y,
    z: poseLandmark.z,
    visibility: poseLandmark.visibility,
  };
}

/**
 * Calculate hip-knee-ankle angle
 */
function calculateHipKneeAnkleAngle(
  hip: Landmark,
  knee: Landmark,
  ankle: Landmark
): number {
  if (!isValidLandmark(hip) || !isValidLandmark(knee) || !isValidLandmark(ankle)) {
    throw new Error('Invalid landmarks: insufficient visibility or missing coordinates');
  }

  const angle = calculateAngleBetweenPoints(hip, knee, ankle);
  return roundAngle(angle);
}

/**
 * Calculate shoulder-hip alignment angle
 */
function calculateShoulderHipAlignment(shoulder: Landmark, hip: Landmark): number {
  if (!isValidLandmark(shoulder) || !isValidLandmark(hip)) {
    throw new Error('Invalid landmarks: insufficient visibility or missing coordinates');
  }

  const vertical = { x: shoulder.x, y: shoulder.y + 0.1, z: shoulder.z, visibility: 1.0 };
  const angle = calculateAngleBetweenPoints(vertical, shoulder, hip);
  return roundAngle(angle);
}

/**
 * Calculate nose-shoulder offset angle
 */
function calculateOffsetAngle(
  nose: Landmark,
  leftShoulder: Landmark,
  rightShoulder: Landmark
): number {
  if (!isValidLandmark(nose) || !isValidLandmark(leftShoulder) || !isValidLandmark(rightShoulder)) {
    throw new Error('Invalid landmarks: insufficient visibility or missing coordinates');
  }

  const shoulderMidpoint: Landmark = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
    visibility: Math.min(leftShoulder.visibility, rightShoulder.visibility),
  };

  const horizontal = {
    x: shoulderMidpoint.x + 0.1,
    y: shoulderMidpoint.y,
    z: shoulderMidpoint.z,
    visibility: 1.0,
  };
  const angle = calculateAngleBetweenPoints(horizontal, shoulderMidpoint, nose);
  return roundAngle(angle);
}

/**
 * Extract all exercise angles from landmarks
 */
function extractExerciseAngles(landmarks: PoseLandmark[]): ExerciseAngles {
  if (!landmarks || landmarks.length < 33) {
    throw new Error('Insufficient landmarks: MediaPipe pose requires 33 landmarks');
  }

  const leftHip = convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_HIP]);
  const leftKnee = convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_KNEE]);
  const leftAnkle = convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_ANKLE]);
  const leftShoulder = convertToLandmark(landmarks[POSE_LANDMARKS.LEFT_SHOULDER]);
  const rightShoulder = convertToLandmark(landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]);
  const nose = convertToLandmark(landmarks[POSE_LANDMARKS.NOSE]);

  const kneeAngle = calculateHipKneeAnkleAngle(leftHip, leftKnee, leftAnkle);
  const hipAngle = calculateShoulderHipAlignment(leftShoulder, leftHip);
  const offsetAngle = calculateOffsetAngle(nose, leftShoulder, rightShoulder);

  const virtualFoot: Landmark = {
    x: leftAnkle.x,
    y: leftAnkle.y + 0.05,
    z: leftAnkle.z,
    visibility: leftAnkle.visibility,
  };
  const ankleAngle = calculateAngleBetweenPoints(leftKnee, leftAnkle, virtualFoot);

  return {
    kneeAngle,
    hipAngle,
    ankleAngle: roundAngle(ankleAngle),
    offsetAngle,
  };
}

// Worker message handler
self.onmessage = (event: MessageEvent) => {
  const { type, data, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'extractExerciseAngles':
        result = extractExerciseAngles(data.landmarks);
        break;

      case 'calculateHipKneeAnkleAngle':
        result = calculateHipKneeAnkleAngle(data.hip, data.knee, data.ankle);
        break;

      case 'calculateShoulderHipAlignment':
        result = calculateShoulderHipAlignment(data.shoulder, data.hip);
        break;

      case 'calculateOffsetAngle':
        result = calculateOffsetAngle(data.nose, data.leftShoulder, data.rightShoulder);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({
      id,
      type: 'success',
      result,
    });
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Export empty object for TypeScript
export {};
