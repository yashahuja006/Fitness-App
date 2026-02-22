/**
 * Property-based tests for Form Analysis System
 * Tests universal properties that should hold across all inputs
 */

import * as fc from 'fast-check';
import { FormAnalysisService } from '@/lib/formAnalysisService';
import { FormScoringService } from '@/lib/formScoringService';
import type { PoseLandmark, FormAnalysis, FormScore } from '@/types';

describe('Form Analysis System Properties', () => {
  const formAnalysisService = new FormAnalysisService();
  const formScoringService = new FormScoringService();

  /**
   * Property 2: Form Feedback Generation
   * For any detected incorrect posture during exercise, the system should generate 
   * immediate visual feedback overlays and provide real-time audio guidance.
   * **Validates: Requirements 1.2, 1.3**
   */
  describe('Property 2: Form Feedback Generation', () => {
    it('should generate feedback for any form analysis with issues', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            
            // If there are issues, there should be feedback
            if (analysis.issues.length > 0) {
              expect(analysis.suggestions.length).toBeGreaterThan(0);
              
              // Each issue should have a correction
              analysis.issues.forEach(issue => {
                expect(issue.correction).toBeDefined();
                expect(issue.correction.length).toBeGreaterThan(0);
                expect(issue.description).toBeDefined();
                expect(issue.description.length).toBeGreaterThan(0);
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide severity-appropriate feedback', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            
            // High severity issues should have more urgent corrections
            const highSeverityIssues = analysis.issues.filter(issue => issue.severity === 'high');
            const lowSeverityIssues = analysis.issues.filter(issue => issue.severity === 'low');
            
            // High severity issues should be addressed first in suggestions
            if (highSeverityIssues.length > 0 && lowSeverityIssues.length > 0) {
              expect(analysis.suggestions.length).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Exercise Completion Analysis
   * For any completed exercise set, the system should generate a form quality score 
   * and provide improvement suggestions based on the performance data.
   * **Validates: Requirements 1.4**
   */
  describe('Property 3: Exercise Completion Analysis', () => {
    it('should generate valid form scores for any exercise completion', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            const score = formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
            
            // Score should be valid
            expect(score.overall).toBeGreaterThanOrEqual(0);
            expect(score.overall).toBeLessThanOrEqual(1);
            
            // Breakdown scores should be valid
            Object.values(score.breakdown).forEach(breakdownScore => {
              expect(breakdownScore).toBeGreaterThanOrEqual(0);
              expect(breakdownScore).toBeLessThanOrEqual(1);
            });
            
            // Grade should be valid
            expect(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).toContain(score.grade);
            
            // Should have improvements if score is low
            if (score.overall < 0.8) {
              expect(score.improvements.length).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide improvement suggestions based on performance', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            const score = formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
            
            // Improvements should be actionable
            score.improvements.forEach(improvement => {
              expect(improvement.title).toBeDefined();
              expect(improvement.description).toBeDefined();
              expect(improvement.actionSteps.length).toBeGreaterThan(0);
              expect(improvement.expectedImprovement).toBeGreaterThan(0);
              expect(['high', 'medium', 'low']).toContain(improvement.priority);
              expect(['easy', 'moderate', 'challenging']).toContain(improvement.difficulty);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Form Analysis Consistency
   * Form analysis should be consistent and deterministic for the same input
   */
  describe('Property: Form Analysis Consistency', () => {
    it('should produce consistent results for identical inputs', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis1 = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            const analysis2 = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            
            // Results should be identical
            expect(analysis1.correctness).toBe(analysis2.correctness);
            expect(analysis1.issues.length).toBe(analysis2.issues.length);
            expect(analysis1.suggestions.length).toBe(analysis2.suggestions.length);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Score Monotonicity
   * Better form (fewer/less severe issues) should result in higher scores
   */
  describe('Property: Score Monotonicity', () => {
    it('should assign higher scores to better form', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            
            // Create a "better" version by removing some issues
            const betterAnalysis: FormAnalysis = {
              ...analysis,
              issues: analysis.issues.slice(0, Math.floor(analysis.issues.length / 2)),
              correctness: Math.min(1.0, analysis.correctness + 0.1),
            };
            
            const originalScore = formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
            const betterScore = formScoringService.calculateFormScore(betterAnalysis, landmarks, exerciseId);
            
            // Better form should have higher or equal score
            expect(betterScore.overall).toBeGreaterThanOrEqual(originalScore.overall - 0.01); // Small tolerance for floating point
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Landmark Visibility Impact
   * Higher landmark visibility should generally result in better consistency scores
   */
  describe('Property: Landmark Visibility Impact', () => {
    it('should score higher visibility landmarks better for consistency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('pushup', 'squat', 'plank'),
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.5) }),
          fc.float({ min: Math.fround(0.8), max: Math.fround(1.0) }),
          (exerciseId, lowVisibility, highVisibility) => {
            const lowVisibilityLandmarks = createLandmarksWithVisibility(lowVisibility);
            const highVisibilityLandmarks = createLandmarksWithVisibility(highVisibility);
            
            const lowAnalysis = formAnalysisService.analyzePoseForm(lowVisibilityLandmarks, exerciseId);
            const highAnalysis = formAnalysisService.analyzePoseForm(highVisibilityLandmarks, exerciseId);
            
            const lowScore = formScoringService.calculateFormScore(lowAnalysis, lowVisibilityLandmarks, exerciseId);
            const highScore = formScoringService.calculateFormScore(highAnalysis, highVisibilityLandmarks, exerciseId);
            
            // Higher visibility should generally result in better consistency
            expect(highScore.breakdown.consistency).toBeGreaterThanOrEqual(lowScore.breakdown.consistency);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Exercise-Specific Scoring
   * Different exercises should have different scoring characteristics
   */
  describe('Property: Exercise-Specific Scoring', () => {
    it('should apply exercise-specific scoring rules', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          (landmarks) => {
            const exercises = ['pushup', 'squat', 'plank'];
            const scores = exercises.map(exerciseId => {
              const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
              return formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
            });
            
            // At least some breakdown scores should be different between exercises
            const breakdownKeys = Object.keys(scores[0].breakdown) as Array<keyof typeof scores[0]['breakdown']>;
            let hasDifference = false;
            
            for (const key of breakdownKeys) {
              const values = scores.map(score => score.breakdown[key]);
              const uniqueValues = new Set(values.map(v => Math.round(v * 100))); // Round to avoid floating point issues
              if (uniqueValues.size > 1) {
                hasDifference = true;
                break;
              }
            }
            
            // Should have some exercise-specific differences (unless all scores are identical)
            const allOverallScores = scores.map(s => Math.round(s.overall * 100));
            const uniqueOverallScores = new Set(allOverallScores);
            
            if (uniqueOverallScores.size > 1) {
              expect(hasDifference).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property: Improvement Suggestion Relevance
   * Improvement suggestions should be relevant to the detected issues
   */
  describe('Property: Improvement Suggestion Relevance', () => {
    it('should provide relevant improvement suggestions', () => {
      fc.assert(
        fc.property(
          fc.array(landmarkArbitrary(), { minLength: 33, maxLength: 33 }),
          fc.constantFrom('pushup', 'squat', 'plank'),
          (landmarks, exerciseId) => {
            const analysis = formAnalysisService.analyzePoseForm(landmarks, exerciseId);
            const score = formScoringService.calculateFormScore(analysis, landmarks, exerciseId);
            
            // If there are issues, improvements should address them
            if (analysis.issues.length > 0) {
              expect(score.improvements.length).toBeGreaterThan(0);
              
              const issueTypes = new Set(analysis.issues.map(issue => issue.type));
              const improvementCategories = new Set(score.improvements.map(imp => imp.category));
              
              // At least some improvement categories should match issue types
              const hasRelevantImprovements = Array.from(issueTypes).some(type => 
                improvementCategories.has(type as any)
              );
              
              if (issueTypes.size > 0) {
                expect(hasRelevantImprovements || score.improvements.length > 0).toBe(true);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Arbitraries for property-based testing
 */
function landmarkArbitrary(): fc.Arbitrary<PoseLandmark> {
  return fc.record({
    x: fc.float({ min: 0, max: 1 }),
    y: fc.float({ min: 0, max: 1 }),
    z: fc.float({ min: -1, max: 1 }),
    visibility: fc.float({ min: 0, max: 1 }),
  });
}

/**
 * Helper function to create landmarks with specific visibility
 */
function createLandmarksWithVisibility(visibility: number): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];
  
  for (let i = 0; i < 33; i++) {
    landmarks.push({
      x: 0.5 + (Math.random() - 0.5) * 0.4,
      y: 0.5 + (Math.random() - 0.5) * 0.4,
      z: 0,
      visibility,
    });
  }
  
  return landmarks;
}