import { Program, UserProgramProfile, ProgramScore, Goal, Difficulty } from '@/types/program';

export class ProgramScoringEngine {
  /**
   * Score a program based on user profile
   * Returns detailed scoring breakdown with reasoning
   */
  static scoreProgram(program: Program, userProfile: UserProgramProfile): ProgramScore {
    const goalScore = this.calculateGoalAlignment(program.goal, userProfile.primaryGoal);
    const experienceScore = this.calculateExperienceMatch(program.difficulty, userProfile.experienceLevel);
    const timeScore = this.calculateTimeCommitment(program.daysPerWeek, userProfile.daysPerWeek);
    const equipmentScore = this.calculateEquipmentMatch(program.equipment, userProfile.equipment);
    const recoveryScore = this.calculateRecoveryFit(program.volumeProfile.intensityLevel, userProfile.recoveryQuality);

    const totalScore = goalScore + experienceScore + timeScore + equipmentScore + recoveryScore;
    const confidence = this.determineConfidence(totalScore);
    const reasoning = this.generateReasoning(program, userProfile, {
      goalScore,
      experienceScore,
      timeScore,
      equipmentScore,
      recoveryScore,
    });

    return {
      programId: program.id,
      totalScore,
      breakdown: {
        goalAlignment: goalScore,
        experienceMatch: experienceScore,
        timeCommitment: timeScore,
        equipmentMatch: equipmentScore,
        recoveryFit: recoveryScore,
      },
      confidence,
      reasoning,
      rank: 0, // Will be set after sorting
    };
  }

