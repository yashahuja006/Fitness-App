import {
  Exercise,
  ExerciseRecommendation,
  RecommendationContext,
  DifficultyLevel,
  Equipment,
  MuscleGroup,
  ExerciseCategory,
} from '../types/exercise';
import { UserProfile } from '../types/auth';
import { ExerciseServiceDev } from './exerciseService.dev';

/**
 * Development version of ExerciseRecommendationService that uses local seed data
 */
export class ExerciseRecommendationServiceDev {
  /**
   * Generate personalized exercise recommendations based on user context
   */
  static async getPersonalizedRecommendations(
    userProfile: UserProfile,
    context: Partial<RecommendationContext> = {},
    count: number = 10
  ): Promise<ExerciseRecommendation[]> {
    // Get popular exercises as base recommendations
    const exercises = await ExerciseServiceDev.getPopularExercises(count * 2);
    
    // Score exercises based on user profile
    const scoredExercises = exercises.map(exercise => ({
      exercise,
      score: this.calculateRecommendationScore(exercise, userProfile),
      reason: this.generateRecommendationReason(exercise, userProfile),
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
    }));

    // Sort by score and return top recommendations
    return scoredExercises
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Get alternative exercise suggestions when search returns no results
   */
  static async getAlternativeSuggestions(
    searchTerm: string,
    userProfile: UserProfile,
    count: number = 5
  ): Promise<ExerciseRecommendation[]> {
    // Get random exercises as alternatives
    const exercises = await ExerciseServiceDev.getRandomExercises(count * 2);
    
    return exercises.slice(0, count).map(exercise => ({
      exercise,
      score: Math.random() * 0.5 + 0.5, // 0.5-1.0 score
      reason: `Alternative suggestion for "${searchTerm}"`,
      confidence: Math.random() * 0.2 + 0.6, // 0.6-0.8 confidence
    }));
  }

  /**
   * Get similar exercises to a given exercise
   */
  static async getSimilarExercises(
    exerciseId: string,
    userProfile: UserProfile,
    count: number = 5
  ): Promise<ExerciseRecommendation[]> {
    const targetExercise = await ExerciseServiceDev.getExercise(exerciseId);
    if (!targetExercise) return [];

    // Get exercises from same category
    const similarExercises = await ExerciseServiceDev.getExercisesByCategory(
      targetExercise.category,
      count * 2
    );

    // Filter out the target exercise and score by similarity
    const filteredExercises = similarExercises
      .filter(ex => ex.id !== exerciseId)
      .map(exercise => ({
        exercise,
        score: this.calculateSimilarityScore(exercise, targetExercise),
        reason: `Similar to ${targetExercise.name}`,
        confidence: Math.random() * 0.3 + 0.7,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return filteredExercises;
  }

  /**
   * Get goal-based exercise recommendations
   */
  static async getGoalBasedRecommendations(
    goals: string[],
    userProfile: UserProfile,
    count: number = 8
  ): Promise<ExerciseRecommendation[]> {
    // Map goals to exercise categories
    const categoryMap: Record<string, ExerciseCategory[]> = {
      'Weight Loss': ['cardio', 'functional'],
      'Muscle Gain': ['strength'],
      'Endurance': ['cardio', 'functional'],
      'Strength': ['strength'],
      'Flexibility': ['flexibility'],
      'General Fitness': ['strength', 'cardio', 'functional'],
    };

    const relevantCategories = new Set<ExerciseCategory>();
    goals.forEach(goal => {
      const categories = categoryMap[goal] || ['functional'];
      categories.forEach(cat => relevantCategories.add(cat));
    });

    // Get exercises from relevant categories
    const allExercises: Exercise[] = [];
    for (const category of relevantCategories) {
      const exercises = await ExerciseServiceDev.getExercisesByCategory(category, 10);
      allExercises.push(...exercises);
    }

    // Remove duplicates and score
    const uniqueExercises = Array.from(
      new Map(allExercises.map(ex => [ex.id, ex])).values()
    );

    const scoredExercises = uniqueExercises.map(exercise => ({
      exercise,
      score: this.calculateGoalScore(exercise, goals, userProfile),
      reason: `Recommended for: ${goals.join(', ')}`,
      confidence: Math.random() * 0.2 + 0.8,
    }));

    return scoredExercises
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Calculate recommendation score based on user profile
   */
  private static calculateRecommendationScore(
    exercise: Exercise,
    userProfile: UserProfile
  ): number {
    let score = exercise.metadata.popularity || 50;

    // Adjust for difficulty based on user experience
    const difficultyScore = this.getDifficultyScore(exercise.difficulty, userProfile);
    score += difficultyScore;

    // Boost score for exercises matching user goals
    const goalScore = this.getGoalMatchScore(exercise, userProfile.personalMetrics.fitnessGoals);
    score += goalScore;

    // Equipment availability (assume all equipment is available in dev)
    score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate similarity score between two exercises
   */
  private static calculateSimilarityScore(exercise1: Exercise, exercise2: Exercise): number {
    let score = 0;

    // Same category
    if (exercise1.category === exercise2.category) score += 30;

    // Similar difficulty
    if (exercise1.difficulty === exercise2.difficulty) score += 20;

    // Overlapping target muscles
    const commonMuscles = exercise1.targetMuscles.filter(muscle =>
      exercise2.targetMuscles.includes(muscle)
    );
    score += commonMuscles.length * 15;

    // Similar equipment
    const commonEquipment = exercise1.equipment.filter(eq =>
      exercise2.equipment.includes(eq)
    );
    score += commonEquipment.length * 10;

    return Math.min(100, score);
  }

  /**
   * Calculate goal-based score
   */
  private static calculateGoalScore(
    exercise: Exercise,
    goals: string[],
    userProfile: UserProfile
  ): number {
    let score = exercise.metadata.popularity || 50;

    // Goal-specific scoring
    goals.forEach(goal => {
      switch (goal) {
        case 'Weight Loss':
          if (exercise.category === 'cardio') score += 30;
          if (exercise.caloriesPerMinute && exercise.caloriesPerMinute > 6) score += 20;
          break;
        case 'Muscle Gain':
          if (exercise.category === 'strength') score += 30;
          if (exercise.equipment.includes('barbell') || exercise.equipment.includes('dumbbells')) score += 15;
          break;
        case 'Endurance':
          if (exercise.category === 'cardio' || exercise.category === 'functional') score += 25;
          break;
        case 'Flexibility':
          if (exercise.category === 'flexibility') score += 35;
          break;
      }
    });

    return Math.min(100, score);
  }

  /**
   * Get difficulty score based on user experience
   */
  private static getDifficultyScore(difficulty: DifficultyLevel, userProfile: UserProfile): number {
    // Simple scoring - in a real app, this would be more sophisticated
    const userExperience = 'intermediate'; // Default for dev
    
    if (difficulty === 'beginner') return userExperience === 'beginner' ? 20 : 10;
    if (difficulty === 'intermediate') return userExperience === 'intermediate' ? 20 : 15;
    if (difficulty === 'advanced') return userExperience === 'advanced' ? 20 : 5;
    
    return 10;
  }

  /**
   * Get goal match score
   */
  private static getGoalMatchScore(exercise: Exercise, goals: string[]): number {
    let score = 0;
    
    goals.forEach(goal => {
      if (goal.toLowerCase().includes('strength') && exercise.category === 'strength') score += 15;
      if (goal.toLowerCase().includes('cardio') && exercise.category === 'cardio') score += 15;
      if (goal.toLowerCase().includes('flexibility') && exercise.category === 'flexibility') score += 15;
      if (goal.toLowerCase().includes('weight') && exercise.category === 'cardio') score += 10;
    });

    return score;
  }

  /**
   * Generate recommendation reason
   */
  private static generateRecommendationReason(exercise: Exercise, userProfile: UserProfile): string {
    const reasons = [
      `Popular ${exercise.category} exercise`,
      `Great for ${exercise.targetMuscles.join(' and ')}`,
      `${exercise.difficulty} level exercise`,
      `Highly rated by users`,
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }
}