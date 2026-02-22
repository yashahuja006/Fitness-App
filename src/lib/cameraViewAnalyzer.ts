/**
 * Camera View Analyzer
 * Analyzes camera positioning and provides guidance for optimal exercise analysis
 */

import type {
  ViewAnalysis,
  ViewType,
  PositioningGuidance,
  PositionGuide,
  ScreenPosition,
  Landmark,
  ExerciseAngles
} from '@/types/advancedPose';

import { ViewType } from '@/types/advancedPose';

export interface CameraViewConfig {
  optimalOffsetRange: [number, number]; // [min, max] degrees for optimal side view
  suboptimalOffsetRange: [number, number]; // [min, max] degrees for suboptimal side view
  minConfidenceThreshold: number; // Minimum landmark confidence for reliable analysis
  stabilizationFrames: number; // Number of frames to average for stable view detection
}

const DEFAULT_CONFIG: CameraViewConfig = {
  optimalOffsetRange: [15, 35], // 15-35 degrees for optimal side view
  suboptimalOffsetRange: [10, 45], // 10-45 degrees for acceptable side view
  minConfidenceThreshold: 0.7, // 70% confidence minimum
  stabilizationFrames: 5 // Average over 5 frames
};

export class CameraViewAnalyzer {
  private config: CameraViewConfig;
  private recentAnalyses: ViewAnalysis[] = [];
  private currentGuidance: PositioningGuidance | null = null;