  /**
   * Score all programs and return ranked list
   */
  static scoreAllPrograms(programs: Program[], userProfile: UserProgramProfile): ProgramScore[] {
    const scores = programs.map(program => this.scoreProgram(program, userProfile));
    
    // Sort by total score descending
    scores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign ranks
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });

    return scores;
  }

  /**
   * Calculate goal alignment score (0-30 points)
   */
  private static calculateGoalAlignment(programGoal: Goal, userGoal: Goal): number {
    // Perfect match
    if (programGoal === userGoal) return 30;

    // Compatible goals
    const compatibilityMap: Record<Goal, Goal[]> = {
      muscle_gain: ['recomp', 'strength'],
      fat_loss: ['recomp', 'endurance'],
      recomp: ['muscle_gain', 'fat_loss'],
      endurance: ['fat_loss'],
      strength: ['muscle_gain'],
    };

    if (compatibilityMap[userGoal]?.includes(programGoal)) return 20;

    // Suboptimal but not terrible
    if (programGoal === 'recomp') return 10;

    // Mismatch
    return 0;
  }

  /**
   * Calculate experience match score (0-25 points)
   */
  private static calculateExperienceMatch(programDifficulty: Difficulty, userLevel: Difficulty): number {
    const levels: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
    const programIndex = levels.indexOf(programDifficulty);
    const userIndex = levels.indexOf(userLevel);
    const difference = Math.abs(programIndex - userIndex);

    if (difference === 0) return 25; // Perfect match
    if (difference === 1) return 15; // One level off
    return 5; // Two levels off
  }

  /**
   * Calculate time commitment score (0-20 points)
   */
  private static calculateTimeCommitment(programDays: number, userDays: number): number {
    if (userDays >= programDays) return 20; // User has enough time
    if (userDays === programDays - 1) return 12; // 1 day short
    return 0; // 2+ days short
  }

  /**
   * Calculate equipment match score (0-15 points)
   */
  private static calculateEquipmentMatch(programEquipment: string[], userEquipment: string[]): number {
    if (programEquipment.includes('None')) return 15; // Bodyweight program

    const matchCount = programEquipment.filter(eq => 
      userEquipment.includes(eq) || userEquipment.includes('Full gym')
    ).length;

    const matchPercentage = matchCount / programEquipment.length;

    if (matchPercentage === 1) return 15; // All equipment available
    if (matchPercentage >= 0.8) return 10; // 80%+ available
    if (matchPercentage >= 0.5) return 5; // 50-80% available
    return 0; // <50% available
  }

  /**
   * Calculate recovery fit score (0-10 points)
   */
  private static calculateRecoveryFit(programIntensity: 'low' | 'medium' | 'high', recoveryQuality: string): number {
    const recoveryCapacity: Record<string, number> = {
      excellent: 3,
      good: 2,
      fair: 1,
      poor: 0,
    };

    const intensityDemand: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };

    const capacity = recoveryCapacity[recoveryQuality] || 1;
    const demand = intensityDemand[programIntensity] || 2;

    if (capacity >= demand) return 10; // Good fit
    if (capacity === demand - 1) return 6; // Slightly high
    return 0; // Too demanding
  }

  /**
   * Determine confidence level based on total score
   */
  private static determineConfidence(totalScore: number): 'high' | 'medium' | 'low' {
    if (totalScore >= 80) return 'high';
    if (totalScore >= 60) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(
    program: Program,
    userProfile: UserProgramProfile,
    scores: {
      goalScore: number;
      experienceScore: number;
      timeScore: number;
      equipmentScore: number;
      recoveryScore: number;
    }
  ): string[] {
    const reasoning: string[] = [];

    // Goal alignment
    if (scores.goalScore === 30) {
      reasoning.push(`Perfect match for your ${userProfile.primaryGoal.replace('_', ' ')} goal`);
    } else if (scores.goalScore === 20) {
      reasoning.push(`Compatible with your ${userProfile.primaryGoal.replace('_', ' ')} goal`);
    } else if (scores.goalScore < 15) {
      reasoning.push(`Not optimized for ${userProfile.primaryGoal.replace('_', ' ')}`);
    }

    // Experience level
    if (scores.experienceScore === 25) {
      reasoning.push(`Designed for ${userProfile.experienceLevel} lifters like you`);
    } else if (scores.experienceScore === 15) {
      reasoning.push(`Slightly ${program.difficulty === 'advanced' ? 'challenging' : 'easy'} for your level`);
    } else {
      reasoning.push(`May be too ${program.difficulty === 'advanced' ? 'advanced' : 'basic'} for you`);
    }

    // Time commitment
    if (scores.timeScore === 20) {
      reasoning.push(`Fits your ${userProfile.daysPerWeek} days/week schedule perfectly`);
    } else if (scores.timeScore === 12) {
      reasoning.push(`Requires ${program.daysPerWeek} days/week (you have ${userProfile.daysPerWeek})`);
    } else {
      reasoning.push(`Needs ${program.daysPerWeek} days/week - may be too demanding`);
    }

    // Equipment
    if (scores.equipmentScore === 15) {
      reasoning.push('You have all required equipment');
    } else if (scores.equipmentScore >= 10) {
      reasoning.push('You have most required equipment');
    } else if (scores.equipmentScore > 0) {
      reasoning.push('Missing some required equipment');
    } else {
      reasoning.push('Requires equipment you don\'t have');
    }

    // Recovery
    if (scores.recoveryScore === 10) {
      reasoning.push('Volume matches your recovery capacity');
    } else if (scores.recoveryScore === 6) {
      reasoning.push('Slightly high volume for your recovery');
    } else {
      reasoning.push('High volume may impact recovery');
    }

    return reasoning;
  }

  /**
   * Get top N recommendations
   */
  static getTopRecommendations(programs: Program[], userProfile: UserProgramProfile, count: number = 3): ProgramScore[] {
    const scores = this.scoreAllPrograms(programs, userProfile);
    return scores.slice(0, count);
  }

  /**
   * Check if user should upgrade program
   */
  static shouldUpgradeProgram(
    currentProgram: Program,
    userProfile: UserProgramProfile,
    weeksCompleted: number,
    complianceRate: number
  ): { shouldUpgrade: boolean; reason: string; suggestedPrograms: string[] } {
    // Completed program
    if (weeksCompleted >= currentProgram.duration) {
      return {
        shouldUpgrade: true,
        reason: 'Program completed! Time for a new challenge.',
        suggestedPrograms: this.getSuggestedUpgrades(currentProgram, userProfile),
      };
    }

    // High compliance + rapid progress
    if (complianceRate >= 95 && weeksCompleted >= currentProgram.duration * 0.5) {
      return {
        shouldUpgrade: true,
        reason: 'Excellent progress! You\'re ready for more advanced training.',
        suggestedPrograms: this.getSuggestedUpgrades(currentProgram, userProfile),
      };
    }

    return {
      shouldUpgrade: false,
      reason: 'Keep going! You\'re making great progress.',
      suggestedPrograms: [],
    };
  }

  /**
   * Get suggested program upgrades
   */
  private static getSuggestedUpgrades(currentProgram: Program, userProfile: UserProgramProfile): string[] {
    // Suggest next difficulty level
    const nextLevel: Record<Difficulty, Difficulty> = {
      beginner: 'intermediate',
      intermediate: 'advanced',
      advanced: 'advanced',
    };

    const targetDifficulty = nextLevel[currentProgram.difficulty];
    
    // Return program IDs that match goal and next difficulty
    return [
      `${currentProgram.goal}-${targetDifficulty}`,
      `${currentProgram.goal}-specialization`,
      'advanced-program',
    ];
  }
}
