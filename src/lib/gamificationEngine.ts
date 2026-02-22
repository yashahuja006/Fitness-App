import { UserXP } from '@/types/program';

export class GamificationEngine {
  /**
   * Calculate XP for workout completion
   */
  static calculateWorkoutXP(workout: {
    completed: boolean;
    onTime: boolean;
    allSetsCompleted: boolean;
    personalRecordSet: boolean;
  }): number {
    let xp = 0;

    if (workout.completed) {
      xp += 100; // Base XP
      
      if (workout.onTime) {
        xp += 20; // On-time bonus
      }
      
      if (workout.allSetsCompleted) {
        xp += 30; // Completion bonus
      }
      
      if (workout.personalRecordSet) {
        xp += 50; // PR bonus
      }
    }

    return xp;
  }

  /**
   * Calculate streak bonus XP
   */
  static calculateStreakBonus(streakDays: number): number {
    if (streakDays >= 90) return 3000;
    if (streakDays >= 30) return 1000;
    if (streakDays >= 14) return 500;
    if (streakDays >= 7) return 200;
    return 0;
  }

  /**
   * Calculate perfect week bonus
   */
  static calculatePerfectWeekBonus(week: {
    allWorkoutsCompleted: boolean;
    allOnCorrectDays: boolean;
    allFullIntensity: boolean;
  }): number {
    let bonus = 0;

    if (week.allWorkoutsCompleted) {
      bonus += 300;
      
      if (week.allOnCorrectDays) {
        bonus += 100;
      }
      
      if (week.allFullIntensity) {
        bonus += 200;
      }
    }

    return bonus;
  }

  /**
   * Calculate milestone XP
   */
  static calculateMilestoneXP(milestone: string): number {
    const milestones: Record<string, number> = {
      'first_program_completion': 500,
      '10_programs_completed': 2000,
      '100_workouts': 1000,
      '500_workouts': 5000,
      '1000_workouts': 10000,
      'first_pr': 300,
      '50_prs': 1500,
      '100_prs': 3000,
      '30_day_streak': 1000,
      '90_day_streak': 3000,
      '365_day_streak': 10000,
    };

    return milestones[milestone] || 0;
  }

  /**
   * Calculate user level from total XP
   */
  static calculateLevel(totalXP: number): number {
    // Level progression: 1000, 2500, 5000, 10000, 15000, 22000, 30000...
    const levels = [
      0,      // Level 1
      1000,   // Level 2
      2500,   // Level 3
      5000,   // Level 4
      10000,  // Level 5
      15000,  // Level 6
      22000,  // Level 7
      30000,  // Level 8
      40000,  // Level 9
      52000,  // Level 10
    ];

    // After level 10, exponential scaling
    let level = 1;
    for (let i = 0; i < levels.length; i++) {
      if (totalXP >= levels[i]) {
        level = i + 1;
      } else {
        break;
      }
    }

    // Handle levels beyond 10
    if (totalXP >= levels[levels.length - 1]) {
      let xpForNextLevel = levels[levels.length - 1];
      let currentLevel = levels.length;
      
      while (totalXP >= xpForNextLevel) {
        currentLevel++;
        xpForNextLevel += currentLevel * 5000; // Each level requires 5000 * level more XP
      }
      
      level = currentLevel;
    }

    return level;
  }

  /**
   * Get XP required for next level
   */
  static getXPForNextLevel(currentLevel: number): number {
    const levels = [0, 1000, 2500, 5000, 10000, 15000, 22000, 30000, 40000, 52000];
    
    if (currentLevel < levels.length) {
      return levels[currentLevel];
    }
    
    // For levels beyond 10
    let xpRequired = levels[levels.length - 1];
    for (let i = levels.length; i <= currentLevel; i++) {
      xpRequired += i * 5000;
    }
    
    return xpRequired;
  }

  /**
   * Get current level XP (XP within current level)
   */
  static getCurrentLevelXP(totalXP: number, level: number): number {
    const previousLevelXP = this.getXPForNextLevel(level - 1);
    return totalXP - previousLevelXP;
  }

  /**
   * Get XP needed for next level
   */
  static getXPNeededForNextLevel(totalXP: number, level: number): number {
    const nextLevelXP = this.getXPForNextLevel(level);
    const previousLevelXP = this.getXPForNextLevel(level - 1);
    const currentLevelXP = totalXP - previousLevelXP;
    const xpNeededInLevel = nextLevelXP - previousLevelXP;
    
    return xpNeededInLevel - currentLevelXP;
  }

  /**
   * Update user XP
   */
  static updateUserXP(currentXP: UserXP, xpToAdd: number, source: keyof UserXP['xpSources']): UserXP {
    const newTotalXP = currentXP.totalXP + xpToAdd;
    const newLevel = this.calculateLevel(newTotalXP);
    const currentLevelXP = this.getCurrentLevelXP(newTotalXP, newLevel);
    const nextLevelXP = this.getXPForNextLevel(newLevel);
    const previousLevelXP = this.getXPForNextLevel(newLevel - 1);
    const xpNeededInLevel = nextLevelXP - previousLevelXP;

    return {
      totalXP: newTotalXP,
      level: newLevel,
      currentLevelXP,
      nextLevelXP: xpNeededInLevel,
      xpSources: {
        ...currentXP.xpSources,
        [source]: currentXP.xpSources[source] + xpToAdd,
      },
    };
  }

