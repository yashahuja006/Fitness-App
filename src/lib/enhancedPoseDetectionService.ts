/**
 * Enhanced Pose Detection Service
 * Integrates Web Worker-based angle calculations with existing pose detection
 */

import type { PoseLandmark } from '@/types/pose';
import type { ExerciseAngles } from '@/types/advancedPose';
import { calculateExerciseAngles, webWorkerManager } from './webWorkerManager';

export interface EnhancedPoseDetectionResult {
  landmarks: PoseLandmark[];
  angles: ExerciseAngles;
  timestamp: number;
  processingTime: number;
}

export class EnhancedPoseDetectionService {
  private isInitialized = false;

  /**
   * Initialize the enhanced pose detection service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Web Worker for angle calculations
      await webWorkerManager.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize Web Worker, falling back to main thread calculations:', error);
      this.isInitialized = true; // Still mark as initialized since fallback will work
    }
  }

  /**
   * Process pose landmarks and calculate angles
   */
  async processPoseLandmarks(landmarks: PoseLandmark[]): Promise<EnhancedPoseDetectionResult> {
    const startTime = performance.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Calculate angles using Web Worker (with automatic fallback)
      const angles = await calculateExerciseAngles(landmarks);
      
      const processingTime = performance.now() - startTime;

      return {
        landmarks,
        angles,
        timestamp: Date.now(),
        processingTime
      };
    } catch (error) {
      throw new Error(`Failed to process pose landmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    workerStatus: ReturnType<typeof webWorkerManager.getStatus>;
  } {
    return {
      isInitialized: this.isInitialized,
      workerStatus: webWorkerManager.getStatus()
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await webWorkerManager.terminate();
    this.isInitialized = false;
  }
}

// Singleton instance for global use - commented out to prevent MediaPipe errors
// export const enhancedPoseDetectionService = new EnhancedPoseDetectionService();

// Export the class for manual instantiation when needed
export { EnhancedPoseDetectionService };