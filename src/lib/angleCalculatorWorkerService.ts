/**
 * Angle Calculator Worker Service
 * Manages Web Worker for offloading angle calculations
 * 
 * Task 16.1: Performance optimization - Web Worker integration
 * Requirements: 8.2, 8.3
 */

import type { PoseLandmark } from '@/types/pose';
import type { Landmark, ExerciseAngles } from '@/types/advancedPose';

interface WorkerMessage {
  id: string;
  type: string;
  data?: any;
}

interface WorkerResponse {
  id: string;
  type: 'success' | 'error';
  result?: any;
  error?: string;
}

export class AngleCalculatorWorkerService {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  private isInitialized = false;

  /**
   * Initialize the Web Worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create worker from the worker file
      this.worker = new Worker(
        new URL('../workers/angleCalculator.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up message handler
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, result, error } = event.data;
        const pending = this.pendingRequests.get(id);

        if (pending) {
          if (type === 'success') {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error || 'Worker error'));
          }
          this.pendingRequests.delete(id);
        }
      };

      // Set up error handler
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
          reject(new Error('Worker crashed'));
        });
        this.pendingRequests.clear();
      };

      this.isInitialized = true;
      console.log('Angle Calculator Worker initialized');
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      throw new Error('Failed to initialize angle calculator worker');
    }
  }

  /**
   * Send message to worker and wait for response
   */
  private async sendMessage<T>(type: string, data?: any): Promise<T> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    const id = `msg_${this.messageId++}`;

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const message: WorkerMessage = { id, type, data };
      this.worker!.postMessage(message);

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker request timeout'));
        }
      }, 5000); // 5 second timeout
    });
  }

  /**
   * Extract all exercise angles from landmarks (offloaded to worker)
   */
  async extractExerciseAngles(landmarks: PoseLandmark[]): Promise<ExerciseAngles> {
    return this.sendMessage<ExerciseAngles>('extractExerciseAngles', { landmarks });
  }

  /**
   * Calculate hip-knee-ankle angle (offloaded to worker)
   */
  async calculateHipKneeAnkleAngle(
    hip: Landmark,
    knee: Landmark,
    ankle: Landmark
  ): Promise<number> {
    return this.sendMessage<number>('calculateHipKneeAnkleAngle', { hip, knee, ankle });
  }

  /**
   * Calculate shoulder-hip alignment angle (offloaded to worker)
   */
  async calculateShoulderHipAlignment(
    shoulder: Landmark,
    hip: Landmark
  ): Promise<number> {
    return this.sendMessage<number>('calculateShoulderHipAlignment', { shoulder, hip });
  }

  /**
   * Calculate nose-shoulder offset angle (offloaded to worker)
   */
  async calculateOffsetAngle(
    nose: Landmark,
    leftShoulder: Landmark,
    rightShoulder: Landmark
  ): Promise<number> {
    return this.sendMessage<number>('calculateOffsetAngle', { nose, leftShoulder, rightShoulder });
  }

  /**
   * Terminate the worker and clean up resources
   */
  dispose(): void {
    if (this.worker) {
      // Reject all pending requests
      this.pendingRequests.forEach(({ reject }) => {
        reject(new Error('Worker terminated'));
      });
      this.pendingRequests.clear();

      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('Angle Calculator Worker terminated');
    }
  }

  /**
   * Check if worker is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }
}

// Export singleton instance
export const angleCalculatorWorkerService = new AngleCalculatorWorkerService();
