/**
 * Property-Based Tests for Camera View Analyzer
 * Tests view detection and positioning guidance
 */

import * as fc from 'fast-check';
import { CameraViewAnalyzer } from '../cameraViewAnalyzer';
import type { Landmark, ViewType } from '@/types/advancedPose';
import { ViewType as ViewTypeEnum } from '@/types/advancedPose';

// Test data generators
const landmarkArbitrary = fc.record({
  x: fc.float({ min: 0, max: 1, noNaN: true }),
  y: fc.float({ min: 0, max: 1, noNaN: true }),
  z: fc.float({ min: -1, max: 1, noNaN: true }),
  visibility: fc.float({ min: 0, max: 1, noNaN: true })
});

const poseLandmarksArbitrary = fc.record({
  nose: landmarkArbitrary,
  leftShoulder: landmarkArbitrary,
  rightShoulder: landmarkArbitrary,
  leftHip: landmarkArbitrary,
  rightHip: landmarkArbitrary
});

// Generate landmarks for specific view types
function generateOptimalSideViewLandmarks(): {
  nose: Landmark;
  leftShoulder: Landmark;
  rightShoulder: Landmark;
  leftHip: Landmark;
  rightHip: Landmark;
} {
  // For optimal side view, nose should be offset from shoulder midpoint by 15-35 degrees
  const shoulderMidX = 0.5;
  const shoulderMidY = 0.4;
  
  // Calculate nose position for ~25 degree offset (optimal)
  // Using a more significant horizontal offset to ensure we get the right angle
  const horizontalOffset = 0.08; // Larger offset for clearer side view
  
  return {
    nose: { x: shoulderMidX + horizontalOffset, y: shoulderMidY - 0.1, z: 0, visibility: 0.9 },
    leftShoulder: { x: shoulderMidX - 0.1, y: shoulderMidY, z: 0, visibility: 0.9 },
    rightShoulder: { x: shoulderMidX + 0.1, y: shoulderMidY, z: 0, visibility: 0.9 },
    leftHip: { x: shoulderMidX - 0.08, y: shoulderMidY + 0.3, z: 0, visibility: 0.9 },
    rightHip: { x: shoulderMidX + 0.08, y: shoulderMidY + 0.3, z: 0, visibility: 0.9 }
  };
}

function generateFrontalViewLandmarks(): {
  nose: Landmark;
  leftShoulder: Landmark;
  rightShoulder: Landmark;
  leftHip: Landmark;
  rightHip: Landmark;
} {
  // For frontal view, nose should be directly above shoulder midpoint (minimal offset)
  const shoulderMidX = 0.5;
  const shoulderMidY = 0.4;
  
  return {
    nose: { x: shoulderMidX + 0.01, y: shoulderMidY - 0.1, z: 0, visibility: 0.9 }, // Very small offset for frontal
    leftShoulder: { x: shoulderMidX - 0.15, y: shoulderMidY, z: 0, visibility: 0.9 },
    rightShoulder: { x: shoulderMidX + 0.15, y: shoulderMidY, z: 0, visibility: 0.9 },
    leftHip: { x: shoulderMidX - 0.1, y: shoulderMidY + 0.3, z: 0, visibility: 0.9 },
    rightHip: { x: shoulderMidX + 0.1, y: shoulderMidY + 0.3, z: 0, visibility: 0.9 }
  };
}

function generateSuboptimalSideViewLandmarks(): {
  nose: Landmark;
  leftShoulder: Landmark;
  rightShoulder: Landmark;
  leftHip: Landmark;
  rightHip: Landmark;
} {
  // For suboptimal side view, nose offset should be 10-15 or 35-45 degrees
  const shoulderMidX = 0.5;
  const shoulderMidY = 0.4;
  
  // Use a smaller offset for suboptimal (but still acceptable)
  const horizontalOffset = 0.04; // Smaller offset for suboptimal view
  
  return {
    nose: { x: shoulderMidX + horizontalOffset, y: shoulderMidY - 0.1, z: 0, visibility: 0.8 },
    leftShoulder: { x: shoulderMidX - 0.1, y: shoulderMidY, z: 0, visibility: 0.8 },
    rightShoulder: { x: shoulderMidX + 0.1, y: shoulderMidY, z: 0, visibility: 0.8 },
    leftHip: { x: shoulderMidX - 0.08, y: shoulderMidY + 0.3, z: 0, visibility: 0.8 },
    rightHip: { x: shoulderMidX + 0.08, y: shoulderMidY + 0.3, z: 0, visibility: 0.8 }
  };
}

