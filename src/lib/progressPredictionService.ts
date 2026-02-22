import { Program, UserProgramProfile, ProgressPrediction, Difficulty } from '@/types/program';

export class ProgressPredictionService {
  /**
   * Generate progress predictions for a program
   */
  static generatePrediction(
    program: Program,
    userProfile: UserProgramProfile,
    complianceHistory: number = 85,
    userHistoryMonths: number = 0
  ): ProgressPrediction {
    const timeframe = program.duration;
    
    const muscleMassGain = this.predictMuscleMassGain(
      userProfile.experienceLevel,
      program.goal,
      timeframe,
      complianceHistory,
      userProfile.recoveryQuality
    );

    const fatLoss = this.predictFatLoss(
      program.goal,
      timeframe,
      complianceHistory,
      program.volumeProfile.intensityLevel
    );

    const strengthGain = this.predictStrengthGain(
      userProfile.experienceLevel,
      program.goal,
      timeframe,
      complianceHistory
    );

    const timeCommitment = this.calculateTimeCommitment(program);

    const confidence = this.calculateConfidence(userHistoryMonths, complianceHistory);

    return {
      timeframe,
      muscleMassGain,
      fatLoss,
      strengthGain,
      timeCommitment,
      confidence,
    };
  }

  /**
   * Predict muscle mass gain
   */
  private static predictMuscleMassGain(
    experienceLevel: Difficulty,
    goal: string,
    weeks: number,
    compliance: number,
    recovery: string
  ): { min: number; max: number; expected: number; unit: 'lbs' | 'kg' } {
    // Base rates per week (lbs)
    const baseRates: Record<Difficulty, [number, number]> = {
      beginner: [0.5, 1.0],
      intermediate: [0.25, 0.5],
      advanced: [0.1, 0.25],
    };

    let [minRate, maxRate] = baseRates[experienceLevel];

    // Adjust for goal
    if (goal === 'muscle_gain') {
      minRate *= 1.2;
      maxRate *= 1.2;
    } else if (goal === 'fat_loss') {
      minRate *= 0.5;
      maxRate *= 0.5;
    } else if (goal === 'recomp') {
      minRate *= 0.8;
      maxRate *= 0.8;
    } else if (goal === 'endurance' || goal === 'strength') {
      minRate *= 0.6;
      maxRate *= 0.6;
    }

    // Adjust for compliance
    const complianceMultiplier = compliance / 100;
    minRate *= complianceMultiplier;
    maxRate *= complianceMultiplier;

    // Adjust for recovery
    const recoveryMultipliers: Record<string, number> = {
      excellent: 1.1,
      good: 1.0,
      fair: 0.9,
      poor: 0.7,
    };
    const recoveryMult = recoveryMultipliers[recovery] || 1.0;
    minRate *= recoveryMult;
    maxRate *= recoveryMult;

    const min = parseFloat((minRate * weeks).toFixed(1));
    const max = parseFloat((maxRate * weeks).toFixed(1));
    const expected = parseFloat(((min + max) / 2).toFixed(1));

    return { min, max, expected, unit: 'lbs' };
  }

  /**
   * Predict fat loss
   */
  private static predictFatLoss(
    goal: string,
    weeks: number,
    compliance: number,
    intensity: string
  ): { min: number; max: number; expected: number; unit: 'lbs' | 'kg' } {
    // Base rates per week (lbs)
    let minRate = 0;
    let maxRate = 0;

    if (goal === 'fat_loss') {
      minRate = 1.0;
      maxRate = 2.0;
    } else if (goal === 'recomp') {
      minRate = 0.5;
      maxRate = 1.0;
    } else if (goal === 'endurance') {
      minRate = 0.5;
      maxRate = 1.5;
    } else {
      minRate = 0.2;
      maxRate = 0.5;
    }

    // Adjust for intensity
    const intensityMultipliers: Record<string, number> = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
    };
    const intensityMult = intensityMultipliers[intensity] || 1.0;
    minRate *= intensityMult;
    maxRate *= intensityMult;

    // Adjust for compliance
    const complianceMultiplier = compliance / 100;
    minRate *= complianceMultiplier;
    maxRate *= complianceMultiplier;

    const min = parseFloat((minRate * weeks).toFixed(1));
    const max = parseFloat((maxRate * weeks).toFixed(1));
    const expected = parseFloat(((min + max) / 2).toFixed(1));

