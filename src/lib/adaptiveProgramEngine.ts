import { ComplianceMetrics, Adaptation, UserProgramState } from '@/types/program';

export class AdaptiveProgramEngine {
  /**
   * Analyze compliance and determine if adaptations are needed
   */
  static analyzeAndAdapt(
    complianceMetrics: ComplianceMetrics,
    currentWeek: number,
    userState: UserProgramState
  ): Adaptation | null {
    // Check for missed workouts trigger
    if (complianceMetrics.consecutiveMisses >= 2) {
      return this.createVolumeReduction(complianceMetrics);
    }

    // Check for high compliance + fast progress
    if (complianceMetrics.weeklyCompletionRate >= 95 && currentWeek >= 3) {
      const recentCompliance = this.getRecentComplianceRate(userState, 3);
      if (recentCompliance >= 95) {
        return this.createVolumeIncrease();
      }
    }

    // Check for scheduled deload
    const programDeloadWeeks = [4, 8, 12]; // Default deload schedule
    if (programDeloadWeeks.includes(currentWeek)) {
      return this.createDeload(currentWeek);
    }

    return null;
  }

  /**
   * Create volume reduction adaptation
   */
  private static createVolumeReduction(metrics: ComplianceMetrics): Adaptation {
    return {
      date: new Date(),
      type: 'volume',
      reason: `Missed ${metrics.consecutiveMisses} consecutive workouts. Reducing volume to support recovery and consistency.`,
      changes: [
        'Reduce total sets by 15%',
        'Extend deload period by 1 week',
        'Focus on maintaining form and consistency',
        'Consider reducing workout frequency if needed',
      ],
      userNotified: false,
    };
  }

  /**
   * Create volume increase adaptation
   */
  private static createVolumeIncrease(): Adaptation {
    return {
      date: new Date(),
      type: 'volume',
      reason: 'Excellent compliance and progress! Ready for increased training volume.',
      changes: [
        'Increase total sets by 10%',
        'Add 1-2 additional exercises per session',
        'Progress to next phase ahead of schedule',
        'Consider adding an extra training day',
      ],
      userNotified: false,
    };
  }

  /**
   * Create deload adaptation
   */
  private static createDeload(week: number): Adaptation {
    return {
      date: new Date(),
      type: 'deload',
      reason: `Scheduled deload week ${week}. Time to recover and prepare for next phase.`,
      changes: [
        'Reduce volume by 40%',
        'Reduce intensity by 20%',
        'Focus on technique and mobility',
        'Increase rest between sets',
        'Optional: Add extra recovery activities',
      ],
      userNotified: false,
    };
  }

  /**
   * Create intensity reduction adaptation
   */
  static createIntensityReduction(reason: string): Adaptation {
    return {
      date: new Date(),
      type: 'intensity',
      reason,
      changes: [
        'Reduce working weight by 20%',
        'Increase rest periods by 30 seconds',
        'Focus on controlled tempo',
        'Prioritize recovery between sessions',
      ],
      userNotified: false,
    };
  }

  /**
   * Calculate compliance score
   */
  static calculateComplianceScore(metrics: ComplianceMetrics): number {
    const completionWeight = 0.5;
    const consistencyWeight = 0.3;
    const timingWeight = 0.2;

    const completionScore = metrics.weeklyCompletionRate;
    
    const totalCompletions = metrics.onTimeCompletions + metrics.earlyCompletions + metrics.lateCompletions;
    const consistencyScore = totalCompletions > 0
      ? ((metrics.onTimeCompletions + metrics.earlyCompletions) / totalCompletions) * 100
      : 0;
    
    const timingScore = totalCompletions > 0
      ? (metrics.onTimeCompletions / totalCompletions) * 100
      : 0;

    const overallScore = 
      (completionScore * completionWeight) +
      (consistencyScore * consistencyWeight) +
      (timingScore * timingWeight);

    return Math.round(overallScore);
  }

  /**
   * Get recent compliance rate
   */
  private static getRecentComplianceRate(userState: UserProgramState, weeks: number): number {
    // This would query actual workout history
    // For now, return a placeholder
    return 95;
  }

  /**
   * Check if user needs recovery week
   */
  static needsRecoveryWeek(
    fatigueReports: number,
    poorSleepDays: number,
    performanceDecline: boolean
  ): boolean {
    if (fatigueReports >= 4 && poorSleepDays >= 3) return true;
    if (performanceDecline && fatigueReports >= 3) return true;
    return false;
  }

  /**
   * Generate weekly adjustment recommendations
   */
  static generateWeeklyAdjustments(
    complianceMetrics: ComplianceMetrics,
    currentWeek: number,
    userFeedback: {
      fatigue: 'low' | 'medium' | 'high';
      difficulty: 'too_easy' | 'just_right' | 'too_hard';
      enjoyment: number; // 1-5
    }
  ): string[] {
    const recommendations: string[] = [];

    // Compliance-based recommendations
    if (complianceMetrics.weeklyCompletionRate < 70) {
      recommendations.push('Consider reducing workout frequency or duration');
      recommendations.push('Review your schedule and identify barriers');
    } else if (complianceMetrics.weeklyCompletionRate >= 95) {
      recommendations.push('Excellent consistency! Keep up the great work');
    }

    // Fatigue-based recommendations
    if (userFeedback.fatigue === 'high') {
      recommendations.push('High fatigue detected - consider an extra rest day');
      recommendations.push('Focus on sleep quality and nutrition');
    }

    // Difficulty-based recommendations
    if (userFeedback.difficulty === 'too_easy') {
      recommendations.push('Ready for progression - increase weight or reps');
      recommendations.push('Consider moving to next program phase');
    } else if (userFeedback.difficulty === 'too_hard') {
      recommendations.push('Reduce intensity by 10-15%');
      recommendations.push('Ensure adequate rest between sessions');
    }

    // Enjoyment-based recommendations
    if (userFeedback.enjoyment <= 2) {
      recommendations.push('Low enjoyment - consider trying different exercises');
      recommendations.push('Explore alternative programs that match your interests');
    }

    return recommendations;
  }

  /**
   * Predict when user should upgrade program
   */
  static predictUpgradeReadiness(
    weeksCompleted: number,
    programDuration: number,
    complianceRate: number,
    progressRate: number // Actual vs predicted progress
  ): {
    ready: boolean;
    weeksUntilReady: number;
    reason: string;
  } {
    // Completed program
    if (weeksCompleted >= programDuration) {
      return {
        ready: true,
        weeksUntilReady: 0,
        reason: 'Program completed successfully!',
      };
    }

    // Rapid progress
    if (progressRate >= 1.2 && complianceRate >= 90 && weeksCompleted >= programDuration * 0.5) {
      return {
        ready: true,
        weeksUntilReady: 0,
        reason: 'Exceeding expectations - ready for advanced program',
      };
    }

    // On track
    if (complianceRate >= 80) {
      const weeksRemaining = programDuration - weeksCompleted;
      return {
        ready: false,
        weeksUntilReady: weeksRemaining,
        reason: 'Making great progress - complete current program first',
      };
    }

    // Struggling
    return {
      ready: false,
      weeksUntilReady: -1,
      reason: 'Focus on consistency before advancing',
    };
  }
}
