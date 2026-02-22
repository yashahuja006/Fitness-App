import { UserXP } from '@/types/program';
import { GamificationEngine } from './gamificationEngine';
import { WorkoutSession } from '@/types/workout';

export class WorkoutGamificationService {
  /**
   * Process workout completion and award XP
   */
  static processWorkoutCompletion(workout: WorkoutSession): {
    xpEarned: number;
    newXP: UserXP;
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    achievementsUnlocked: string[];
  } {
    // Load current XP
    const currentXP = this.loadUserXP();
    const oldLevel = currentXP.level;

    // Calculate XP for this workout
    const workoutXP = GamificationEngine.calculateWorkoutXP({
      completed: true,
      onTime: this.isWorkoutOnTime(workout),
      allSetsCompleted: this.areAllSetsCompleted(workout),
      personalRecordSet: this.hasPersonalRecord(workout),
    });

    // Update XP
    const newXP = GamificationEngine.updateUserXP(currentXP, workoutXP, 'workoutCompletion');
    const leveledUp = GamificationEngine.checkLevelUp(currentXP, newXP);

    // Save updated XP
    this.saveUserXP(newXP);

    // Update streak
    this.updateStreak(workout.startTime);

    // Check for achievements
    const achievementsUnlocked = this.checkAchievements(newXP);

    // Update workout history
    this.updateWorkoutHistory(workout);

    return {
      xpEarned: workoutXP,
      newXP,
      leveledUp,
      oldLevel,
      newLevel: newXP.level,
      achievementsUnlocked,
    };
  }

  /**
   * Check if workout was completed on time
   */
  private static isWorkoutOnTime(workout: WorkoutSession): boolean {
    // Check if workout was completed within scheduled time
    // For now, assume all workouts are on time
    return true;
  }

  /**
   * Check if all sets were completed
   */
  private static areAllSetsCompleted(workout: WorkoutSession): boolean {
    if (workout.exercises.length === 0) return false;
    
    return workout.exercises.every(exercise => {
      const completedSets = exercise.sets.filter(set => set.completed).length;
      return completedSets >= exercise.targetSets;
    });
  }

  /**
   * Check if workout contains a personal record
   */
  private static hasPersonalRecord(workout: WorkoutSession): boolean {
    // Check workout history for PRs
    // For now, return false (will implement PR tracking later)
    return false;
  }

  /**
   * Update user streak
   */
  private static updateStreak(workoutDate: Date): void {
    const streakData = this.loadStreakData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const workoutDay = new Date(workoutDate);
    workoutDay.setHours(0, 0, 0, 0);

    const lastWorkoutDate = streakData.lastWorkoutDate 
      ? new Date(streakData.lastWorkoutDate)
      : null;

    if (lastWorkoutDate) {
      lastWorkoutDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((workoutDay.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day - increment streak
        streakData.currentStreak++;
        
        // Check for streak bonuses
        const streakBonus = GamificationEngine.calculateStreakBonus(streakData.currentStreak);
        if (streakBonus > 0) {
          const currentXP = this.loadUserXP();
          const newXP = GamificationEngine.updateUserXP(currentXP, streakBonus, 'streakBonus');
          this.saveUserXP(newXP);
        }
      } else if (daysDiff > 1) {
        // Streak broken
        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }
        streakData.currentStreak = 1;
      }
      // daysDiff === 0 means same day, don't change streak
    } else {
      // First workout
      streakData.currentStreak = 1;
    }

    streakData.lastWorkoutDate = workoutDay.toISOString();
    
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    this.saveStreakData(streakData);
  }

