import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
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

export class ExerciseRecommendationService {
  private static readonly EXERCISES_COLLECTION = 'exercises';
  private static readonly USER_EXERCISE_HISTORY_COLLECTION = 'userExerciseHistory';

  /**
   * Generate personalized exercise recommendations based on user context
   */
  static async getPersonalizedRecommendations(
    userProfile: UserProfile,
    context: Partial<RecommendationContext> = {},
    count: number = 10
  ): Promise<ExerciseRecommendation[]> {
    const recommendationContext = await this.buildRecommendationContext(userProfile, context);
    
    // Get candidate exercises based on user constraints
    const candidates = await this.getCandidateExercises(recommendationContext);
    
    // Score and rank exercises
    const scoredExercises = this.scoreExercises(candidates, recommendationContext);
    
    // Return top recommendations
    return scoredExercises.slice(0, count);
  }

  /**
   * Get alternative exercise suggestions when search returns no results
   */
  static async getAlternativeSuggestions(
    searchTerm: string,
    userProfile: UserProfile,
    count: number = 5
  ): Promise<ExerciseRecommendation[]> {
    // Extract intent from search term
    const intent = this.extractSearchIntent(searchTerm);
    
    // Build context based on search intent
    const context: RecommendationContext = {
      userFitnessLevel: this.mapActivityLevelToDifficulty(userProfile.personalMetrics.activityLevel),
      availableEquipment: this.getDefaultEquipment(),
      targetMuscles: intent.muscleGroups,
      fitnessGoals: userProfile.personalMetrics.fitnessGoals,
    };

    // Get recommendations based on inferred intent
    const recommendations = await this.getPersonalizedRecommendations(userProfile, context, count);
    
    // Add specific reasons for alternative suggestions
    return recommendations.map(rec => ({
      ...rec,
      reason: `Alternative to "${searchTerm}": ${rec.reason}`,
    }));
  }

  /**
   * Get exercise recommendations for similar exercises
   */
  static async getSimilarExercises(
    exerciseId: string,
    userProfile: UserProfile,
    count: number = 5
  ): Promise<ExerciseRecommendation[]> {
    const exercise = await this.getExercise(exerciseId);
    if (!exercise) return [];

    const context: RecommendationContext = {
      userFitnessLevel: this.mapActivityLevelToDifficulty(userProfile.personalMetrics.activityLevel),
      availableEquipment: this.getDefaultEquipment(),
      targetMuscles: exercise.targetMuscles,
      previousExercises: [exerciseId], // Exclude the current exercise
    };

    const recommendations = await this.getPersonalizedRecommendations(userProfile, context, count + 1);
    
    // Filter out the original exercise and add similarity reasons
    return recommendations
      .filter(rec => rec.exercise.id !== exerciseId)
      .slice(0, count)
      .map(rec => ({
        ...rec,
        reason: `Similar to ${exercise.name}: ${rec.reason}`,
      }));
  }

  /**
   * Get recommendations based on workout goals
   */
  static async getGoalBasedRecommendations(
    goals: string[],
    userProfile: UserProfile,
    count: number = 8
  ): Promise<ExerciseRecommendation[]> {
    const context: RecommendationContext = {
      userFitnessLevel: this.mapActivityLevelToDifficulty(userProfile.personalMetrics.activityLevel),
      availableEquipment: this.getDefaultEquipment(),
      fitnessGoals: goals,
      targetMuscles: this.mapGoalsToMuscleGroups(goals),
    };

    return this.getPersonalizedRecommendations(userProfile, context, count);
  }

  /**
   * Build comprehensive recommendation context
   */
  private static async buildRecommendationContext(
    userProfile: UserProfile,
    context: Partial<RecommendationContext>
  ): Promise<RecommendationContext> {
    const userHistory = await this.getUserExerciseHistory(userProfile.uid);
    
    return {
      userFitnessLevel: context.userFitnessLevel || 
        this.mapActivityLevelToDifficulty(userProfile.personalMetrics.activityLevel),
      availableEquipment: context.availableEquipment || this.getDefaultEquipment(),
      targetMuscles: context.targetMuscles,
      workoutDuration: context.workoutDuration,
      previousExercises: context.previousExercises || userHistory.recentExercises,
      fitnessGoals: context.fitnessGoals || userProfile.personalMetrics.fitnessGoals,
      injuries: context.injuries,
    };
  }

