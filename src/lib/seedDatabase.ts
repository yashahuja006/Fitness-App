import { ExerciseService } from './exerciseService';
import { exercises, updateCategoryExerciseCounts } from '../data/seedExercises';

/**
 * Seeds the Firestore database with initial exercise data and categories
 * This should be run once during initial setup
 */
export class DatabaseSeeder {
  /**
   * Seeds the database with exercise categories and exercises
   */
  static async seedAll(): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
      // First, seed categories with updated exercise counts
      await this.seedCategories();
      console.log('✅ Categories seeded successfully');
      
      // Then, seed exercises
      await this.seedExercises();
      console.log('✅ Exercises seeded successfully');
      
      console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Seeds exercise categories
   */
  static async seedCategories(): Promise<void> {
    const categoriesWithCounts = updateCategoryExerciseCounts();
    
    console.log(`Seeding ${categoriesWithCounts.length} categories...`);
    
    try {
      await ExerciseService.batchCreateCategories(categoriesWithCounts);
      console.log(`Successfully seeded ${categoriesWithCounts.length} categories`);
    } catch (error) {
      console.error('Error seeding categories:', error);
      throw error;
    }
  }

  /**
   * Seeds exercises in batches to avoid Firestore limits
   */
  static async seedExercises(): Promise<void> {
    const batchSize = 500; // Firestore batch limit
    const totalExercises = exercises.length;
    
    console.log(`Seeding ${totalExercises} exercises in batches of ${batchSize}...`);
    
    try {
      for (let i = 0; i < totalExercises; i += batchSize) {
        const batch = exercises.slice(i, i + batchSize);
        await ExerciseService.batchCreateExercises(batch);
        console.log(`Seeded batch ${Math.floor(i / batchSize) + 1}: ${batch.length} exercises`);
      }
      
      console.log(`Successfully seeded ${totalExercises} exercises`);
    } catch (error) {
      console.error('Error seeding exercises:', error);
      throw error;
    }
  }

  /**
   * Seeds only exercises (useful for adding new exercises)
   */
  static async seedExercisesOnly(): Promise<void> {
    console.log('Seeding exercises only...');
    await this.seedExercises();
  }

  /**
   * Seeds only categories (useful for updating category information)
   */
  static async seedCategoriesOnly(): Promise<void> {
    console.log('Seeding categories only...');
    await this.seedCategories();
  }

  /**
   * Checks if the database has been seeded by looking for exercises
   */
  static async isDatabaseSeeded(): Promise<boolean> {
    try {
      const result = await ExerciseService.getAllExercises(1);
      return result.exercises.length > 0;
    } catch (error) {
      console.error('Error checking if database is seeded:', error);
      return false;
    }
  }

  /**
   * Gets seeding statistics
   */
  static async getSeedingStats(): Promise<{
    totalExercises: number;
    totalCategories: number;
    exercisesByCategory: Record<string, number>;
  }> {
    try {
      const [exercisesResult, categories] = await Promise.all([
        ExerciseService.getAllExercises(1000), // Get a large number to count all
        ExerciseService.getAllCategories(),
      ]);

      const exercisesByCategory: Record<string, number> = {};
      exercisesResult.exercises.forEach(exercise => {
        exercisesByCategory[exercise.category] = (exercisesByCategory[exercise.category] || 0) + 1;
      });

      return {
        totalExercises: exercisesResult.exercises.length,
        totalCategories: categories.length,
        exercisesByCategory,
      };
    } catch (error) {
      console.error('Error getting seeding stats:', error);
      throw error;
    }
  }

  /**
   * Validates that all seed data is properly structured
   */
  static validateSeedData(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate exercises
    exercises.forEach((exercise, index) => {
      if (!exercise.id) {
        errors.push(`Exercise at index ${index} is missing an ID`);
      }
      
      if (!exercise.name) {
        errors.push(`Exercise ${exercise.id} is missing a name`);
      }
      
      if (!exercise.category) {
        errors.push(`Exercise ${exercise.id} is missing a category`);
      }
      
      if (!exercise.targetMuscles || exercise.targetMuscles.length === 0) {
        errors.push(`Exercise ${exercise.id} is missing target muscles`);
      }
      
      if (!exercise.equipment || exercise.equipment.length === 0) {
        errors.push(`Exercise ${exercise.id} is missing equipment information`);
      }
      
      if (!exercise.instructions || exercise.instructions.length === 0) {
        errors.push(`Exercise ${exercise.id} is missing instructions`);
      }
      
      if (!exercise.difficulty) {
        errors.push(`Exercise ${exercise.id} is missing difficulty level`);
      }
      
      if (!exercise.metadata) {
        errors.push(`Exercise ${exercise.id} is missing metadata`);
      }
    });

    // Validate categories
    const categoriesWithCounts = updateCategoryExerciseCounts();
    categoriesWithCounts.forEach((category, index) => {
      if (!category.id) {
        errors.push(`Category at index ${index} is missing an ID`);
      }
      
      if (!category.name) {
        errors.push(`Category ${category.id} is missing a name`);
      }
      
      if (!category.description) {
        errors.push(`Category ${category.id} is missing a description`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Utility function for development/testing
export const runDatabaseSeeding = async (): Promise<void> => {
  // Validate seed data first
  const validation = DatabaseSeeder.validateSeedData();
  if (!validation.isValid) {
    console.error('❌ Seed data validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Seed data validation failed');
  }

  // Check if already seeded
  const isSeeded = await DatabaseSeeder.isDatabaseSeeded();
  if (isSeeded) {
    console.log('⚠️  Database appears to already be seeded. Skipping...');
    const stats = await DatabaseSeeder.getSeedingStats();
    console.log('Current database stats:', stats);
    return;
  }

  // Proceed with seeding
  await DatabaseSeeder.seedAll();
  
  // Show final stats
  const stats = await DatabaseSeeder.getSeedingStats();
  console.log('Final database stats:', stats);
};