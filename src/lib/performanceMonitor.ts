/**
 * Performance Monitor
 * Tracks frame rate, processing latency, and memory usage for pose analysis
 * 
 * Task 16.1: Performance optimization - Performance metrics collection
 * Requirements: 8.2, 8.3
 */

export interface PerformanceMetrics {
  frameRate: number;
  processingLatency: number; // milliseconds
  memoryUsage: number; // MB
  landmarkConfidence: number; // average confidence [0-1]
  analysisAccuracy: number; // percentage
  droppedFrames: number;
  totalFrames: number;
}

export interface PerformanceConfig {
  targetFPS: number; // Target frame rate (15-30 FPS)
  maxLatency: number; // Maximum acceptable latency in ms
  memoryThreshold: number; // Memory threshold in MB
  sampleWindow: number; // Number of frames to average over
}

export class PerformanceMonitor {
  private frameTimestamps: number[] = [];
  private latencyMeasurements: number[] = [];
  private confidenceScores: number[] = [];
  private droppedFrames = 0;
  private totalFrames = 0;
  private lastFrameTime = 0;
  private config: PerformanceConfig;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFPS: config.targetFPS || 30,
      maxLatency: config.maxLatency || 50, // 50ms max latency
      memoryThreshold: config.memoryThreshold || 500, // 500MB threshold
      sampleWindow: config.sampleWindow || 30, // Average over 30 frames
    };
  }

  /**
   * Mark the start of a frame processing cycle
   */
  startFrame(): number {
    const now = performance.now();
    this.totalFrames++;

    // Check if we dropped frames (frame rate too low)
    if (this.lastFrameTime > 0) {
      const timeSinceLastFrame = now - this.lastFrameTime;
      const expectedFrameTime = 1000 / this.config.targetFPS;
      
      if (timeSinceLastFrame > expectedFrameTime * 1.5) {
        this.droppedFrames++;
      }
    }

    this.lastFrameTime = now;
    this.frameTimestamps.push(now);

    // Keep only recent frames in the window
    if (this.frameTimestamps.length > this.config.sampleWindow) {
      this.frameTimestamps.shift();
    }

    return now;
  }

  /**
   * Mark the end of a frame processing cycle and record latency
   */
  endFrame(startTime: number, landmarkConfidence?: number): void {
    const latency = performance.now() - startTime;
    this.latencyMeasurements.push(latency);

    // Keep only recent measurements
    if (this.latencyMeasurements.length > this.config.sampleWindow) {
      this.latencyMeasurements.shift();
    }

    // Record landmark confidence if provided
    if (landmarkConfidence !== undefined) {
      this.confidenceScores.push(landmarkConfidence);
      if (this.confidenceScores.length > this.config.sampleWindow) {
        this.confidenceScores.shift();
      }
    }
  }

  /**
   * Calculate current frame rate based on recent frames
   */
  getFrameRate(): number {
    if (this.frameTimestamps.length < 2) {
      return 0;
    }

    const timeSpan = this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0];
    const frameCount = this.frameTimestamps.length - 1;
    
    if (timeSpan === 0) {
      return 0;
    }

    return Math.round((frameCount / timeSpan) * 1000);
  }

  /**
   * Get average processing latency
   */
  getAverageLatency(): number {
    if (this.latencyMeasurements.length === 0) {
      return 0;
    }

    const sum = this.latencyMeasurements.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / this.latencyMeasurements.length);
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): number {
    if (typeof window === 'undefined') {
      return 0;
    }

    // Check if performance.memory is available (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }

    return 0;
  }

  /**
   * Get average landmark confidence
   */
  getAverageLandmarkConfidence(): number {
    if (this.confidenceScores.length === 0) {
      return 0;
    }

    const sum = this.confidenceScores.reduce((acc, val) => acc + val, 0);
    return sum / this.confidenceScores.length;
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      frameRate: this.getFrameRate(),
      processingLatency: this.getAverageLatency(),
      memoryUsage: this.getMemoryUsage(),
      landmarkConfidence: this.getAverageLandmarkConfidence(),
      analysisAccuracy: this.calculateAnalysisAccuracy(),
      droppedFrames: this.droppedFrames,
      totalFrames: this.totalFrames,
    };
  }

  /**
   * Calculate analysis accuracy based on confidence and performance
   */
  private calculateAnalysisAccuracy(): number {
    const confidence = this.getAverageLandmarkConfidence();
    const frameRate = this.getFrameRate();
    const targetFPS = this.config.targetFPS;

    // Accuracy is based on both landmark confidence and frame rate stability
    const confidenceScore = confidence * 100;
    const frameRateScore = Math.min(100, (frameRate / targetFPS) * 100);

    // Weighted average: 70% confidence, 30% frame rate
    return Math.round(confidenceScore * 0.7 + frameRateScore * 0.3);
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  isPerformanceAcceptable(): {
    acceptable: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const metrics = this.getMetrics();

    // Check frame rate
    if (metrics.frameRate < this.config.targetFPS * 0.5) {
      issues.push(`Low frame rate: ${metrics.frameRate} FPS (target: ${this.config.targetFPS} FPS)`);
    }

    // Check latency
    if (metrics.processingLatency > this.config.maxLatency) {
      issues.push(`High latency: ${metrics.processingLatency}ms (max: ${this.config.maxLatency}ms)`);
    }

    // Check memory usage
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      issues.push(`High memory usage: ${metrics.memoryUsage}MB (threshold: ${this.config.memoryThreshold}MB)`);
    }

    // Check dropped frames
    const dropRate = (metrics.droppedFrames / metrics.totalFrames) * 100;
    if (dropRate > 10) {
      issues.push(`High frame drop rate: ${dropRate.toFixed(1)}%`);
    }

    return {
      acceptable: issues.length === 0,
      issues,
    };
  }

  /**
   * Get performance recommendations based on current metrics
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();
    const performance = this.isPerformanceAcceptable();

    if (!performance.acceptable) {
      if (metrics.frameRate < this.config.targetFPS * 0.5) {
        recommendations.push('Consider reducing video resolution or model complexity');
        recommendations.push('Enable Web Worker for angle calculations if not already enabled');
      }

      if (metrics.processingLatency > this.config.maxLatency) {
        recommendations.push('Reduce analysis frequency or skip frames');
        recommendations.push('Optimize angle calculation algorithms');
      }

      if (metrics.memoryUsage > this.config.memoryThreshold) {
        recommendations.push('Clear old analysis data periodically');
        recommendations.push('Reduce sample window size');
      }

      if (metrics.landmarkConfidence < 0.5) {
        recommendations.push('Improve lighting conditions');
        recommendations.push('Adjust camera positioning for better visibility');
      }
    }

    return recommendations;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameTimestamps = [];
    this.latencyMeasurements = [];
    this.confidenceScores = [];
    this.droppedFrames = 0;
    this.totalFrames = 0;
    this.lastFrameTime = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