  /**
   * Get candidate exercises based on user constraints
   */
  private static async getCandidateExercises(
    context: RecommendationContext
  ): Promise<Exercise[]> {
    let q = query(collection(db, this.EXERCISES_COLLECTION));

    // Filter by difficulty level (include current level and below for safety)
    const allowedDifficulties = this.getAllowedDifficulties(context.userFitnessLevel);
    q = query(q, where('difficulty', 'in', allowedDifficulties));

    // Filter by available equipment
    if (context.availableEquipment && context.availableEquipment.length > 0) {
      q = query(q, where('equipment', 'array-contains-any', context.availableEquipment));
    }

    // Order by popularity and limit results for performance
    q = query(q, orderBy('metadata.popularity', 'desc'), limit(100));

    const querySnapshot = await getDocs(q);
    const exercises = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));

    // Filter out exercises the user has done recently
    if (context.previousExercises && context.previousExercises.length > 0) {
      return exercises.filter(exercise => !context.previousExercises!.includes(exercise.id));
    }

    return exercises;
  }

  /**
   * Score exercises based on user context and preferences
   */
  private static scoreExercises(
    exercises: Exercise[],
    context: RecommendationContext
  ): ExerciseRecommendation[] {
    return exercises.map(exercise => {
      let score = 0;
      const matchedCriteria: string[] = [];
      let reason = '';

      // Base score from popularity and rating
      score += (exercise.metadata.popularity || 0) * 0.1;
      if (exercise.metadata.averageRating) {
        score += exercise.metadata.averageRating * 10;
      }

      // Fitness level match
      if (exercise.difficulty === context.userFitnessLevel) {
        score += 30;
        matchedCriteria.push('difficulty level');
      } else if (this.isDifficultyAppropriate(exercise.difficulty, context.userFitnessLevel)) {
        score += 15;
        matchedCriteria.push('appropriate difficulty');
      }

      // Target muscle groups match
      if (context.targetMuscles && context.targetMuscles.length > 0) {
        const muscleMatch = this.calculateMuscleGroupMatch(exercise, context.targetMuscles);
        score += muscleMatch * 40;
        if (muscleMatch > 0.5) {
          matchedCriteria.push('target muscles');
        }
      }

      // Equipment availability
      const equipmentMatch = this.calculateEquipmentMatch(exercise, context.availableEquipment || []);
      score += equipmentMatch * 25;
      if (equipmentMatch > 0.8) {
        matchedCriteria.push('available equipment');
      }

      // Fitness goals alignment
      if (context.fitnessGoals && context.fitnessGoals.length > 0) {
        const goalMatch = this.calculateGoalMatch(exercise, context.fitnessGoals);
        score += goalMatch * 35;
        if (goalMatch > 0.3) {
          matchedCriteria.push('fitness goals');
        }
      }

      // Workout duration consideration
      if (context.workoutDuration) {
        const durationMatch = this.calculateDurationMatch(exercise, context.workoutDuration);
        score += durationMatch * 20;
        if (durationMatch > 0.7) {
          matchedCriteria.push('workout duration');
        }
      }

      // Injury considerations (negative scoring for risky exercises)
      if (context.injuries && context.injuries.length > 0) {
        const injuryRisk = this.calculateInjuryRisk(exercise, context.injuries);
        score -= injuryRisk * 50;
        if (injuryRisk < 0.3) {
          matchedCriteria.push('injury-safe');
        }
      }

      // Generate reason
      reason = this.generateRecommendationReason(exercise, matchedCriteria, context);

      return {
        exercise,
        score: Math.max(0, score), // Ensure non-negative score
        reason,
        matchedCriteria,
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Extract search intent from search term
   */
  private static extractSearchIntent(searchTerm: string): {
    muscleGroups: MuscleGroup[];
    equipment: Equipment[];
    category: ExerciseCategory | null;
  } {
    const term = searchTerm.toLowerCase();
    const muscleGroups: MuscleGroup[] = [];
    const equipment: Equipment[] = [];
    let category: ExerciseCategory | null = null;

    // Muscle group mapping
    const muscleMap: Record<string, MuscleGroup> = {
      'chest': 'chest', 'pecs': 'chest', 'pectoral': 'chest',
      'back': 'back', 'lats': 'back', 'latissimus': 'back',
      'shoulder': 'shoulders', 'shoulders': 'shoulders', 'delts': 'shoulders',
      'bicep': 'biceps', 'biceps': 'biceps',
      'tricep': 'triceps', 'triceps': 'triceps',
      'abs': 'abs', 'abdominal': 'abs', 'core': 'core',
      'glutes': 'glutes', 'glute': 'glutes', 'butt': 'glutes',
      'quads': 'quadriceps', 'quadriceps': 'quadriceps', 'thighs': 'quadriceps',
      'hamstrings': 'hamstrings', 'hamstring': 'hamstrings',
      'calves': 'calves', 'calf': 'calves',
      'legs': 'quadriceps', 'arms': 'biceps',
    };

    // Equipment mapping
    const equipmentMap: Record<string, Equipment> = {
      'dumbbell': 'dumbbells', 'dumbbells': 'dumbbells',
      'barbell': 'barbell', 'barbells': 'barbell',
      'kettlebell': 'kettlebell', 'kettlebells': 'kettlebell',
      'bodyweight': 'none', 'no equipment': 'none',
      'resistance band': 'resistance_bands', 'bands': 'resistance_bands',
      'pull up bar': 'pull_up_bar', 'pullup': 'pull_up_bar',
    };

    // Category mapping
    const categoryMap: Record<string, ExerciseCategory> = {
      'strength': 'strength', 'weight': 'strength', 'lifting': 'strength',
      'cardio': 'cardio', 'aerobic': 'cardio', 'running': 'cardio',
      'flexibility': 'flexibility', 'stretching': 'flexibility', 'yoga': 'flexibility',
      'balance': 'balance', 'stability': 'balance',
      'functional': 'functional', 'movement': 'functional',
    };

    // Extract muscle groups
    Object.entries(muscleMap).forEach(([key, value]) => {
      if (term.includes(key) && !muscleGroups.includes(value)) {
        muscleGroups.push(value);
      }
    });

    // Extract equipment
    Object.entries(equipmentMap).forEach(([key, value]) => {
      if (term.includes(key) && !equipment.includes(value)) {
        equipment.push(value);
      }
    });

    // Extract category
    Object.entries(categoryMap).forEach(([key, value]) => {
      if (term.includes(key)) {
        category = value;
      }
    });

    return { muscleGroups, equipment, category };
  }

  /**
   * Helper methods
   */
  private static async getExercise(exerciseId: string): Promise<Exercise | null> {
    const docRef = doc(db, this.EXERCISES_COLLECTION, exerciseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Exercise;
    }
    return null;
  }

  private static async getUserExerciseHistory(userId: string): Promise<{
    recentExercises: string[];
    favoriteExercises: string[];
    completedWorkouts: number;
  }> {
    // This would typically query a user exercise history collection
    // For now, return empty data - this would be implemented when workout tracking is added
    return {
      recentExercises: [],
      favoriteExercises: [],
      completedWorkouts: 0,
    };
  }

  private static mapActivityLevelToDifficulty(activityLevel: string): DifficultyLevel {
    switch (activityLevel) {
      case 'sedentary':
      case 'light':
        return 'beginner';
      case 'moderate':
      case 'active':
        return 'intermediate';
      case 'very_active':
        return 'advanced';
      default:
        return 'beginner';
    }
  }

  private static getDefaultEquipment(): Equipment[] {
    // Default to bodyweight exercises and common equipment
    return ['none', 'dumbbells', 'resistance_bands', 'yoga_mat'];
  }

  private static getAllowedDifficulties(userLevel: DifficultyLevel): DifficultyLevel[] {
    switch (userLevel) {
      case 'beginner':
        return ['beginner'];
      case 'intermediate':
        return ['beginner', 'intermediate'];
      case 'advanced':
        return ['beginner', 'intermediate', 'advanced'];
      default:
        return ['beginner'];
    }
  }

  private static isDifficultyAppropriate(exerciseDifficulty: DifficultyLevel, userLevel: DifficultyLevel): boolean {
    const levels = ['beginner', 'intermediate', 'advanced'];
    const exerciseIndex = levels.indexOf(exerciseDifficulty);
    const userIndex = levels.indexOf(userLevel);
    
    // Allow exercises at or below user level
    return exerciseIndex <= userIndex;
  }

  private static calculateMuscleGroupMatch(exercise: Exercise, targetMuscles: MuscleGroup[]): number {
    const exerciseMuscles = [...exercise.targetMuscles, ...(exercise.secondaryMuscles || [])];
    const matches = targetMuscles.filter(muscle => exerciseMuscles.includes(muscle)).length;
    return matches / Math.max(targetMuscles.length, 1);
  }

  private static calculateEquipmentMatch(exercise: Exercise, availableEquipment: Equipment[]): number {
    if (exercise.equipment.includes('none')) return 1; // Bodyweight exercises always match
    
    const matches = exercise.equipment.filter(eq => availableEquipment.includes(eq)).length;
    return matches / exercise.equipment.length;
  }

  private static calculateGoalMatch(exercise: Exercise, goals: string[]): number {
    let score = 0;
    
    goals.forEach(goal => {
      const goalLower = goal.toLowerCase();
      
      // Map goals to exercise characteristics
      if (goalLower.includes('strength') || goalLower.includes('muscle')) {
        if (exercise.category === 'strength') score += 0.5;
      }
      if (goalLower.includes('cardio') || goalLower.includes('endurance')) {
        if (exercise.category === 'cardio') score += 0.5;
        if (exercise.caloriesPerMinute && exercise.caloriesPerMinute > 8) score += 0.3;
      }
      if (goalLower.includes('flexibility') || goalLower.includes('mobility')) {
        if (exercise.category === 'flexibility') score += 0.5;
      }
      if (goalLower.includes('weight loss') || goalLower.includes('fat loss')) {
        if (exercise.caloriesPerMinute && exercise.caloriesPerMinute > 6) score += 0.4;
      }
      if (goalLower.includes('balance') || goalLower.includes('stability')) {
        if (exercise.category === 'balance' || exercise.category === 'functional') score += 0.5;
      }
    });
    
    return Math.min(score, 1); // Cap at 1
  }

  private static calculateDurationMatch(exercise: Exercise, targetDuration: number): number {
    if (!exercise.duration) return 0.5; // Neutral if no duration specified
    
    const difference = Math.abs(exercise.duration - targetDuration);
    const maxDifference = targetDuration * 0.5; // Allow 50% variance
    
    return Math.max(0, 1 - (difference / maxDifference));
  }

  private static calculateInjuryRisk(exercise: Exercise, injuries: string[]): number {
    let risk = 0;
    
    injuries.forEach(injury => {
      const injuryLower = injury.toLowerCase();
      
      // Map injuries to risky exercise characteristics
      if (injuryLower.includes('back') || injuryLower.includes('spine')) {
        if (exercise.targetMuscles.includes('lower_back') || 
            exercise.instructions.some(inst => inst.toLowerCase().includes('spine'))) {
          risk += 0.7;
        }
      }
      if (injuryLower.includes('knee')) {
        if (exercise.targetMuscles.includes('quadriceps') || 
            exercise.targetMuscles.includes('hamstrings')) {
          risk += 0.5;
        }
      }
      if (injuryLower.includes('shoulder')) {
        if (exercise.targetMuscles.includes('shoulders') || 
            exercise.instructions.some(inst => inst.toLowerCase().includes('overhead'))) {
          risk += 0.6;
        }
      }
    });
    
    return Math.min(risk, 1); // Cap at 1
  }

  private static mapGoalsToMuscleGroups(goals: string[]): MuscleGroup[] {
    const muscleGroups: MuscleGroup[] = [];
    
    goals.forEach(goal => {
      const goalLower = goal.toLowerCase();
      
      if (goalLower.includes('upper body') || goalLower.includes('arms')) {
        muscleGroups.push('chest', 'back', 'shoulders', 'biceps', 'triceps');
      }
      if (goalLower.includes('lower body') || goalLower.includes('legs')) {
        muscleGroups.push('glutes', 'quadriceps', 'hamstrings', 'calves');
      }
      if (goalLower.includes('core') || goalLower.includes('abs')) {
        muscleGroups.push('abs', 'core');
      }
      if (goalLower.includes('full body')) {
        muscleGroups.push('full_body');
      }
    });
    
    return Array.from(new Set(muscleGroups)); // Remove duplicates
  }

  private static generateRecommendationReason(
    exercise: Exercise,
    matchedCriteria: string[],
    context: RecommendationContext
  ): string {
    if (matchedCriteria.length === 0) {
      return `Popular ${exercise.category} exercise`;
    }
    
    const reasons = [];
    
    if (matchedCriteria.includes('target muscles')) {
      reasons.push('targets your focus areas');
    }
    if (matchedCriteria.includes('difficulty level')) {
      reasons.push('matches your fitness level');
    }
    if (matchedCriteria.includes('available equipment')) {
      reasons.push('uses your available equipment');
    }
    if (matchedCriteria.includes('fitness goals')) {
      reasons.push('aligns with your goals');
    }
    if (matchedCriteria.includes('injury-safe')) {
      reasons.push('safe for your condition');
    }
    
    const reasonText = reasons.length > 0 ? reasons.join(', ') : 'good fit for you';
    return `Recommended because it ${reasonText}`;
  }
}