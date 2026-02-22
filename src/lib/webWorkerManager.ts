/**
 * Web Worker Manager
 * Manages Web Worker lifecycle and provides a clean API for angle calculations
 */

import type { PoseLandmark } from '@/types/pose';
import type { Landmark, ExerciseAngles } from '@/types/advancedPose';
import type {
  WorkerMessage,
  WorkerResponse,
  CalculateAnglesMessage,
  CalculateSingleAngleMessage,
  ValidateLandmarksMessage
} from '@/workers/angleCalculator.worker';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class WebWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  /**
   * Initialize the Web Worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.createWorker();
    return this.initializationPromise;
  }

  /**
   * Create and configure the Web Worker
   */
  private async createWorker(): Promise<void> {
    try {
      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers are not supported in this environment');
      }

      // Create worker from the worker file
      this.worker = new Worker(
        new URL('../workers/angleCalculator.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      
      // Set up error handler
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      // Set up unhandled rejection handler
      this.worker.onmessageerror = this.handleWorkerMessageError.bind(this);

      this.isInitialized = true;
      
      // Start cleanup timer for pending requests
      this.startCleanupTimer();
      
    } catch (error) {
      this.isInitialized = false;
      this.initializationPromise = null;
      throw new Error(`Failed to initialize Web Worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle messages from the Web Worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, success, data, error } = event.data;
    
    const pendingRequest = this.pendingRequests.get(id);
    if (!pendingRequest) {
      console.warn(`Received response for unknown request ID: ${id}`);
      return;
    }

    // Remove from pending requests
    this.pendingRequests.delete(id);

    if (success) {
      pendingRequest.resolve(data);
    } else {
      pendingRequest.reject(new Error(error || 'Unknown worker error'));
    }
  }

  /**
   * Handle Web Worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Web Worker error:', error);
    
    // Reject all pending requests
    this.rejectAllPendingRequests(new Error(`Worker error: ${error.message}`));
    
    // Reset state and attempt to restart worker
    this.isInitialized = false;
    this.initializationPromise = null;
    this.worker = null;
    
    // Attempt to restart worker asynchronously
    setTimeout(() => {
      this.initialize().catch(err => {
        console.error('Failed to restart worker after error:', err);
      });
    }, 100);
  }

  /**
   * Handle Web Worker message errors
   */
  private handleWorkerMessageError(error: MessageEvent): void {
    console.error('Web Worker message error:', error);
    
    // Reject all pending requests
    this.rejectAllPendingRequests(new Error('Worker message error'));
  }

  /**
   * Send a message to the Web Worker and return a promise
   */
  private async sendMessage<T>(message: Omit<WorkerMessage, 'id'>): Promise<T> {
    if (!this.isInitialized || !this.worker) {
      await this.initialize();
    }

    const id = `req_${++this.requestCounter}_${Date.now()}`;
    const fullMessage: WorkerMessage = { ...message, id };

    return new Promise<T>((resolve, reject) => {
      // Store the request
      this.pendingRequests.set(id, {
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Send message to worker
      this.worker!.postMessage(fullMessage);
    });
  }

  /**
   * Calculate exercise angles from pose landmarks
   */
  async calculateExerciseAngles(landmarks: PoseLandmark[]): Promise<ExerciseAngles> {
    const message: Omit<CalculateAnglesMessage, 'id'> = {
      type: 'CALCULATE_ANGLES',
      payload: { landmarks }
    };

    return this.sendMessage<ExerciseAngles>(message);
  }

  /**
   * Calculate angle between three points
   */
  async calculateAngleBetweenPoints(
    point1: Landmark,
    vertex: Landmark,
    point3: Landmark
  ): Promise<number> {
    const message: Omit<CalculateSingleAngleMessage, 'id'> = {
      type: 'CALCULATE_SINGLE_ANGLE',
      payload: { point1, vertex, point3 }
    };

    return this.sendMessage<number>(message);
  }

  /**
   * Validate landmark configuration
   */
  async validateLandmarks(landmarks: PoseLandmark[]): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const message: Omit<ValidateLandmarksMessage, 'id'> = {
      type: 'VALIDATE_LANDMARKS',
      payload: { landmarks }
    };

    return this.sendMessage<{ isValid: boolean; issues: string[] }>(message);
  }

  /**
   * Start cleanup timer for timed-out requests
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const timedOutRequests: string[] = [];

      for (const [id, request] of this.pendingRequests.entries()) {
        if (now - request.timestamp > this.REQUEST_TIMEOUT) {
          timedOutRequests.push(id);
          request.reject(new Error('Request timed out'));
        }
      }

      // Remove timed-out requests
      timedOutRequests.forEach(id => this.pendingRequests.delete(id));
      
    }, 1000); // Check every second
  }

  /**
   * Reject all pending requests
   */
  private rejectAllPendingRequests(error: Error): void {
    for (const [id, request] of this.pendingRequests.entries()) {
      request.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Restart the Web Worker
   */
  async restart(): Promise<void> {
    await this.terminate();
    await this.initialize();
  }

  /**
   * Terminate the Web Worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      // Reject all pending requests
      this.rejectAllPendingRequests(new Error('Worker terminated'));
      
      // Terminate worker
      this.worker.terminate();
      this.worker = null;
    }

    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isInitialized: boolean;
    pendingRequests: number;
    isHealthy: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      pendingRequests: this.pendingRequests.size,
      isHealthy: this.isInitialized && this.worker !== null
    };
  }

  /**
   * Check if Web Workers are supported
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }
}

// Singleton instance for global use
export const webWorkerManager = new WebWorkerManager();

// Fallback function for environments without Web Worker support
export async function calculateExerciseAnglesFallback(landmarks: PoseLandmark[]): Promise<ExerciseAngles> {
  // Import the main thread angle calculator as fallback
  const { AngleCalculator } = await import('./angleCalculator');
  return AngleCalculator.extractExerciseAngles(landmarks);
}

// Main API function that automatically chooses Web Worker or fallback
export async function calculateExerciseAngles(landmarks: PoseLandmark[]): Promise<ExerciseAngles> {
  if (WebWorkerManager.isSupported()) {
    try {
      return await webWorkerManager.calculateExerciseAngles(landmarks);
    } catch (error) {
      console.warn('Web Worker calculation failed, falling back to main thread:', error);
      return calculateExerciseAnglesFallback(landmarks);
    }
  } else {
    return calculateExerciseAnglesFallback(landmarks);
  }
}

// Cleanup function for application shutdown
export function cleanupWebWorkers(): void {
  webWorkerManager.terminate();
}