    return { min, max, expected, unit: 'lbs' };
  }

  /**
   * Predict strength gains
   */
  private static predictStrengthGain(
    experienceLevel: Difficulty,
    goal: string,
    weeks: number,
    compliance: number
  ): { bench: number; squat: number; deadlift: number; unit: '%' } {
    // Base percentage gains over the timeframe
    const baseGains: Record<Difficulty, [number, number, number]> = {
      beginner: [20, 25, 22],      // [bench, squat, deadlift]
      intermediate: [12, 15, 13],
      advanced: [5, 8, 6],
    };

    let [bench, squat, deadlift] = baseGains[experienceLevel];

    // Adjust for goal
    if (goal === 'strength') {
      bench *= 1.5;
      squat *= 1.5;
      deadlift *= 1.5;
    } else if (goal === 'muscle_gain') {
      bench *= 1.2;
      squat *= 1.2;
      deadlift *= 1.2;
    } else if (goal === 'fat_loss' || goal === 'endurance') {
      bench *= 0.6;
      squat *= 0.6;
      deadlift *= 0.6;
    }

    // Adjust for program duration (longer programs = more gains)
    const durationMultiplier = Math.min(weeks / 8, 1.5);
    bench *= durationMultiplier;
    squat *= durationMultiplier;
    deadlift *= durationMultiplier;

    // Adjust for compliance
    const complianceMultiplier = compliance / 100;
    bench *= complianceMultiplier;
    squat *= complianceMultiplier;
    deadlift *= complianceMultiplier;

    return {
      bench: Math.round(bench),
      squat: Math.round(squat),
      deadlift: Math.round(deadlift),
      unit: '%',
    };
  }

  /**
   * Calculate time commitment
   */
  private static calculateTimeCommitment(program: Program): {
    hoursPerWeek: number;
    totalHours: number;
  } {
    // Calculate average session duration from splits
    const avgDuration = program.splits.reduce((sum, split) => sum + split.estimatedDuration, 0) / program.splits.length;
    
    // Add 10 minutes for warm-up/cool-down
    const sessionDuration = avgDuration + 10;
    
    // Calculate weekly hours
    const hoursPerWeek = parseFloat(((sessionDuration * program.daysPerWeek) / 60).toFixed(1));
    
    // Calculate total hours
    const totalHours = parseFloat((hoursPerWeek * program.duration).toFixed(1));

    return { hoursPerWeek, totalHours };
  }

  /**
   * Calculate prediction confidence
   */
  private static calculateConfidence(userHistoryMonths: number, complianceRate: number): number {
    let confidence = 60; // Base confidence for new users

    // Increase confidence based on history
    if (userHistoryMonths >= 6) {
      confidence = 95;
    } else if (userHistoryMonths >= 3) {
      confidence = 80;
    }

    // Adjust for compliance
    if (complianceRate >= 90) {
      confidence += 5;
    } else if (complianceRate < 70) {
      confidence -= 10;
    }

    return Math.min(Math.max(confidence, 50), 100);
  }

  /**
   * Update predictions based on actual progress
   */
  static updatePrediction(
    originalPrediction: ProgressPrediction,
    actualProgress: {
      muscleMassGained: number;
      fatLost: number;
      strengthGains: { bench: number; squat: number; deadlift: number };
      weeksCompleted: number;
    }
  ): ProgressPrediction {
    const weeksRemaining = originalPrediction.timeframe - actualProgress.weeksCompleted;
    
    if (weeksRemaining <= 0) {
      return originalPrediction;
    }

    // Calculate actual vs predicted rates
    const actualMuscleRate = actualProgress.muscleMassGained / actualProgress.weeksCompleted;
    const predictedMuscleRate = originalPrediction.muscleMassGain.expected / originalPrediction.timeframe;
    
    const actualFatRate = actualProgress.fatLost / actualProgress.weeksCompleted;
    const predictedFatRate = originalPrediction.fatLoss.expected / originalPrediction.timeframe;

    // Adjust future predictions based on actual performance
    const muscleAdjustment = actualMuscleRate / predictedMuscleRate;
    const fatAdjustment = actualFatRate / predictedFatRate;

    return {
      ...originalPrediction,
      muscleMassGain: {
        ...originalPrediction.muscleMassGain,
        expected: parseFloat((actualProgress.muscleMassGained + (actualMuscleRate * weeksRemaining)).toFixed(1)),
        min: parseFloat((actualProgress.muscleMassGained + (actualMuscleRate * weeksRemaining * 0.8)).toFixed(1)),
        max: parseFloat((actualProgress.muscleMassGained + (actualMuscleRate * weeksRemaining * 1.2)).toFixed(1)),
      },
      fatLoss: {
        ...originalPrediction.fatLoss,
        expected: parseFloat((actualProgress.fatLost + (actualFatRate * weeksRemaining)).toFixed(1)),
        min: parseFloat((actualProgress.fatLost + (actualFatRate * weeksRemaining * 0.8)).toFixed(1)),
        max: parseFloat((actualProgress.fatLost + (actualFatRate * weeksRemaining * 1.2)).toFixed(1)),
      },
      confidence: Math.min(originalPrediction.confidence + 10, 100), // Increase confidence with data
    };
  }
}
