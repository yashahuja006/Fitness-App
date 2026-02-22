import {
  Exercise,
  ExerciseCategoryInfo,
  ExerciseSearchFilters,
  ExerciseSearchResult,
  ExerciseCategory,
  DifficultyLevel,
  Equipment,
  MuscleGroup,
} from '../types/exercise';
import { exercises, exerciseCategories } from '../data/seedExercises';

/**
 * Development version of ExerciseService that uses local seed data
 * This allows the app to work without Firebase connection
 */
export class ExerciseServiceDev {
  private static exercises: Exercise[] = exercises.map(ex => ({
    ...ex,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  private static categories: ExerciseCategoryInfo[] = exerciseCategories.map(cat => ({
    ...cat,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Exercise CRUD operations
  static async createExercise(exercise: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<void> {
    const newExercise: Exercise = {
      ...exercise,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.exercises.push(newExercise);
  }

  static async getExercise(exerciseId: string): Promise<Exercise | null> {
    return this.exercises.find(ex => ex.id === exerciseId) || null;
  }

  static async updateExercise(
    exerciseId: string, 
    updates: Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const index = this.exercises.findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      this.exercises[index] = {
        ...this.exercises[index],
        ...updates,
        updatedAt: new Date(),
      };
    }
  }

  static async deleteExercise(exerciseId: string): Promise<void> {
    this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
  }

  // Get all exercises with optional pagination
  static async getAllExercises(
    pageSize: number = 12, // Reduced from 50 to 12 for faster initial load
    offset: number = 0
  ): Promise<{
    exercises: Exercise[];
    hasMore: boolean;
    total: number;
  }> {
    const sortedExercises = [...this.exercises].sort((a, b) => a.name.localeCompare(b.name));
    const paginatedExercises = sortedExercises.slice(offset, offset + pageSize);
    
    return {
      exercises: paginatedExercises,
      hasMore: offset + pageSize < sortedExercises.length,
      total: sortedExercises.length,
    };
  }

  // Advanced search with filters and relevance scoring
  static async searchExercises(
    searchTerm?: string,
    filters?: ExerciseSearchFilters,
    pageSize: number = 12, // Reduced from 20 to 12 for faster loading
    offset: number = 0
  ): Promise<ExerciseSearchResult> {
    let filteredExercises = [...this.exercises];

    // Apply filters
    if (filters?.category) {
      filteredExercises = filteredExercises.filter(ex => ex.category === filters.category);
    }

    if (filters?.difficulty) {
      filteredExercises = filteredExercises.filter(ex => ex.difficulty === filters.difficulty);
    }

    if (filters?.equipment && filters.equipment.length > 0) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.equipment.some(eq => filters.equipment!.includes(eq))
      );
    }

    if (filters?.targetMuscles && filters.targetMuscles.length > 0) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.targetMuscles.some(muscle => filters.targetMuscles!.includes(muscle))
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.metadata.tags.some(tag => filters.tags!.includes(tag))
      );
    }

    // Simplified search for better performance
    if (searchTerm?.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredExercises = filteredExercises.filter(ex => 
        ex.name.toLowerCase().includes(searchLower) ||
        ex.targetMuscles.some(muscle => muscle.toLowerCase().includes(searchLower)) ||
        ex.category.toLowerCase().includes(searchLower) ||
        ex.equipment.some(eq => eq.toLowerCase().includes(searchLower))
      );
      // Simple sort by name match relevance
      filteredExercises.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(searchLower);
        const bNameMatch = b.name.toLowerCase().includes(searchLower);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Sort by popularity if no search term
      filteredExercises.sort((a, b) => (b.metadata.popularity || 0) - (a.metadata.popularity || 0));
    }

    // Apply pagination
    const paginatedExercises = filteredExercises.slice(offset, offset + pageSize);

    return {
      exercises: paginatedExercises,
      totalCount: filteredExercises.length,
      hasMore: offset + pageSize < filteredExercises.length,
      filters: filters || {},
    };
  }

  // Search algorithm with relevance scoring
  private static searchWithRelevanceScoring(
    exercises: Exercise[],
    searchTerm: string
  ): Array<{ exercise: Exercise; score: number }> {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(' ').filter(word => word.length > 0);

    const scoredExercises = exercises.map(exercise => {
      let score = 0;

      // Exact name match gets highest score
      if (exercise.name.toLowerCase() === searchLower) {
        score += 100;
      }
      // Name starts with search term
      else if (exercise.name.toLowerCase().startsWith(searchLower)) {
        score += 80;
      }
      // Name contains search term
      else if (exercise.name.toLowerCase().includes(searchLower)) {
        score += 60;
      }

      // Check individual words in name
      searchWords.forEach(word => {
        if (exercise.name.toLowerCase().includes(word)) {
          score += 20;
        }
      });

      // Check target muscles
      exercise.targetMuscles.forEach(muscle => {
        const muscleFormatted = muscle.replace('_', ' ').toLowerCase();
        if (muscleFormatted.includes(searchLower)) {
          score += 40;
        }
        searchWords.forEach(word => {
          if (muscleFormatted.includes(word)) {
            score += 15;
          }
        });
      });

      // Check secondary muscles
      exercise.secondaryMuscles?.forEach(muscle => {
        const muscleFormatted = muscle.replace('_', ' ').toLowerCase();
        if (muscleFormatted.includes(searchLower)) {
          score += 20;
        }
        searchWords.forEach(word => {
          if (muscleFormatted.includes(word)) {
            score += 10;
          }
        });
      });

      // Check equipment
      exercise.equipment.forEach(equipment => {
        const equipmentFormatted = equipment.replace('_', ' ').toLowerCase();
        if (equipmentFormatted.includes(searchLower)) {
          score += 30;
        }
        searchWords.forEach(word => {
          if (equipmentFormatted.includes(word)) {
            score += 10;
          }
        });
      });

      // Check instructions
      exercise.instructions.forEach(instruction => {
        const instructionLower = instruction.toLowerCase();
        if (instructionLower.includes(searchLower)) {
          score += 25;
        }
        searchWords.forEach(word => {
          if (instructionLower.includes(word)) {
            score += 5;
          }
        });
      });

      // Check tags
      exercise.metadata.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes(searchLower)) {
          score += 35;
        }
        searchWords.forEach(word => {
          if (tagLower.includes(word)) {
            score += 12;
          }
        });
      });

      // Check category
      const categoryFormatted = exercise.category.replace('_', ' ').toLowerCase();
      if (categoryFormatted.includes(searchLower)) {
        score += 30;
      }
      searchWords.forEach(word => {
        if (categoryFormatted.includes(word)) {
          score += 10;
        }
      });

      // Boost score based on popularity and rating
      score += (exercise.metadata.popularity || 0) * 0.1;
      if (exercise.metadata.averageRating) {
        score += exercise.metadata.averageRating * 5;
      }

      return { exercise, score };
    });

    // Filter out exercises with score 0 and sort by score
    return scoredExercises
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // Get exercises by category
  static async getExercisesByCategory(
    category: ExerciseCategory,
    pageSize: number = 20
  ): Promise<Exercise[]> {
    return this.exercises
      .filter(ex => ex.category === category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, pageSize);
  }

  // Get exercises by difficulty
  static async getExercisesByDifficulty(
    difficulty: DifficultyLevel,
    pageSize: number = 20
  ): Promise<Exercise[]> {
    return this.exercises
      .filter(ex => ex.difficulty === difficulty)
      .sort((a, b) => (b.metadata.popularity || 0) - (a.metadata.popularity || 0))
      .slice(0, pageSize);
  }

  // Get exercises by equipment
  static async getExercisesByEquipment(
    equipment: Equipment[],
    pageSize: number = 20
  ): Promise<Exercise[]> {
    return this.exercises
      .filter(ex => ex.equipment.some(eq => equipment.includes(eq)))
      .sort((a, b) => (b.metadata.popularity || 0) - (a.metadata.popularity || 0))
      .slice(0, pageSize);
  }

  // Get exercises by muscle group
  static async getExercisesByMuscleGroup(
    muscleGroups: MuscleGroup[],
    pageSize: number = 20
  ): Promise<Exercise[]> {
    return this.exercises
      .filter(ex => ex.targetMuscles.some(muscle => muscleGroups.includes(muscle)))
      .sort((a, b) => (b.metadata.popularity || 0) - (a.metadata.popularity || 0))
      .slice(0, pageSize);
  }

  // Get popular exercises
  static async getPopularExercises(pageSize: number = 10): Promise<Exercise[]> {
    return [...this.exercises]
      .sort((a, b) => (b.metadata.popularity || 0) - (a.metadata.popularity || 0))
      .slice(0, pageSize);
  }

  // Get random exercises for recommendations
  static async getRandomExercises(
    count: number = 5,
    excludeIds: string[] = []
  ): Promise<Exercise[]> {
    const availableExercises = this.exercises.filter(ex => !excludeIds.includes(ex.id));
    const shuffled = [...availableExercises].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Category management
  static async createCategory(category: Omit<ExerciseCategoryInfo, 'createdAt' | 'updatedAt'>): Promise<void> {
    const newCategory: ExerciseCategoryInfo = {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.push(newCategory);
  }

  static async getAllCategories(): Promise<ExerciseCategoryInfo[]> {
    // Update exercise counts
    const exerciseCounts: Record<string, number> = {};
    this.exercises.forEach(ex => {
      exerciseCounts[ex.category] = (exerciseCounts[ex.category] || 0) + 1;
    });

    return this.categories.map(cat => ({
      ...cat,
      exerciseCount: exerciseCounts[cat.id] || 0,
    }));
  }

  static async getCategory(categoryId: string): Promise<ExerciseCategoryInfo | null> {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category) return null;

    // Update exercise count
    const exerciseCount = this.exercises.filter(ex => ex.category === categoryId).length;
    return {
      ...category,
      exerciseCount,
    };
  }

  static async updateCategoryExerciseCount(categoryId: string, count: number): Promise<void> {
    const index = this.categories.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      this.categories[index] = {
        ...this.categories[index],
        exerciseCount: count,
        updatedAt: new Date(),
      };
    }
  }

  // Update exercise popularity (for recommendation algorithm)
  static async incrementExercisePopularity(exerciseId: string): Promise<void> {
    const index = this.exercises.findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      this.exercises[index] = {
        ...this.exercises[index],
        metadata: {
          ...this.exercises[index].metadata,
          popularity: (this.exercises[index].metadata.popularity || 0) + 1,
        },
        updatedAt: new Date(),
      };
    }
  }

  // Get all available equipment options
  static getAvailableEquipment(): Equipment[] {
    const equipmentSet = new Set<Equipment>();
    this.exercises.forEach(ex => {
      ex.equipment.forEach(eq => equipmentSet.add(eq));
    });
    return Array.from(equipmentSet);
  }

  // Get all available muscle groups
  static getAvailableMuscleGroups(): MuscleGroup[] {
    const muscleSet = new Set<MuscleGroup>();
    this.exercises.forEach(ex => {
      ex.targetMuscles.forEach(muscle => muscleSet.add(muscle));
      ex.secondaryMuscles?.forEach(muscle => muscleSet.add(muscle));
    });
    return Array.from(muscleSet);
  }

  // Get all available tags
  static getAvailableTags(): string[] {
    const tagSet = new Set<string>();
    this.exercises.forEach(ex => {
      ex.metadata.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }
}