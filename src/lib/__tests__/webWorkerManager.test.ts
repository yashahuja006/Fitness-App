/**
 * Web Worker Manager Tests
 * Tests for Web Worker integration and fallback functionality
 */

import { WebWorkerManager, calculateExerciseAngles, calculateExerciseAnglesFallback } from '../webWorkerManager';
import type { PoseLandmark } from '@/types/pose';

// Mock Web Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  postMessage(message: any) {
    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        let responseData: any;
        
        switch (message.type) {
          case 'CALCULATE_ANGLES':
            responseData = {
              kneeAngle: 90,
              hipAngle: 45,
              ankleAngle: 120,
              offsetAngle: 15
            };
            break;
          case 'CALCULATE_SINGLE_ANGLE':
            responseData = 90; // Return a number for single angle
            break;
          case 'VALIDATE_LANDMARKS':
            responseData = {
              isValid: true,
              issues: []
            };
            break;
          default:
            responseData = null;
        }
        
        const response = {
          id: message.id,
          success: true,
          data: responseData
        };
        this.onmessage(new MessageEvent('message', { data: response }));
      }
    }, 10);
  }

  terminate() {
    // Mock termination
  }
}

// Mock Worker constructor
(global as any).Worker = jest.fn().mockImplementation(() => new MockWorker());

// Mock URL constructor for worker creation
(global as any).URL = jest.fn().mockImplementation((path: string) => ({
  href: `mock://worker/${path}`
}));

describe('WebWorkerManager', () => {
  let manager: WebWorkerManager;

  beforeEach(() => {
    manager = new WebWorkerManager();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await manager.terminate();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await manager.initialize();
      
      const status = manager.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.isHealthy).toBe(true);
    });

    it('should handle multiple initialization calls', async () => {
      const promise1 = manager.initialize();
      const promise2 = manager.initialize();
      
      await Promise.all([promise1, promise2]);
      
      const status = manager.getStatus();
      expect(status.isInitialized).toBe(true);
    });
  });

  describe('angle calculations', () => {
    const mockLandmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      visibility: 0.8
    }));

    it('should calculate exercise angles using Web Worker', async () => {
      const result = await manager.calculateExerciseAngles(mockLandmarks);
      
      expect(result).toEqual({
        kneeAngle: 90,
        hipAngle: 45,
        ankleAngle: 120,
        offsetAngle: 15
      });
    });

    it('should calculate single angle between points', async () => {
      const point1 = { x: 0, y: 0, z: 0, visibility: 1 };
      const vertex = { x: 1, y: 0, z: 0, visibility: 1 };
      const point3 = { x: 1, y: 1, z: 0, visibility: 1 };
      
      const result = await manager.calculateAngleBetweenPoints(point1, vertex, point3);
      
      expect(typeof result).toBe('number');
    });

    it('should validate landmarks', async () => {
      const result = await manager.validateLandmarks(mockLandmarks);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle worker errors gracefully', async () => {
      await manager.initialize();
      
      // Simulate worker error
      const mockWorker = (global as any).Worker.mock.results[0].value;
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error', { message: 'Test error' }));
      }
      
      // Wait for restart to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Manager should be functional after restart
      const status = manager.getStatus();
      expect(status.isInitialized).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should terminate worker properly', async () => {
      await manager.initialize();
      expect(manager.getStatus().isInitialized).toBe(true);
      
      await manager.terminate();
      expect(manager.getStatus().isInitialized).toBe(false);
    });
  });
});

describe('calculateExerciseAngles API', () => {
  const mockLandmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    visibility: 0.8
  }));

  it('should use Web Worker when supported', async () => {
    const result = await calculateExerciseAngles(mockLandmarks);
    
    expect(result).toHaveProperty('kneeAngle');
    expect(result).toHaveProperty('hipAngle');
    expect(result).toHaveProperty('ankleAngle');
    expect(result).toHaveProperty('offsetAngle');
  });

  it('should use fallback when Web Workers not supported', async () => {
    // Temporarily disable Worker
    const originalWorker = (global as any).Worker;
    delete (global as any).Worker;
    
    const result = await calculateExerciseAngles(mockLandmarks);
    
    expect(result).toHaveProperty('kneeAngle');
    expect(result).toHaveProperty('hipAngle');
    expect(result).toHaveProperty('ankleAngle');
    expect(result).toHaveProperty('offsetAngle');
    
    // Restore Worker
    (global as any).Worker = originalWorker;
  });
});

describe('calculateExerciseAnglesFallback', () => {
  const mockLandmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5 + (i * 0.01), // Slight variation to create realistic positions
    z: 0,
    visibility: 0.9
  }));

  it('should calculate angles using main thread fallback', async () => {
    const result = await calculateExerciseAnglesFallback(mockLandmarks);
    
    expect(result).toHaveProperty('kneeAngle');
    expect(result).toHaveProperty('hipAngle');
    expect(result).toHaveProperty('ankleAngle');
    expect(result).toHaveProperty('offsetAngle');
    
    expect(typeof result.kneeAngle).toBe('number');
    expect(typeof result.hipAngle).toBe('number');
    expect(typeof result.ankleAngle).toBe('number');
    expect(typeof result.offsetAngle).toBe('number');
  });
});

describe('WebWorkerManager.isSupported', () => {
  it('should return true when Worker is available', () => {
    expect(WebWorkerManager.isSupported()).toBe(true);
  });

  it('should return false when Worker is not available', () => {
    const originalWorker = (global as any).Worker;
    delete (global as any).Worker;
    
    expect(WebWorkerManager.isSupported()).toBe(false);
    
    // Restore Worker
    (global as any).Worker = originalWorker;
  });
});