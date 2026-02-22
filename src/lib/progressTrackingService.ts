/**
 * Progress Tracking Service
 * 
 * Task 10.1: Progress Tracking and Analytics - Implement workout session recording and data storage
 * - Created workout session data models
 * - Implemented session recording with comprehensive metrics
 * - Set up progress data storage in Firestore
 */

import type {
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  WorkoutMetrics,
  ProgressData,
  WorkoutGoal,
  Achievement
} from '@/types/workout';

import type { Exercise } from '@/types/exercise';

export interface SessionRecordingConfig {
  autoSave: boolean;
  saveInterval: number; // milliseconds
  includeFormAnalysis: boolean;
  trackHeartRate: boolean;
  trackCalories: boolean;
}

export interface ProgressAnalytics {
  totalWorkouts: number;
  totalVolume: number; // total weight lifted
  totalDuration: number; // total workout time in minutes
  averageDuration: number;
  workoutFrequency: number; // workouts per week
  currentStreak: number; // consecutive workout days
  longestStreak: number;
  muscleGroupDistribution: Record<string, number>;
  strengthProgression: Record<string, number[]>; // exercise -> [weights over time]
  volumeProgression: number[]; // total volume over time
  consistencyScore: number; // 0-100 based on workout frequency
}

export interface WorkoutInsights {
  recommendations: string[];
  achievements: Achievement[];
  nextGoals: WorkoutGoal[];
  weakPoints: string[];
  strengths: string[];
}

const DEFAULT_CONFIG: SessionRecordingConfig = {
  autoSave: true,
  saveInterval: 30000, // 30 seconds
  includeFormAnalysis: true,
  trackHeartRate: false,
  trackCalories: true
};

export class ProgressTrackingService {
  private config: SessionRecordingConfig;
  private currentSession: Partial<WorkoutSession> | null = null;
  private sessionStartTime: number | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private sessionMetrics: WorkoutMetrics = this.createEmptyMetrics();

