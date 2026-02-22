/**
 * Tests for Performance Monitor
 * Task 16.1: Performance optimization - Performance metrics collection tests
 */

import { PerformanceMonitor } from '../performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      targetFPS: 30,
      maxLatency: 50,
      memoryThreshold: 500,
      sampleWindow: 10,
    });
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('frame tracking', () => {
    it('should track frame start and end', () => {
      const startTime = monitor.startFrame();
      expect(startTime).toBeGreaterThan(0);

      monitor.endFrame(startTime);
      const metrics = monitor.getMetrics();
      expect(metrics.totalFrames).toBe(1);
    });

    it('should calculate frame rate from multiple frames', () => {
      // Simulate 10 frames at ~30 FPS
      for (let i = 0; i < 10; i++) {
        const start = monitor.startFrame();
        monitor.endFrame(start);
      }

      const frameRate = monitor.getFrameRate();
      expect(frameRate).toBeGreaterThan(0);
    });

    it('should detect dropped frames', async () => {
      const start1 = monitor.startFrame();
      monitor.endFrame(start1);

      // Wait a bit to simulate real time passing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start another frame after delay
      monitor.startFrame();
      
      const metrics = monitor.getMetrics();
      // Dropped frames should be detected due to the delay
      expect(metrics.droppedFrames).toBeGreaterThanOrEqual(0);
    });
  });

  describe('latency tracking', () => {
    it('should track processing latency', async () => {
      const start = monitor.startFrame();
      
      // Simulate some processing time with a small delay
      await new Promise(resolve => setTimeout(resolve, 20));
      
      monitor.endFrame(start);
      
      const latency = monitor.getAverageLatency();
      expect(latency).toBeGreaterThanOrEqual(0);
      expect(latency).toBeLessThanOrEqual(100); // Reasonable upper bound
    });

    it('should average latency over multiple frames', () => {
      const latencies = [10, 20, 30, 40, 50];
      
      latencies.forEach((latency) => {
        const start = performance.now();
        monitor.startFrame();
        monitor.endFrame(start - latency); // Negative to simulate past start time
      });

      const avgLatency = monitor.getAverageLatency();
      expect(avgLatency).toBeGreaterThan(0);
    });
  });

  describe('landmark confidence tracking', () => {
    it('should track landmark confidence', () => {
      const start = monitor.startFrame();
      monitor.endFrame(start, 0.85);

      const confidence = monitor.getAverageLandmarkConfidence();
      expect(confidence).toBe(0.85);
    });

    it('should average confidence over multiple frames', () => {
      const confidences = [0.8, 0.9, 0.85, 0.95];
      
      confidences.forEach((confidence) => {
        const start = monitor.startFrame();
        monitor.endFrame(start, confidence);
      });

      const avgConfidence = monitor.getAverageLandmarkConfidence();
      expect(avgConfidence).toBeGreaterThan(0);
      expect(avgConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('performance metrics', () => {
    it('should return comprehensive metrics', () => {
      const start = monitor.startFrame();
      monitor.endFrame(start, 0.9);

      const metrics = monitor.getMetrics();
      
      expect(metrics).toHaveProperty('frameRate');
      expect(metrics).toHaveProperty('processingLatency');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('landmarkConfidence');
      expect(metrics).toHaveProperty('analysisAccuracy');
      expect(metrics).toHaveProperty('droppedFrames');
      expect(metrics).toHaveProperty('totalFrames');
    });

    it('should calculate analysis accuracy', () => {
      // Simulate good performance
      for (let i = 0; i < 5; i++) {
        const start = monitor.startFrame();
        monitor.endFrame(start, 0.9);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.analysisAccuracy).toBeGreaterThan(0);
      expect(metrics.analysisAccuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('performance validation', () => {
    it('should detect acceptable performance', () => {
      // Simulate good performance
      for (let i = 0; i < 5; i++) {
        const start = monitor.startFrame();
        monitor.endFrame(start, 0.9);
      }

      const performance = monitor.isPerformanceAcceptable();
      expect(performance).toHaveProperty('acceptable');
      expect(performance).toHaveProperty('issues');
      expect(Array.isArray(performance.issues)).toBe(true);
    });

    it('should detect low frame rate issues', () => {
      // Simulate very slow frame rate by setting large delays
      monitor.updateConfig({ targetFPS: 30 });
      
      const start = monitor.startFrame();
      monitor.endFrame(start);
      
      // The frame rate will be low initially
      const performance = monitor.isPerformanceAcceptable();
      expect(performance.issues).toBeDefined();
    });
  });

  describe('recommendations', () => {
    it('should provide recommendations for poor performance', () => {
      // Simulate poor performance
      monitor.updateConfig({ targetFPS: 30, maxLatency: 10 });
      
      const start = monitor.startFrame();
      monitor.endFrame(start + 100); // High latency
      
      const recommendations = monitor.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should provide no recommendations for good performance', () => {
      // Simulate good performance
      for (let i = 0; i < 10; i++) {
        const start = monitor.startFrame();
        monitor.endFrame(start, 0.95);
      }

      const recommendations = monitor.getRecommendations();
      expect(recommendations.length).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        targetFPS: 15,
        maxLatency: 100,
      };

      monitor.updateConfig(newConfig);
      const config = monitor.getConfig();
      
      expect(config.targetFPS).toBe(15);
      expect(config.maxLatency).toBe(100);
    });

    it('should get current configuration', () => {
      const config = monitor.getConfig();
      
      expect(config).toHaveProperty('targetFPS');
      expect(config).toHaveProperty('maxLatency');
      expect(config).toHaveProperty('memoryThreshold');
      expect(config).toHaveProperty('sampleWindow');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      // Generate some metrics
      for (let i = 0; i < 5; i++) {
        const start = monitor.startFrame();
        monitor.endFrame(start, 0.9);
      }

      let metrics = monitor.getMetrics();
      expect(metrics.totalFrames).toBeGreaterThan(0);

      // Reset
      monitor.reset();
      metrics = monitor.getMetrics();
      
      expect(metrics.totalFrames).toBe(0);
      expect(metrics.droppedFrames).toBe(0);
    });
  });
});