  constructor(config: Partial<CameraViewConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze camera view based on pose landmarks
   */
  analyzeView(landmarks: {
    nose: Landmark;
    leftShoulder: Landmark;
    rightShoulder: Landmark;
    leftHip: Landmark;
    rightHip: Landmark;
  }): ViewAnalysis {
    // Calculate nose-shoulder offset angle
    const offsetAngle = this.calculateNoseShoulderOffset(landmarks);
    
    // Determine view type based on offset angle
    const viewType = this.determineViewType(offsetAngle);
    
    // Calculate confidence based on landmark visibility
    const confidence = this.calculateViewConfidence(landmarks);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(viewType, offsetAngle);

    const analysis: ViewAnalysis = {
      viewType,
      offsetAngle,
      confidence,
      recommendations
    };

    // Add to recent analyses for stabilization
    this.recentAnalyses.push(analysis);
    if (this.recentAnalyses.length > this.config.stabilizationFrames) {
      this.recentAnalyses.shift();
    }

    return this.getStabilizedAnalysis();
  }

  /**
   * Calculate nose-shoulder offset angle for view detection
   */
  private calculateNoseShoulderOffset(landmarks: {
    nose: Landmark;
    leftShoulder: Landmark;
    rightShoulder: Landmark;
  }): number {
    const { nose, leftShoulder, rightShoulder } = landmarks;

    // Calculate shoulder midpoint
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // Calculate horizontal offset from nose to shoulder midpoint
    const horizontalOffset = Math.abs(nose.x - shoulderMidX);
    
    // Calculate vertical distance for angle calculation
    const verticalDistance = Math.abs(nose.y - shoulderMidY);
    
    // Calculate offset angle in degrees
    const offsetAngle = Math.atan2(horizontalOffset, verticalDistance) * (180 / Math.PI);
    
    return offsetAngle;
  }

  /**
   * Determine view type based on offset angle
   */
  private determineViewType(offsetAngle: number): ViewType {
    const [optimalMin, optimalMax] = this.config.optimalOffsetRange;
    const [suboptimalMin, suboptimalMax] = this.config.suboptimalOffsetRange;

    if (offsetAngle >= optimalMin && offsetAngle <= optimalMax) {
      return ViewType.OPTIMAL_SIDE;
    } else if (offsetAngle >= suboptimalMin && offsetAngle <= suboptimalMax) {
      return ViewType.SUBOPTIMAL_SIDE;
    } else if (offsetAngle < 10) {
      return ViewType.FRONTAL;
    } else {
      return ViewType.UNKNOWN;
    }
  }

  /**
   * Calculate confidence based on landmark visibility
   */
  private calculateViewConfidence(landmarks: {
    nose: Landmark;
    leftShoulder: Landmark;
    rightShoulder: Landmark;
    leftHip: Landmark;
    rightHip: Landmark;
  }): number {
    const visibilityScores = [
      landmarks.nose.visibility,
      landmarks.leftShoulder.visibility,
      landmarks.rightShoulder.visibility,
      landmarks.leftHip.visibility,
      landmarks.rightHip.visibility
    ];

    // Calculate average visibility
    const averageVisibility = visibilityScores.reduce((sum, score) => sum + score, 0) / visibilityScores.length;
    
    // Normalize to confidence score (0-1)
    return Math.min(1.0, Math.max(0.0, averageVisibility));
  }

  /**
   * Generate recommendations based on view analysis
   */
  private generateRecommendations(viewType: ViewType, offsetAngle: number): string[] {
    const recommendations: string[] = [];

    switch (viewType) {
      case ViewType.OPTIMAL_SIDE:
        recommendations.push('Perfect camera positioning! Ready for exercise analysis.');
        break;

      case ViewType.SUBOPTIMAL_SIDE:
        const [optimalMin, optimalMax] = this.config.optimalOffsetRange;
        if (offsetAngle < optimalMin) {
          recommendations.push('Move slightly more to the side for optimal analysis.');
        } else if (offsetAngle > optimalMax) {
          recommendations.push('Move slightly closer to center for better analysis.');
        }
        recommendations.push('Current position is acceptable for analysis.');
        break;

      case ViewType.FRONTAL:
        recommendations.push('Please position yourself to the side of the camera.');
        recommendations.push('Turn 90 degrees so your side profile is visible.');
        recommendations.push('Side view is required for accurate squat analysis.');
        break;

      case ViewType.UNKNOWN:
        recommendations.push('Unable to determine camera positioning.');
        recommendations.push('Ensure you are fully visible in the camera frame.');
        recommendations.push('Position yourself to the side for best results.');
        break;
    }

    return recommendations;
  }

  /**
   * Get stabilized analysis by averaging recent results
   */
  private getStabilizedAnalysis(): ViewAnalysis {
    if (this.recentAnalyses.length === 0) {
      return {
        viewType: ViewType.UNKNOWN,
        offsetAngle: 0,
        confidence: 0,
        recommendations: ['No pose data available']
      };
    }

    // Use the most recent analysis as base
    const latest = this.recentAnalyses[this.recentAnalyses.length - 1];

    // Average offset angle for stability
    const avgOffsetAngle = this.recentAnalyses.reduce((sum, analysis) => sum + analysis.offsetAngle, 0) / this.recentAnalyses.length;

    // Average confidence
    const avgConfidence = this.recentAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / this.recentAnalyses.length;

    // Use most common view type
    const viewTypeCounts = new Map<ViewType, number>();
    this.recentAnalyses.forEach(analysis => {
      viewTypeCounts.set(analysis.viewType, (viewTypeCounts.get(analysis.viewType) || 0) + 1);
    });

    const mostCommonViewType = Array.from(viewTypeCounts.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      viewType: mostCommonViewType,
      offsetAngle: avgOffsetAngle,
      confidence: avgConfidence,
      recommendations: this.generateRecommendations(mostCommonViewType, avgOffsetAngle)
    };
  }

  /**
   * Generate positioning guidance for UI display
   */
  generatePositioningGuidance(analysis: ViewAnalysis): PositioningGuidance {
    const guides: PositionGuide[] = [];
    let isBlocking = false;

    switch (analysis.viewType) {
      case ViewType.OPTIMAL_SIDE:
        // Show confirmation indicator
        guides.push({
          type: 'circle',
          position: { x: 50, y: 20 }, // Top center
          color: '#10B981', // Green
          message: '✓ Perfect positioning!'
        });
        break;

      case ViewType.SUBOPTIMAL_SIDE:
        // Show adjustment arrows
        const [optimalMin, optimalMax] = this.config.optimalOffsetRange;
        if (analysis.offsetAngle < optimalMin) {
          guides.push({
            type: 'arrow',
            position: { x: 80, y: 50 }, // Right side
            color: '#F59E0B', // Yellow
            message: 'Move more to the side →'
          });
        } else if (analysis.offsetAngle > optimalMax) {
          guides.push({
            type: 'arrow',
            position: { x: 20, y: 50 }, // Left side
            color: '#F59E0B', // Yellow
            message: '← Move closer to center'
          });
        }
        break;

      case ViewType.FRONTAL:
        isBlocking = true;
        guides.push({
          type: 'text',
          position: { x: 50, y: 30 }, // Center top
          color: '#EF4444', // Red
          message: 'Turn to your side'
        });
        guides.push({
          type: 'arrow',
          position: { x: 50, y: 50 }, // Center
          color: '#EF4444', // Red
          message: 'Position yourself sideways →'
        });
        break;

      case ViewType.UNKNOWN:
        isBlocking = true;
        guides.push({
          type: 'text',
          position: { x: 50, y: 40 }, // Center
          color: '#6B7280', // Gray
          message: 'Position yourself in frame'
        });
        break;
    }

    const guidance: PositioningGuidance = {
      message: analysis.recommendations[0] || 'Adjust your position',
      visualGuides: guides,
      isBlocking
    };

    this.currentGuidance = guidance;
    return guidance;
  }

  /**
   * Check if current view is ready for exercise analysis
   */
  isReadyForAnalysis(analysis: ViewAnalysis): boolean {
    return analysis.viewType === ViewType.OPTIMAL_SIDE || 
           (analysis.viewType === ViewType.SUBOPTIMAL_SIDE && analysis.confidence >= this.config.minConfidenceThreshold);
  }

  /**
   * Get current positioning guidance
   */
  getCurrentGuidance(): PositioningGuidance | null {
    return this.currentGuidance;
  }

  /**
   * Reset analyzer state
   */
  reset(): void {
    this.recentAnalyses = [];
    this.currentGuidance = null;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CameraViewConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CameraViewConfig {
    return { ...this.config };
  }

  /**
   * Get analysis history for debugging
   */
  getAnalysisHistory(): ViewAnalysis[] {
    return [...this.recentAnalyses];
  }
}

// Export default instance for easy use
export const cameraViewAnalyzer = new CameraViewAnalyzer();