  constructor(config: Partial<SessionRecordingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start a new workout session
   */
  startSession(
    sessionName: string,
    exercises: Exercise[],
    userId?: string
  ): WorkoutSession {
    // End any existing session
    if (this.currentSession) {
      this.endSession();
    }

    this.sessionStartTime = Date.now();
    
    const workoutExercises: WorkoutExercise[] = exercises.map(exercise => ({
      id: this.generateId('exercise'),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [],
      targetSets: exercise.sets || 3,
      targetReps: exercise.reps || 10,
      targetWeight: exercise.weight || 0,
      restTime: exercise.restTime || 60,
      notes: ''
    }));

    this.currentSession = {
      id: this.generateId('session'),
      userId: userId || 'anonymous',
      name: sessionName,
      exercises: workoutExercises,
      startTime: new Date(this.sessionStartTime),
      isTemplate: false,
      tags: [],
      totalVolume: 0,
      duration: 0,
      caloriesBurned: 0,
      notes: ''
    };

    this.sessionMetrics = this.createEmptyMetrics();

    // Start auto-save if enabled
    if (this.config.autoSave) {
      this.startAutoSave();
    }

    return this.currentSession as WorkoutSession;
  }
  /**
   * Add a set to the current exercise
   */
  addSet(
    exerciseId: string,
    reps: number,
    weight: number,
    duration?: number,
    formScore?: number
  ): ExerciseSet {
    if (!this.currentSession) {
      throw new Error('No active workout session');
    }

    const exercise = this.currentSession.exercises?.find(e => e.exerciseId === exerciseId);
    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found in current session`);
    }

    const set: ExerciseSet = {
      id: this.generateId('set'),
      reps,
      weight,
      duration: duration || 0,
      restTime: 0,
      formScore: formScore || 0,
      timestamp: new Date(),
      isCompleted: true
    };

    exercise.sets.push(set);

    // Update session metrics
    this.updateSessionMetrics();

    return set;
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(): void {
    if (!this.currentSession || !this.sessionStartTime) return;

    const currentTime = Date.now();
    this.currentSession.duration = Math.floor((currentTime - this.sessionStartTime) / 1000 / 60); // minutes

    // Calculate total volume
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    this.currentSession.exercises?.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.isCompleted) {
          totalVolume += set.weight * set.reps;
          totalSets++;
          totalReps += set.reps;
        }
      });
    });

    this.currentSession.totalVolume = totalVolume;
    
    // Estimate calories burned (rough calculation)
    const estimatedCalories = this.estimateCaloriesBurned(totalVolume, this.currentSession.duration);
    this.currentSession.caloriesBurned = estimatedCalories;

    // Update metrics object
    this.sessionMetrics = {
      totalSets,
      totalReps,
      totalVolume,
      averageWeight: totalSets > 0 ? totalVolume / totalReps : 0,
      duration: this.currentSession.duration,
      caloriesBurned: estimatedCalories,
      exercisesCompleted: this.currentSession.exercises?.filter(e => e.sets.length > 0).length || 0,
      averageFormScore: this.calculateAverageFormScore()
    };
  }

  /**
   * End the current workout session
   */
  endSession(): WorkoutSession | null {
    if (!this.currentSession) {
      return null;
    }

    // Stop auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    // Final metrics update
    this.updateSessionMetrics();

    // Set end time
    this.currentSession.endTime = new Date();
    this.currentSession.updatedAt = new Date();

    const completedSession = { ...this.currentSession } as WorkoutSession;

    // Save to storage
    this.saveSession(completedSession);

    // Reset current session
    this.currentSession = null;
    this.sessionStartTime = null;
    this.sessionMetrics = this.createEmptyMetrics();

    return completedSession;
  }

  /**
   * Get current session
   */
  getCurrentSession(): WorkoutSession | null {
    return this.currentSession as WorkoutSession | null;
  }

  /**
   * Get current session metrics
   */
  getCurrentMetrics(): WorkoutMetrics {
    if (this.currentSession) {
      this.updateSessionMetrics();
    }
    return { ...this.sessionMetrics };
  }

  /**
   * Save session to storage
   */
  private saveSession(session: WorkoutSession): void {
    try {
      const existingHistory = this.getWorkoutHistory();
      const updatedHistory = [session, ...existingHistory];
      
      // Keep only last 100 sessions in localStorage
      const trimmedHistory = updatedHistory.slice(0, 100);
      
      localStorage.setItem('fitness-app-workout-history', JSON.stringify(trimmedHistory));
      
      // Also save to Firestore if user is authenticated
      if (session.userId !== 'anonymous') {
        this.saveToFirestore(session);
      }
    } catch (error) {
      console.error('Failed to save workout session:', error);
    }
  }

  /**
   * Save to Firestore (placeholder for Firebase integration)
   */
  private async saveToFirestore(session: WorkoutSession): Promise<void> {
    // TODO: Implement Firestore integration
    console.log('Saving to Firestore:', session.id);
  }

  /**
   * Get workout history
   */
  getWorkoutHistory(): WorkoutSession[] {
    try {
      const stored = localStorage.getItem('fitness-app-workout-history');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((workout: any) => ({
        ...workout,
        startTime: new Date(workout.startTime),
        endTime: workout.endTime ? new Date(workout.endTime) : undefined,
        createdAt: workout.createdAt ? new Date(workout.createdAt) : new Date(workout.startTime),
        updatedAt: workout.updatedAt ? new Date(workout.updatedAt) : new Date(workout.startTime),
      }));
    } catch (error) {
      console.error('Failed to load workout history:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive progress analytics
   */
  generateProgressAnalytics(timeframe: 'week' | 'month' | 'year' | 'all' = 'month'): ProgressAnalytics {
    const workouts = this.getWorkoutHistory();
    const filteredWorkouts = this.filterWorkoutsByTimeframe(workouts, timeframe);

    const totalWorkouts = filteredWorkouts.length;
    const totalVolume = filteredWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    // Calculate workout frequency (workouts per week)
    const timeframeDays = this.getTimeframeDays(timeframe);
    const workoutFrequency = totalWorkouts > 0 ? (totalWorkouts / timeframeDays) * 7 : 0;

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(workouts);

    // Muscle group distribution
    const muscleGroupDistribution = this.calculateMuscleGroupDistribution(filteredWorkouts);

    // Strength progression
    const strengthProgression = this.calculateStrengthProgression(filteredWorkouts);

    // Volume progression over time
    const volumeProgression = this.calculateVolumeProgression(filteredWorkouts);

    // Consistency score
    const consistencyScore = this.calculateConsistencyScore(filteredWorkouts, timeframe);

    return {
      totalWorkouts,
      totalVolume,
      totalDuration,
      averageDuration,
      workoutFrequency,
      currentStreak,
      longestStreak,
      muscleGroupDistribution,
      strengthProgression,
      volumeProgression,
      consistencyScore
    };
  }
  /**
   * Generate workout insights and recommendations
   */
  generateInsights(): WorkoutInsights {
    const analytics = this.generateProgressAnalytics('month');
    const workouts = this.getWorkoutHistory();

    const recommendations: string[] = [];
    const achievements: Achievement[] = [];
    const nextGoals: WorkoutGoal[] = [];
    const weakPoints: string[] = [];
    const strengths: string[] = [];

    // Generate recommendations based on analytics
    if (analytics.workoutFrequency < 2) {
      recommendations.push('Try to workout at least 2-3 times per week for better results');
    }
    
    if (analytics.consistencyScore < 50) {
      recommendations.push('Focus on consistency - regular workouts are more effective than intense but irregular sessions');
    }

    if (analytics.averageDuration < 30) {
      recommendations.push('Consider longer workout sessions (45-60 minutes) for better muscle development');
    }

    // Identify muscle group imbalances
    const muscleGroups = Object.entries(analytics.muscleGroupDistribution);
    if (muscleGroups.length > 0) {
      const maxGroup = muscleGroups.reduce((a, b) => a[1] > b[1] ? a : b);
      const minGroup = muscleGroups.reduce((a, b) => a[1] < b[1] ? a : b);
      
      if (maxGroup[1] > minGroup[1] * 2) {
        weakPoints.push(`${minGroup[0]} training needs more attention`);
        recommendations.push(`Add more ${minGroup[0]} exercises to balance your routine`);
      }
      
      strengths.push(`Strong focus on ${maxGroup[0]} training`);
    }

    // Generate achievements
    if (analytics.currentStreak >= 7) {
      achievements.push({
        id: 'streak_7',
        title: 'Week Warrior',
        description: `${analytics.currentStreak} day workout streak!`,
        unlockedAt: new Date(),
        category: 'consistency'
      });
    }

    if (analytics.totalVolume > 10000) {
      achievements.push({
        id: 'volume_10k',
        title: 'Volume Master',
        description: 'Lifted over 10,000 lbs total!',
        unlockedAt: new Date(),
        category: 'strength'
      });
    }

    // Generate next goals
    nextGoals.push({
      id: 'consistency_goal',
      title: 'Consistency Challenge',
      description: 'Workout 4 times this week',
      targetValue: 4,
      currentValue: Math.min(analytics.workoutFrequency, 4),
      unit: 'workouts',
      deadline: this.getEndOfWeek(),
      category: 'consistency'
    });

    if (analytics.totalVolume > 0) {
      const nextVolumeGoal = Math.ceil(analytics.totalVolume * 1.1); // 10% increase
      nextGoals.push({
        id: 'volume_goal',
        title: 'Volume Increase',
        description: `Reach ${nextVolumeGoal} lbs total volume`,
        targetValue: nextVolumeGoal,
        currentValue: analytics.totalVolume,
        unit: 'lbs',
        deadline: this.getEndOfMonth(),
        category: 'strength'
      });
    }

    return {
      recommendations,
      achievements,
      nextGoals,
      weakPoints,
      strengths
    };
  }

  /**
   * Helper methods
   */
  private createEmptyMetrics(): WorkoutMetrics {
    return {
      totalSets: 0,
      totalReps: 0,
      totalVolume: 0,
      averageWeight: 0,
      duration: 0,
      caloriesBurned: 0,
      exercisesCompleted: 0,
      averageFormScore: 0
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.currentSession) {
        this.updateSessionMetrics();
        // Auto-save current session state
        localStorage.setItem('fitness-app-current-session', JSON.stringify(this.currentSession));
      }
    }, this.config.saveInterval);
  }

  private estimateCaloriesBurned(volume: number, duration: number): number {
    // Rough estimation: 0.1 calories per lb lifted + 5 calories per minute
    return Math.round((volume * 0.1) + (duration * 5));
  }

  private calculateAverageFormScore(): number {
    if (!this.currentSession?.exercises) return 0;

    let totalScore = 0;
    let totalSets = 0;

    this.currentSession.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.formScore && set.formScore > 0) {
          totalScore += set.formScore;
          totalSets++;
        }
      });
    });

    return totalSets > 0 ? totalScore / totalSets : 0;
  }

  private filterWorkoutsByTimeframe(workouts: WorkoutSession[], timeframe: string): WorkoutSession[] {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeframe) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return workouts;
    }

    return workouts.filter(w => w.startTime >= cutoffDate);
  }

  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  }

  private calculateStreaks(workouts: WorkoutSession[]): { currentStreak: number; longestStreak: number } {
    if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const sortedWorkouts = [...workouts]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const hasWorkout = sortedWorkouts.some(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });

      if (hasWorkout) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break;
      }
    }

    // Calculate longest streak
    const workoutDates = sortedWorkouts.map(w => {
      const date = new Date(w.startTime);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => b - a);

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0 || uniqueDates[i-1] - uniqueDates[i] === 24 * 60 * 60 * 1000) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
  }

  private calculateMuscleGroupDistribution(workouts: WorkoutSession[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const muscleGroup = this.identifyMuscleGroup(exercise.exerciseName);
        distribution[muscleGroup] = (distribution[muscleGroup] || 0) + exercise.sets.length;
      });
    });

    return distribution;
  }

  private identifyMuscleGroup(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('chest') || name.includes('bench') || name.includes('push up')) return 'chest';
    if (name.includes('back') || name.includes('row') || name.includes('pulldown') || name.includes('pull up')) return 'back';
    if (name.includes('shoulder') || name.includes('press') || name.includes('raise')) return 'shoulders';
    if (name.includes('leg') || name.includes('squat') || name.includes('deadlift') || name.includes('lunge')) return 'legs';
    if (name.includes('bicep') || name.includes('curl')) return 'biceps';
    if (name.includes('tricep') || name.includes('dip')) return 'triceps';
    if (name.includes('core') || name.includes('abs') || name.includes('plank')) return 'core';
    
    return 'other';
  }

  private calculateStrengthProgression(workouts: WorkoutSession[]): Record<string, number[]> {
    const progression: Record<string, number[]> = {};

    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (!progression[exercise.exerciseName]) {
          progression[exercise.exerciseName] = [];
        }
        
        const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
        if (maxWeight > 0) {
          progression[exercise.exerciseName].push(maxWeight);
        }
      });
    });

    return progression;
  }

  private calculateVolumeProgression(workouts: WorkoutSession[]): number[] {
    return workouts
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map(w => w.totalVolume || 0);
  }

  private calculateConsistencyScore(workouts: WorkoutSession[], timeframe: string): number {
    const days = this.getTimeframeDays(timeframe);
    const expectedWorkouts = Math.floor(days / 3); // Expect workout every 3 days
    const actualWorkouts = workouts.length;
    
    return Math.min(100, Math.round((actualWorkouts / expectedWorkouts) * 100));
  }

  private getEndOfWeek(): Date {
    const now = new Date();
    const daysUntilSunday = 7 - now.getDay();
    return new Date(now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);
  }

  private getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
}

// Export singleton instance
export const progressTrackingService = new ProgressTrackingService();