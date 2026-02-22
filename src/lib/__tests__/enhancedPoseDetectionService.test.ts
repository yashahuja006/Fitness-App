/**
 * Enhanced Pose Detection Service Tests
 */

import { EnhancedPoseDetectionService } from '../enhancedPoseDetectionService';
import type { PoseLandmark } from '@/types/pose';

// Mock the webWorkerManager
jest.mock('../webWorkerManager', () => ({
  webWorkerManager: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getStatus: jest.fn().mockReturnValue({
      isInitialized: true,
      pendingRequests: 0,
      isHealthy: true
    }),
    terminate: jest.fn().mockResolvedValue(undefined)
  },
  calculateExerciseAngles: jest.fn().mockResolvedValue({
    kneeAngle: 90,
    hipAngle: 45,
    ankleAngle: 120,
    offsetAngle: 15
  })
}));

describe('EnhancedPoseDetectionService', () => {
  let service: EnhancedPoseDetectionService;

  beforeEach(() => {
    service = new EnhancedPoseDetectionService();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  const mockLandmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    visibility: 0.8
  }));

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      
      const status = service.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const { webWorkerManager } = require('../webWorkerManager');
      webWorkerManager.initialize.mockRejectedValueOnce(new Error('Init failed'));
      
      await service.initialize();
      
      const status = service.getStatus();
      expect(status.isInitialized).toBe(true); // Should still be initialized due to fallback
    });
  });

  describe('pose processing', () => {
    it('should process pose landmarks and return angles', async () => {
      const result = await service.processPoseLandmarks(mockLandmarks);
      
      expect(result).toHaveProperty('landmarks');
      expect(result).toHaveProperty('angles');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('processingTime');
      
      expect(result.landmarks).toBe(mockLandmarks);
      expect(result.angles).toEqual({
        kneeAngle: 90,
        hipAngle: 45,
        ankleAngle: 120,
        offsetAngle: 15
      });
      
      expect(typeof result.timestamp).toBe('number');
      expect(typeof result.processingTime).toBe('number');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should auto-initialize if not already initialized', async () => {
      // Service starts uninitialized
      expect(service.getStatus().isInitialized).toBe(false);
      
      const result = await service.processPoseLandmarks(mockLandmarks);
      
      expect(result).toHaveProperty('angles');
      expect(service.getStatus().isInitialized).toBe(true);
    });

    it('should handle processing errors', async () => {
      const { calculateExerciseAngles } = require('../webWorkerManager');
      calculateExerciseAngles.mockRejectedValueOnce(new Error('Processing failed'));
      
      await expect(service.processPoseLandmarks(mockLandmarks))
        .rejects.toThrow('Failed to process pose landmarks: Processing failed');
    });
  });

  describe('status and cleanup', () => {
    it('should return correct status', async () => {
      await service.initialize();
      
      const status = service.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.workerStatus).toEqual({
        isInitialized: true,
        pendingRequests: 0,
        isHealthy: true
      });
    });

    it('should cleanup resources properly', async () => {
      await service.initialize();
      expect(service.getStatus().isInitialized).toBe(true);
      
      await service.cleanup();
      expect(service.getStatus().isInitialized).toBe(false);
      
      const { webWorkerManager } = require('../webWorkerManager');
      expect(webWorkerManager.terminate).toHaveBeenCalled();
    });
  });
});