  /**
   * Check for newly unlocked achievements
   */
  private static checkAchievements(newXP: UserXP): string[] {
    const unlockedAchievements: string[] = [];
    const workoutHistory = this.getWorkoutHistory();
    const totalWorkouts = workoutHistory.length;
    const streakData = this.loadStreakData();

    // Load previously unlocked achievements
    const previouslyUnlocked = this.loadUnlockedAchievements();

    // Check workout count achievements
    if (totalWorkouts === 1 && !previouslyUnlocked.includes('first_workout')) {
      unlockedAchievements.push('first_workout');
      this.awardMilestoneXP('first_workout');
    }
    if (totalWorkouts === 100 && !previouslyUnlocked.includes('100_workouts')) {
      unlockedAchievements.push('100_workouts');
      this.awardMilestoneXP('100_workouts');
    }
    if (totalWorkouts === 500 && !previouslyUnlocked.includes('500_workouts')) {
      unlockedAchievements.push('500_workouts');
      this.awardMilestoneXP('500_workouts');
    }

    // Check streak achievements
    if (streakData.currentStreak === 7 && !previouslyUnlocked.includes('7_day_streak')) {
      unlockedAchievements.push('7_day_streak');
      this.awardMilestoneXP('7_day_streak');
    }
    if (streakData.currentStreak === 30 && !previouslyUnlocked.includes('30_day_streak')) {
      unlockedAchievements.push('30_day_streak');
      this.awardMilestoneXP('30_day_streak');
    }
    if (streakData.currentStreak === 90 && !previouslyUnlocked.includes('90_day_streak')) {
      unlockedAchievements.push('90_day_streak');
      this.awardMilestoneXP('90_day_streak');
    }

    // Save newly unlocked achievements
    if (unlockedAchievements.length > 0) {
      this.saveUnlockedAchievements([...previouslyUnlocked, ...unlockedAchievements]);
    }

    return unlockedAchievements;
  }

  /**
   * Award milestone XP
   */
  private static awardMilestoneXP(milestone: string): void {
    const xp = GamificationEngine.calculateMilestoneXP(milestone);
    if (xp > 0) {
      const currentXP = this.loadUserXP();
      const newXP = GamificationEngine.updateUserXP(currentXP, xp, 'milestones');
      this.saveUserXP(newXP);
    }
  }

  /**
   * Update workout history
   */
  private static updateWorkoutHistory(workout: WorkoutSession): void {
    const history = this.getWorkoutHistory();
    history.push(workout);
    localStorage.setItem('workoutHistory', JSON.stringify(history));
  }

  /**
   * Get workout history
   */
  private static getWorkoutHistory(): WorkoutSession[] {
    const history = localStorage.getItem('workoutHistory');
    return history ? JSON.parse(history) : [];
  }

  /**
   * Load user XP
   */
  private static loadUserXP(): UserXP {
    const saved = localStorage.getItem('userXP');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Return default XP
    return {
      totalXP: 0,
      level: 1,
      currentLevelXP: 0,
      nextLevelXP: 1000,
      xpSources: {
        workoutCompletion: 0,
        streakBonus: 0,
        milestones: 0,
        perfectWeeks: 0,
      },
    };
  }

  /**
   * Save user XP
   */
  private static saveUserXP(xp: UserXP): void {
    localStorage.setItem('userXP', JSON.stringify(xp));
  }

  /**
   * Load streak data
   */
  private static loadStreakData(): {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
  } {
    const saved = localStorage.getItem('streakData');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
    };
  }

  /**
   * Save streak data
   */
  private static saveStreakData(data: {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
  }): void {
    localStorage.setItem('streakData', JSON.stringify(data));
  }

  /**
   * Load unlocked achievements
   */
  private static loadUnlockedAchievements(): string[] {
    const saved = localStorage.getItem('unlockedAchievements');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Save unlocked achievements
   */
  private static saveUnlockedAchievements(achievements: string[]): void {
    localStorage.setItem('unlockedAchievements', JSON.stringify(achievements));
  }

  /**
   * Get current streak
   */
  static getCurrentStreak(): number {
    const streakData = this.loadStreakData();
    return streakData.currentStreak;
  }

  /**
   * Get longest streak
   */
  static getLongestStreak(): number {
    const streakData = this.loadStreakData();
    return streakData.longestStreak;
  }

  /**
   * Get total workouts
   */
  static getTotalWorkouts(): number {
    return this.getWorkoutHistory().length;
  }

  /**
   * Get user stats for achievements
   */
  static getUserStats() {
    const workoutHistory = this.getWorkoutHistory();
    const streakData = this.loadStreakData();
    
    return {
      totalWorkouts: workoutHistory.length,
      programsCompleted: 0, // TODO: Track program completions
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      totalPRs: 0, // TODO: Track personal records
    };
  }
}