  /**
   * Check for level up
   */
  static checkLevelUp(oldXP: UserXP, newXP: UserXP): boolean {
    return newXP.level > oldXP.level;
  }

  /**
   * Get level title
   */
  static getLevelTitle(level: number): string {
    if (level === 1) return 'Beginner';
    if (level <= 3) return 'Novice';
    if (level <= 5) return 'Intermediate';
    if (level <= 7) return 'Advanced';
    if (level <= 10) return 'Expert';
    if (level <= 15) return 'Master';
    if (level <= 20) return 'Elite';
    return 'Legend';
  }

  /**
   * Get achievements for display
   */
  static getAchievements(userStats: {
    totalWorkouts: number;
    programsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalPRs: number;
  }): Array<{
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    progress: number;
    xpReward: number;
  }> {
    return [
      {
        id: 'first_workout',
        name: 'First Steps',
        description: 'Complete your first workout',
        unlocked: userStats.totalWorkouts >= 1,
        progress: Math.min(userStats.totalWorkouts, 1),
        xpReward: 100,
      },
      {
        id: '100_workouts',
        name: 'Century Club',
        description: 'Complete 100 workouts',
        unlocked: userStats.totalWorkouts >= 100,
        progress: Math.min(userStats.totalWorkouts / 100, 1),
        xpReward: 1000,
      },
      {
        id: '500_workouts',
        name: 'Iron Warrior',
        description: 'Complete 500 workouts',
        unlocked: userStats.totalWorkouts >= 500,
        progress: Math.min(userStats.totalWorkouts / 500, 1),
        xpReward: 5000,
      },
      {
        id: 'first_program',
        name: 'Program Graduate',
        description: 'Complete your first program',
        unlocked: userStats.programsCompleted >= 1,
        progress: Math.min(userStats.programsCompleted, 1),
        xpReward: 500,
      },
      {
        id: '10_programs',
        name: 'Dedicated Athlete',
        description: 'Complete 10 programs',
        unlocked: userStats.programsCompleted >= 10,
        progress: Math.min(userStats.programsCompleted / 10, 1),
        xpReward: 2000,
      },
      {
        id: '7_day_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        unlocked: userStats.currentStreak >= 7 || userStats.longestStreak >= 7,
        progress: Math.min(userStats.currentStreak / 7, 1),
        xpReward: 200,
      },
      {
        id: '30_day_streak',
        name: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        unlocked: userStats.currentStreak >= 30 || userStats.longestStreak >= 30,
        progress: Math.min(userStats.currentStreak / 30, 1),
        xpReward: 1000,
      },
      {
        id: '90_day_streak',
        name: 'Consistency King',
        description: 'Maintain a 90-day streak',
        unlocked: userStats.currentStreak >= 90 || userStats.longestStreak >= 90,
        progress: Math.min(userStats.currentStreak / 90, 1),
        xpReward: 3000,
      },
      {
        id: 'first_pr',
        name: 'Personal Best',
        description: 'Set your first personal record',
        unlocked: userStats.totalPRs >= 1,
        progress: Math.min(userStats.totalPRs, 1),
        xpReward: 300,
      },
      {
        id: '50_prs',
        name: 'Progress Machine',
        description: 'Set 50 personal records',
        unlocked: userStats.totalPRs >= 50,
        progress: Math.min(userStats.totalPRs / 50, 1),
        xpReward: 1500,
      },
    ];
  }

  /**
   * Calculate weekly performance score
   */
  static calculateWeeklyScore(weekData: {
    scheduledWorkouts: number;
    completedWorkouts: number;
    onTimeWorkouts: number;
    averageIntensity: number; // 0-10 scale
    progressionCount: number; // Number of exercises with weight/rep increases
  }): {
    score: number;
    breakdown: {
      completion: number;
      consistency: number;
      intensity: number;
      progression: number;
    };
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  } {
    // Completion score (40 points max)
    const completionScore = (weekData.completedWorkouts / weekData.scheduledWorkouts) * 40;

    // Consistency score (30 points max)
    const consistencyScore = weekData.completedWorkouts > 0
      ? (weekData.onTimeWorkouts / weekData.completedWorkouts) * 30
      : 0;

    // Intensity score (20 points max)
    const intensityScore = (weekData.averageIntensity / 10) * 20;

    // Progression score (10 points max)
    const progressionScore = Math.min((weekData.progressionCount / weekData.completedWorkouts) * 10, 10);

    const totalScore = Math.round(
      completionScore + consistencyScore + intensityScore + progressionScore
    );

    // Determine grade
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (totalScore >= 95) grade = 'A+';
    else if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: totalScore,
      breakdown: {
        completion: Math.round(completionScore),
        consistency: Math.round(consistencyScore),
        intensity: Math.round(intensityScore),
        progression: Math.round(progressionScore),
      },
      grade,
    };
  }
}
