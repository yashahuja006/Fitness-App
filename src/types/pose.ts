/**
 * Pose detection types for TensorFlow.js and MediaPipe integration
 * Additional types that extend the base types in index.ts
 */

import type { PoseKeypoint, FormFeedback } from './index';

// Additional pose detection specific types
export interface PoseLandmark extends PoseKeypoint {
  // MediaPipe specific landmark data - extends PoseKeypoint with same structure
}

export interface VisualFeedback {
  type: 'overlay' | 'highlight' | 'arrow' | 'text';
  position: { x: number; y: number };
  color: string;
  message?: string;
  duration?: number;
}

export interface PoseDetectionConfig {
  modelComplexity: 0 | 1 | 2;
  smoothLandmarks: boolean;
  enableSegmentation: boolean;
  smoothSegmentation: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  frameRate: number;
}

export interface PoseDetectionError {
  type: 'camera_access_denied' | 'model_load_failed' | 'detection_failed' | 'unsupported_browser';
  message: string;
  recoverable: boolean;
}

export interface PoseDetectionState {
  isInitialized: boolean;
  isDetecting: boolean;
  hasCamera: boolean;
  error: PoseDetectionError | null;
  currentPose: PoseLandmark[] | null;
  formScore: number;
  feedback: FormFeedback[];
}