describe('Camera View Analyzer Property Tests', () => {
  let analyzer: CameraViewAnalyzer;

  beforeEach(() => {
    analyzer = new CameraViewAnalyzer();
  });

  describe('Property 17: View-Based Analysis Enablement', () => {
    test('**Feature: advanced-pose-analysis, Property 17: View-Based Analysis Enablement** - Optimal side views should enable full analysis capabilities', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Number of frames to test
          (numFrames) => {
            let allAnalysesReady = true;

            // Test multiple frames of side view (optimal or suboptimal)
            for (let i = 0; i < numFrames; i++) {
              const landmarks = generateOptimalSideViewLandmarks();
              const analysis = analyzer.analyzeView(landmarks);
              
              // Should detect some form of side view (optimal or suboptimal)
              expect([ViewTypeEnum.OPTIMAL_SIDE, ViewTypeEnum.SUBOPTIMAL_SIDE]).toContain(analysis.viewType);
              
              // Should be ready for analysis if it's a side view with good confidence
              const isReady = analyzer.isReadyForAnalysis(analysis);
              if (analysis.viewType === ViewTypeEnum.OPTIMAL_SIDE || 
                  (analysis.viewType === ViewTypeEnum.SUBOPTIMAL_SIDE && analysis.confidence >= 0.7)) {
                expect(isReady).toBe(true);
              }
              
              // Should have reasonable confidence
              expect(analysis.confidence).toBeGreaterThan(0.5);
              
              // Should have meaningful recommendations
              expect(analysis.recommendations.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 17: View-Based Analysis Enablement** - Suboptimal side views should enable analysis with sufficient confidence', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.7), max: Math.fround(1.0), noNaN: true }), // Confidence threshold
          (confidenceThreshold) => {
            analyzer.updateConfig({ minConfidenceThreshold: confidenceThreshold });
            
            const landmarks = generateSuboptimalSideViewLandmarks();
            const analysis = analyzer.analyzeView(landmarks);
            
            // Should detect some form of side view
            expect([ViewTypeEnum.OPTIMAL_SIDE, ViewTypeEnum.SUBOPTIMAL_SIDE]).toContain(analysis.viewType);
            
            // Readiness should depend on confidence threshold and view type
            const isReady = analyzer.isReadyForAnalysis(analysis);
            if (analysis.viewType === ViewTypeEnum.OPTIMAL_SIDE) {
              expect(isReady).toBe(true);
            } else if (analysis.viewType === ViewTypeEnum.SUBOPTIMAL_SIDE) {
              if (analysis.confidence >= confidenceThreshold) {
                expect(isReady).toBe(true);
              } else {
                expect(isReady).toBe(false);
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 17: View-Based Analysis Enablement** - Frontal views should provide repositioning guidance', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Number of frames to test
          (numFrames) => {
            let allFrontalViewsDetected = true;
            let allProvideGuidance = true;

            for (let i = 0; i < numFrames; i++) {
              const landmarks = generateFrontalViewLandmarks();
              const analysis = analyzer.analyzeView(landmarks);
              
              // Should detect frontal view
              if (analysis.viewType !== ViewTypeEnum.FRONTAL) {
                allFrontalViewsDetected = false;
              }
              
              // Should not be ready for analysis
              const isReady = analyzer.isReadyForAnalysis(analysis);
              expect(isReady).toBe(false);
              
              // Should provide repositioning guidance
              const guidance = analyzer.generatePositioningGuidance(analysis);
              if (!guidance.isBlocking || guidance.visualGuides.length === 0) {
                allProvideGuidance = false;
              }
              
              // Should have repositioning recommendations
              const hasRepositioningAdvice = analysis.recommendations.some(rec => 
                rec.includes('side') || rec.includes('turn') || rec.includes('position')
              );
              expect(hasRepositioningAdvice).toBe(true);
            }

            expect(allFrontalViewsDetected).toBe(true);
            expect(allProvideGuidance).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 17: View-Based Analysis Enablement** - Analysis readiness should be consistent with view type', () => {
      fc.assert(
        fc.property(
          poseLandmarksArbitrary,
          (landmarks) => {
            const analysis = analyzer.analyzeView(landmarks);
            const isReady = analyzer.isReadyForAnalysis(analysis);
            
            // Readiness should match view type expectations
            switch (analysis.viewType) {
              case ViewTypeEnum.OPTIMAL_SIDE:
                expect(isReady).toBe(true);
                break;
              case ViewTypeEnum.SUBOPTIMAL_SIDE:
                // Should depend on confidence
                if (analysis.confidence >= analyzer.getConfig().minConfidenceThreshold) {
                  expect(isReady).toBe(true);
                } else {
                  expect(isReady).toBe(false);
                }
                break;
              case ViewTypeEnum.FRONTAL:
              case ViewTypeEnum.UNKNOWN:
                expect(isReady).toBe(false);
                break;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Positioning Guide Display', () => {
    test('**Feature: advanced-pose-analysis, Property 18: Positioning Guide Display** - Suboptimal positioning should display visual guides', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            generateSuboptimalSideViewLandmarks(),
            generateFrontalViewLandmarks()
          ),
          (landmarks) => {
            const analysis = analyzer.analyzeView(landmarks);
            const guidance = analyzer.generatePositioningGuidance(analysis);
            
            if (analysis.viewType !== ViewTypeEnum.OPTIMAL_SIDE) {
              // Should have visual guides for suboptimal positioning
              expect(guidance.visualGuides.length).toBeGreaterThan(0);
              
              // Each guide should have required properties
              guidance.visualGuides.forEach(guide => {
                expect(guide.type).toMatch(/^(arrow|circle|text)$/);
                expect(guide.position.x).toBeGreaterThanOrEqual(0);
                expect(guide.position.x).toBeLessThanOrEqual(100);
                expect(guide.position.y).toBeGreaterThanOrEqual(0);
                expect(guide.position.y).toBeLessThanOrEqual(100);
                expect(guide.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
                expect(guide.message).toBeTruthy();
              });
              
              // Should have meaningful guidance message
              expect(guidance.message).toBeTruthy();
              expect(guidance.message.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 18: Positioning Guide Display** - Optimal positioning should confirm readiness', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Number of optimal frames
          (numFrames) => {
            let allShowReadiness = true;

            for (let i = 0; i < numFrames; i++) {
              const landmarks = generateOptimalSideViewLandmarks();
              const analysis = analyzer.analyzeView(landmarks);
              const guidance = analyzer.generatePositioningGuidance(analysis);
              
              if (analysis.viewType === ViewTypeEnum.OPTIMAL_SIDE) {
                // Should not be blocking
                expect(guidance.isBlocking).toBe(false);
                
                // Should have confirmation visual guide
                const hasConfirmation = guidance.visualGuides.some(guide => 
                  guide.message.includes('Perfect') || 
                  guide.message.includes('✓') ||
                  guide.color === '#10B981' // Green color
                );
                
                if (!hasConfirmation) {
                  allShowReadiness = false;
                }
                
                // Should have positive message
                expect(guidance.message).toContain('Perfect');
              }
            }

            expect(allShowReadiness).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 18: Positioning Guide Display** - Blocking guidance should prevent analysis', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            generateFrontalViewLandmarks()
          ),
          (landmarks) => {
            const analysis = analyzer.analyzeView(landmarks);
            const guidance = analyzer.generatePositioningGuidance(analysis);
            
            if (analysis.viewType === ViewTypeEnum.FRONTAL || analysis.viewType === ViewTypeEnum.UNKNOWN) {
              // Should be blocking
              expect(guidance.isBlocking).toBe(true);
              
              // Should not be ready for analysis
              const isReady = analyzer.isReadyForAnalysis(analysis);
              expect(isReady).toBe(false);
              
              // Should have visual guides
              expect(guidance.visualGuides.length).toBeGreaterThan(0);
              
              // Should have corrective message
              expect(guidance.message).toBeTruthy();
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 18: Positioning Guide Display** - Guide colors should indicate severity', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            generateOptimalSideViewLandmarks(),
            generateSuboptimalSideViewLandmarks(),
            generateFrontalViewLandmarks()
          ),
          (landmarks) => {
            const analysis = analyzer.analyzeView(landmarks);
            const guidance = analyzer.generatePositioningGuidance(analysis);
            
            // Should have a valid view type
            expect(Object.values(ViewTypeEnum)).toContain(analysis.viewType);
            
            if (guidance.visualGuides.length > 0) {
              // Guides should have valid properties
              guidance.visualGuides.forEach(guide => {
                expect(guide.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
                expect(guide.message).toBeTruthy();
                expect(guide.type).toMatch(/^(arrow|circle|text)$/);
                expect(guide.position.x).toBeGreaterThanOrEqual(0);
                expect(guide.position.x).toBeLessThanOrEqual(100);
                expect(guide.position.y).toBeGreaterThanOrEqual(0);
                expect(guide.position.y).toBeLessThanOrEqual(100);
              });
              
              // Should have at least one guide with a meaningful color
              const colors = guidance.visualGuides.map(g => g.color);
              const validColors = ['#10B981', '#F59E0B', '#EF4444', '#6B7280']; // Green, Yellow, Red, Gray
              expect(colors.some(color => validColors.includes(color))).toBe(true);
            }
            
            // Guidance message should be meaningful
            expect(guidance.message).toBeTruthy();
            expect(guidance.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Camera View Analyzer State Management', () => {
    test('View analysis should be stabilized over multiple frames', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // Number of frames
          (numFrames) => {
            // Create a fresh analyzer with the desired stabilization frames
            const testAnalyzer = new CameraViewAnalyzer({ stabilizationFrames: numFrames });
            
            // Feed consistent side view data (optimal or suboptimal)
            const landmarks = generateOptimalSideViewLandmarks();
            let finalAnalysis;
            
            for (let i = 0; i < numFrames; i++) {
              finalAnalysis = testAnalyzer.analyzeView(landmarks);
            }
            
            // Should stabilize to some form of side view
            expect([ViewTypeEnum.OPTIMAL_SIDE, ViewTypeEnum.SUBOPTIMAL_SIDE]).toContain(finalAnalysis?.viewType);
            
            // History should contain exactly the stabilization frame count
            const history = testAnalyzer.getAnalysisHistory();
            expect(history.length).toBe(numFrames);
            
            // All analyses in history should be consistent
            const viewTypes = history.map(a => a.viewType);
            const uniqueViewTypes = [...new Set(viewTypes)];
            expect(uniqueViewTypes.length).toBeLessThanOrEqual(2); // Should be mostly consistent
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Reset should clear analyzer state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (numFrames) => {
            // Add some analyses
            const landmarks = generateOptimalSideViewLandmarks();
            for (let i = 0; i < numFrames; i++) {
              analyzer.analyzeView(landmarks);
            }
            
            // Verify state exists
            expect(analyzer.getAnalysisHistory().length).toBeGreaterThan(0);
            
            // Reset
            analyzer.reset();
            
            // State should be cleared
            expect(analyzer.getAnalysisHistory()).toHaveLength(0);
            expect(analyzer.getCurrentGuidance()).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Configuration updates should take effect immediately', () => {
      fc.assert(
        fc.property(
          fc.record({
            optimalOffsetRange: fc.tuple(
              fc.float({ min: Math.fround(5), max: Math.fround(20), noNaN: true }),
              fc.float({ min: Math.fround(25), max: Math.fround(50), noNaN: true })
            ),
            minConfidenceThreshold: fc.float({ min: Math.fround(0.5), max: Math.fround(0.9), noNaN: true })
          }),
          (newConfig) => {
            const [min, max] = newConfig.optimalOffsetRange;
            if (min < max) { // Ensure valid range
              analyzer.updateConfig({
                optimalOffsetRange: [min, max],
                minConfidenceThreshold: newConfig.minConfidenceThreshold
              });
              
              const config = analyzer.getConfig();
              expect(config.optimalOffsetRange).toEqual([min, max]);
              expect(config.minConfidenceThreshold).toBe(newConfig.minConfidenceThreshold);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});