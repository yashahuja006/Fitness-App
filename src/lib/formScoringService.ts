/**
 * Form Scoring Service
 * Advanced scoring algorithms for exercise form evaluation with improvement suggestions
 */

import type { FormAnalysis, FormIssue, PoseLandmark, FormScore, ImprovementSuggestion } from '@/types';

export interface SessionProgress {
  sessionId: string;
  exerciseId: string;
  scores: FormScore[];
  averageScore: number;
  improvement: number; // Percentage change from start to end
  consistencyTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export class FormScoringService {
  private scoreHistory: Map<string, FormScore[]> = new Map();
  private sessionData: Map<string, SessionProgress> = new Map();

  /**
   * Calculate comprehensive form score from analysis
   */
  calculateFormScore(
    analysis: FormAnalysis,
    landmarks: PoseLandmark[],
    exerciseId: string,
    sessionId?: string
  ): FormScore {
    const breakdown = this.calculateScoreBreakdown(analysis, landmarks, exerciseId);
    const overall = this.calculateOverallScore(breakdown);
    const grade = this.calculateGrade(overall);
    const improvements = this.generateImprovementSuggestions(analysis, breakdown, exerciseId);
    const strengths = this.identifyStrengths(breakdown, analysis);
    const priority = this.determinePriority(analysis.issues);

    const score: FormScore = {
      overall,
      breakdown,
      grade,
      improvements,
      strengths,
      priority,
    };

    // Store score for tracking progress
    if (sessionId) {
      this.updateSessionProgress(sessionId, exerciseId, score);
    }

    return score;
  }

  /**
   * Calculate detailed score breakdown
   */
  private calculateScoreBreakdown(
    analysis: FormAnalysis,
    landmarks: PoseLandmark[],
    exerciseId: string
  ): FormScore['breakdown'] {
    const breakdown = {
      alignment: 1.0,
      rangeOfMotion: 1.0,
      posture: 1.0,
      timing: 1.0,
      consistency: 1.0,
    };

    // Analyze issues and reduce scores accordingly
    for (const issue of analysis.issues) {
      const impact = this.getIssueImpact(issue);
      
      switch (issue.type) {
        case 'alignment':
          breakdown.alignment *= (1 - impact);
          break;
        case 'range_of_motion':
          breakdown.rangeOfMotion *= (1 - impact);
          break;
        case 'posture':
          breakdown.posture *= (1 - impact);
          break;
        case 'timing':
          breakdown.timing *= (1 - impact);
          break;
      }
    }

    // Calculate consistency based on landmark visibility and stability
    breakdown.consistency = this.calculateConsistencyScore(landmarks);

    // Exercise-specific adjustments
    this.applyExerciseSpecificScoring(breakdown, exerciseId, landmarks);

    // Ensure all scores are between 0 and 1
    Object.keys(breakdown).forEach(key => {
      breakdown[key as keyof typeof breakdown] = Math.max(0, Math.min(1, breakdown[key as keyof typeof breakdown]));
    });

    return breakdown;
  }

  /**
   * Calculate overall score from breakdown
   */
  private calculateOverallScore(breakdown: FormScore['breakdown']): number {
    // Weighted average based on importance
    const weights = {
      alignment: 0.25,
      rangeOfMotion: 0.20,
      posture: 0.25,
      timing: 0.15,
      consistency: 0.15,
    };

    return Object.entries(breakdown).reduce((total, [key, score]) => {
      return total + score * weights[key as keyof typeof weights];
    }, 0);
  }

  /**
   * Calculate letter grade
   */
  private calculateGrade(score: number): FormScore['grade'] {
    if (score >= 0.97) return 'A+';
    if (score >= 0.93) return 'A';
    if (score >= 0.87) return 'B+';
    if (score >= 0.83) return 'B';
    if (score >= 0.77) return 'C+';
    if (score >= 0.70) return 'C';
    if (score >= 0.60) return 'D';
    return 'F';
  }

  /**
   * Get impact factor for an issue
   */
  private getIssueImpact(issue: FormIssue): number {
    const severityImpact = {
      'low': 0.1,
      'medium': 0.2,
      'high': 0.35,
    };

    const typeMultiplier = {
      'posture': 1.2,
      'alignment': 1.1,
      'range_of_motion': 1.0,
      'timing': 0.9,
    };

    return severityImpact[issue.severity] * (typeMultiplier[issue.type] || 1.0);
  }

  /**
   * Calculate consistency score based on landmark stability
   */
  private calculateConsistencyScore(landmarks: PoseLandmark[]): number {
    if (landmarks.length === 0) return 0;

    let totalVisibility = 0;
    let visibleCount = 0;

    for (const landmark of landmarks) {
      if (landmark.visibility > 0.3) {
        totalVisibility += landmark.visibility;
        visibleCount++;
      }
    }

    if (visibleCount === 0) return 0;

    const averageVisibility = totalVisibility / visibleCount;
    const visibilityRatio = visibleCount / landmarks.length;

    // Combine visibility quality and quantity
    return (averageVisibility * 0.7) + (visibilityRatio * 0.3);
  }

  /**
   * Apply exercise-specific scoring adjustments
   */
  private applyExerciseSpecificScoring(
    breakdown: FormScore['breakdown'],
    exerciseId: string,
    landmarks: PoseLandmark[]
  ): void {
    switch (exerciseId) {
      case 'pushup':
        // Push-ups prioritize alignment and posture
        breakdown.alignment *= 1.1;
        breakdown.posture *= 1.1;
        breakdown.rangeOfMotion *= 0.9;
        break;
      
      case 'squat':
        // Squats prioritize range of motion and alignment
        breakdown.rangeOfMotion *= 1.2;
        breakdown.alignment *= 1.1;
        breakdown.timing *= 0.9;
        break;
      
      case 'plank':
        // Planks are all about posture and consistency
        breakdown.posture *= 1.3;
        breakdown.consistency *= 1.2;
        breakdown.rangeOfMotion *= 0.7; // Less relevant for isometric
        breakdown.timing *= 0.8;
        break;
    }
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    analysis: FormAnalysis,
    breakdown: FormScore['breakdown'],
    exerciseId: string
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Generate suggestions based on lowest scoring areas
    const sortedAreas = Object.entries(breakdown)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3); // Focus on top 3 areas for improvement

    for (const [area, score] of sortedAreas) {
      if (score < 0.8) {
        const suggestion = this.createImprovementSuggestion(
          area as keyof FormScore['breakdown'],
          score,
          exerciseId,
          analysis.issues
        );
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Add issue-specific suggestions
    for (const issue of analysis.issues) {
      if (issue.severity === 'high') {
        const suggestion = this.createIssueSpecificSuggestion(issue, exerciseId);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Sort by priority and expected improvement
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.expectedImprovement - a.expectedImprovement;
      })
      .slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Create improvement suggestion for a specific area
   */
  private createImprovementSuggestion(
    area: keyof FormScore['breakdown'],
    score: number,
    exerciseId: string,
    issues: FormIssue[]
  ): ImprovementSuggestion | null {
    const priority = score < 0.5 ? 'high' : score < 0.7 ? 'medium' : 'low';
    const expectedImprovement = Math.min(30, (0.8 - score) * 100);

    switch (area) {
      case 'alignment':
        return {
          category: 'alignment',
          priority,
          title: 'Improve Body Alignment',
          description: 'Focus on maintaining proper joint alignment throughout the movement',
          actionSteps: [
            'Practice the movement slowly in front of a mirror',
            'Focus on keeping key joints aligned',
            'Use alignment cues specific to the exercise',
            'Record yourself to identify alignment issues',
          ],
          expectedImprovement,
          difficulty: 'moderate',
          timeToImprove: '2-3 weeks',
        };

      case 'rangeOfMotion':
        return {
          category: 'range_of_motion',
          priority,
          title: 'Increase Range of Motion',
          description: 'Work on achieving the full range of motion for maximum effectiveness',
          actionSteps: [
            'Perform mobility exercises before training',
            'Focus on controlled, full-range movements',
            'Gradually increase range as flexibility improves',
            'Hold end positions briefly to improve flexibility',
          ],
          expectedImprovement,
          difficulty: 'moderate',
          timeToImprove: '3-4 weeks',
        };

      case 'posture':
        return {
          category: 'posture',
          priority,
          title: 'Enhance Postural Control',
          description: 'Strengthen core and improve overall postural awareness',
          actionSteps: [
            'Incorporate core strengthening exercises',
            'Practice postural awareness throughout the day',
            'Use breathing techniques to engage core muscles',
            'Start with easier variations to build postural strength',
          ],
          expectedImprovement,
          difficulty: 'challenging',
          timeToImprove: '4-6 weeks',
        };

      case 'timing':
        return {
          category: 'timing',
          priority,
          title: 'Improve Movement Timing',
          description: 'Develop better control over movement speed and rhythm',
          actionSteps: [
            'Practice with a metronome or counting',
            'Focus on controlled eccentric (lowering) phases',
            'Use tempo variations in training',
            'Emphasize quality over speed',
          ],
          expectedImprovement,
          difficulty: 'easy',
          timeToImprove: '1-2 weeks',
        };

      case 'consistency':
        return {
          category: 'consistency',
          priority,
          title: 'Build Movement Consistency',
          description: 'Develop more consistent movement patterns',
          actionSteps: [
            'Practice the same movement pattern repeatedly',
            'Focus on one correction at a time',
            'Use video feedback to identify inconsistencies',
            'Maintain focus throughout the entire set',
          ],
          expectedImprovement,
          difficulty: 'easy',
          timeToImprove: '1-2 weeks',
        };

      default:
        return null;
    }
  }

  /**
   * Create issue-specific suggestion
   */
  private createIssueSpecificSuggestion(
    issue: FormIssue,
    exerciseId: string
  ): ImprovementSuggestion | null {
    return {
      category: issue.type as ImprovementSuggestion['category'],
      priority: issue.severity === 'high' ? 'high' : 'medium',
      title: `Fix: ${issue.description}`,
      description: issue.correction,
      actionSteps: [
        issue.correction,
        'Practice the correction slowly',
        'Get feedback from a trainer or use video analysis',
        'Focus on this specific aspect during your next session',
      ],
      expectedImprovement: issue.severity === 'high' ? 25 : 15,
      difficulty: 'moderate',
      timeToImprove: '1-2 sessions',
    };
  }

  /**
   * Identify strengths from the analysis
   */
  private identifyStrengths(
    breakdown: FormScore['breakdown'],
    analysis: FormAnalysis
  ): string[] {
    const strengths: string[] = [];

    // Identify high-scoring areas
    Object.entries(breakdown).forEach(([area, score]) => {
      if (score >= 0.85) {
        switch (area) {
          case 'alignment':
            strengths.push('Excellent body alignment');
            break;
          case 'rangeOfMotion':
            strengths.push('Good range of motion');
            break;
          case 'posture':
            strengths.push('Strong postural control');
            break;
          case 'timing':
            strengths.push('Well-controlled movement timing');
            break;
          case 'consistency':
            strengths.push('Consistent movement pattern');
            break;
        }
      }
    });

    // Add overall performance strengths
    if (analysis.correctness >= 0.9) {
      strengths.push('Outstanding overall form');
    } else if (analysis.correctness >= 0.8) {
      strengths.push('Very good overall technique');
    }

    return strengths;
  }

  /**
   * Determine priority level based on issues
   */
  private determinePriority(issues: FormIssue[]): 'high' | 'medium' | 'low' {
    const highSeverityCount = issues.filter(issue => issue.severity === 'high').length;
    const mediumSeverityCount = issues.filter(issue => issue.severity === 'medium').length;

    if (highSeverityCount >= 2) return 'high';
    if (highSeverityCount >= 1 || mediumSeverityCount >= 3) return 'medium';
    return 'low';
  }

  /**
   * Update session progress tracking
   */
  private updateSessionProgress(sessionId: string, exerciseId: string, score: FormScore): void {
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        sessionId,
        exerciseId,
        scores: [],
        averageScore: 0,
        improvement: 0,
        consistencyTrend: 'stable',
        recommendations: [],
      });
    }

    const session = this.sessionData.get(sessionId)!;
    session.scores.push(score);

    // Update averages and trends
    session.averageScore = session.scores.reduce((sum, s) => sum + s.overall, 0) / session.scores.length;
    
    if (session.scores.length >= 2) {
      const firstScore = session.scores[0].overall;
      const lastScore = session.scores[session.scores.length - 1].overall;
      session.improvement = ((lastScore - firstScore) / firstScore) * 100;
      
      // Determine trend
      const recentScores = session.scores.slice(-5).map(s => s.overall);
      const trend = this.calculateTrend(recentScores);
      session.consistencyTrend = trend;
    }

    // Update recommendations
    session.recommendations = this.generateSessionRecommendations(session);
  }

  /**
   * Calculate trend from recent scores
   */
  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 3) return 'stable';

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 0.05) return 'improving';
    if (difference < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Generate session-level recommendations
   */
  private generateSessionRecommendations(session: SessionProgress): string[] {
    const recommendations: string[] = [];

    if (session.consistencyTrend === 'improving') {
      recommendations.push('Great progress! Keep focusing on the areas you\'ve been working on.');
    } else if (session.consistencyTrend === 'declining') {
      recommendations.push('Consider taking a short break or reducing intensity to maintain form quality.');
    }

    if (session.averageScore < 0.6) {
      recommendations.push('Focus on mastering the basics before increasing difficulty or speed.');
    } else if (session.averageScore > 0.85) {
      recommendations.push('Excellent form! Consider progressing to more challenging variations.');
    }

    return recommendations;
  }

  /**
   * Get session progress
   */
  getSessionProgress(sessionId: string): SessionProgress | null {
    return this.sessionData.get(sessionId) || null;
  }

  /**
   * Get score history for an exercise
   */
  getScoreHistory(exerciseId: string): FormScore[] {
    return this.scoreHistory.get(exerciseId) || [];
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.sessionData.delete(sessionId);
  }
}

// Export singleton instance
export const formScoringService = new FormScoringService();