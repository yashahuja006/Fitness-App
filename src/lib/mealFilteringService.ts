/**
 * Meal Filtering Service
 * 
 * Provides filtering capabilities for meal planning based on:
 * - Cooking time preferences (quick, moderate, elaborate)
 * - Cuisine preferences (American, Mediterranean, Asian, Mexican, etc.)
 * 
 * Integrates with ingredient database and meal variation algorithms
 * to filter ingredients before meal generation.
 */

import { Ingredient, CuisineType, DietType } from '../types/ingredient';
import { ingredientDatabase } from '../data/ingredientDatabase';

/**
 * Cooking time preference categories
 */
export type CookingTimePreference = 'quick' | 'moderate' | 'elaborate' | 'any';

/**
 * Cooking time ranges in minutes
 */
export const COOKING_TIME_RANGES = {
  quick: { min: 0, max: 15 },
  moderate: { min: 0, max: 30 },
  elaborate: { min: 0, max: Infinity }
} as const;

/**
 * Meal filtering configuration
 */
export interface MealFilterConfig {
  dietType?: DietType;
  cookingTimePreference?: CookingTimePreference;
  cuisinePreferences?: CuisineType[];
  excludeAllergens?: string[];
  excludeIngredients?: string[];
}

/**
 * Filtering result with metadata
 */
export interface FilteredIngredientsResult {
  ingredients: Ingredient[];
  appliedFilters: {
    cookingTime?: CookingTimePreference;
    cuisines?: CuisineType[];
    dietType?: DietType;
  };
  totalAvailable: number;
  filteredCount: number;
}

/**
 * Meal Filtering Service
 */
export class MealFilteringService {
  /**
   * Filter ingredients by cooking time preference
   */
  static filterByCookingTime(
    ingredients: Ingredient[],
    preference: CookingTimePreference
  ): Ingredient[] {
    if (preference === 'any') {
      return ingredients;
    }

    const range = COOKING_TIME_RANGES[preference];
    
    return ingredients.filter(ingredient => {
      // If no prep time specified, assume it's quick (0 minutes)
      const prepTime = ingredient.prepTime ?? 0;
      return prepTime >= range.min && prepTime <= range.max;
    });
  }

  /**
   * Filter ingredients by cuisine preferences
   * Returns ingredients that match ANY of the preferred cuisines
   */
  static filterByCuisinePreferences(
    ingredients: Ingredient[],
    cuisinePreferences: CuisineType[]
  ): Ingredient[] {
    if (cuisinePreferences.length === 0) {
      return ingredients;
    }

    return ingredients.filter(ingredient => {
      // If ingredient has no cuisine types, it's considered universal
      if (!ingredient.cuisineTypes || ingredient.cuisineTypes.length === 0) {
        return true;
      }

      // Check if ingredient matches any of the preferred cuisines
      return ingredient.cuisineTypes.some(cuisine =>
        cuisinePreferences.includes(cuisine)
      );
    });
  }

  /**
   * Filter ingredients by diet type
   */
  static filterByDietType(
    ingredients: Ingredient[],
    dietType: DietType
  ): Ingredient[] {
    return ingredients.filter(ingredient =>
      ingredient.dietTypes.includes(dietType)
    );
  }

  /**
   * Filter ingredients excluding specific allergens
   */
  static filterByAllergens(
    ingredients: Ingredient[],
    excludeAllergens: string[]
  ): Ingredient[] {
    if (excludeAllergens.length === 0) {
      return ingredients;
    }

    return ingredients.filter(ingredient =>
      !ingredient.allergens.some(allergen =>
        excludeAllergens.includes(allergen)
      )
    );
  }

  /**
   * Filter ingredients excluding specific ingredient IDs
   */
  static filterByExcludedIngredients(
    ingredients: Ingredient[],
    excludeIngredients: string[]
  ): Ingredient[] {
    if (excludeIngredients.length === 0) {
      return ingredients;
    }

    return ingredients.filter(ingredient =>
      !excludeIngredients.includes(ingredient.id)
    );
  }

  /**
   * Apply all filters to ingredients
   */
  static applyFilters(
    config: MealFilterConfig,
    sourceIngredients?: Ingredient[]
  ): FilteredIngredientsResult {
    let ingredients = sourceIngredients || [...ingredientDatabase];
    const totalAvailable = ingredients.length;

    // Apply diet type filter
    if (config.dietType) {
      ingredients = this.filterByDietType(ingredients, config.dietType);
    }

    // Apply cooking time filter
    if (config.cookingTimePreference && config.cookingTimePreference !== 'any') {
      ingredients = this.filterByCookingTime(
        ingredients,
        config.cookingTimePreference
      );
    }

    // Apply cuisine preferences filter
    if (config.cuisinePreferences && config.cuisinePreferences.length > 0) {
      ingredients = this.filterByCuisinePreferences(
        ingredients,
        config.cuisinePreferences
      );
    }

    // Apply allergen filter
    if (config.excludeAllergens && config.excludeAllergens.length > 0) {
      ingredients = this.filterByAllergens(ingredients, config.excludeAllergens);
    }

    // Apply excluded ingredients filter
    if (config.excludeIngredients && config.excludeIngredients.length > 0) {
      ingredients = this.filterByExcludedIngredients(
        ingredients,
        config.excludeIngredients
      );
    }

    return {
      ingredients,
      appliedFilters: {
        cookingTime: config.cookingTimePreference,
        cuisines: config.cuisinePreferences,
        dietType: config.dietType
      },
      totalAvailable,
      filteredCount: ingredients.length
    };
  }

  /**
   * Get ingredients for meal planning with filters
   */
  static getFilteredIngredientsForMealPlanning(
    config: MealFilterConfig
  ): Ingredient[] {
    const result = this.applyFilters(config);
    return result.ingredients;
  }

  /**
   * Check if cooking time preference is valid
   */
  static isValidCookingTimePreference(
    preference: string
  ): preference is CookingTimePreference {
    return ['quick', 'moderate', 'elaborate', 'any'].includes(preference);
  }

  /**
   * Get cooking time description
   */
  static getCookingTimeDescription(preference: CookingTimePreference): string {
    switch (preference) {
      case 'quick':
        return 'Quick meals (≤15 minutes)';
      case 'moderate':
        return 'Moderate prep time (≤30 minutes)';
      case 'elaborate':
        return 'Elaborate meals (>30 minutes)';
      case 'any':
        return 'Any cooking time';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get available cuisines from filtered ingredients
   */
  static getAvailableCuisines(ingredients: Ingredient[]): CuisineType[] {
    const cuisines = new Set<CuisineType>();
    
    ingredients.forEach(ingredient => {
      ingredient.cuisineTypes?.forEach(cuisine => cuisines.add(cuisine));
    });

    return Array.from(cuisines).sort();
  }

  /**
   * Get statistics about filtered ingredients
   */
  static getFilterStatistics(result: FilteredIngredientsResult): {
    totalIngredients: number;
    filteredIngredients: number;
    filterEfficiency: number;
    categoryCounts: Record<string, number>;
    cuisineCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    const cuisineCounts: Record<string, number> = {};

    result.ingredients.forEach(ingredient => {
      // Count by category
      categoryCounts[ingredient.category] = 
        (categoryCounts[ingredient.category] || 0) + 1;

      // Count by cuisine
      ingredient.cuisineTypes?.forEach(cuisine => {
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      });
    });

    return {
      totalIngredients: result.totalAvailable,
      filteredIngredients: result.filteredCount,
      filterEfficiency: result.filteredCount / result.totalAvailable,
      categoryCounts,
      cuisineCounts
    };
  }

  /**
   * Validate filter configuration
   */
  static validateFilterConfig(config: MealFilterConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate cooking time preference
    if (
      config.cookingTimePreference &&
      !this.isValidCookingTimePreference(config.cookingTimePreference)
    ) {
      errors.push(
        `Invalid cooking time preference: ${config.cookingTimePreference}`
      );
    }

    // Validate cuisine preferences
    if (config.cuisinePreferences) {
      const validCuisines: CuisineType[] = [
        'american',
        'italian',
        'mexican',
        'asian',
        'indian',
        'mediterranean',
        'middle_eastern',
        'latin_american',
        'european',
        'african'
      ];

      const invalidCuisines = config.cuisinePreferences.filter(
        cuisine => !validCuisines.includes(cuisine)
      );

      if (invalidCuisines.length > 0) {
        errors.push(`Invalid cuisines: ${invalidCuisines.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get recommended filters based on user profile
   */
  static getRecommendedFilters(userProfile: {
    availableTime?: number; // minutes per day for cooking
    preferredCuisines?: CuisineType[];
    dietType?: DietType;
  }): MealFilterConfig {
    const config: MealFilterConfig = {};

    // Recommend cooking time based on available time
    if (userProfile.availableTime !== undefined) {
      if (userProfile.availableTime <= 30) {
        config.cookingTimePreference = 'quick';
      } else if (userProfile.availableTime <= 60) {
        config.cookingTimePreference = 'moderate';
      } else {
        config.cookingTimePreference = 'elaborate';
      }
    }

    // Use preferred cuisines if provided
    if (userProfile.preferredCuisines && userProfile.preferredCuisines.length > 0) {
      config.cuisinePreferences = userProfile.preferredCuisines;
    }

    // Use diet type if provided
    if (userProfile.dietType) {
      config.dietType = userProfile.dietType;
    }

    return config;
  }
}

/**
 * Convenience function to filter ingredients
 */
export function filterIngredients(
  config: MealFilterConfig,
  sourceIngredients?: Ingredient[]
): Ingredient[] {
  return MealFilteringService.getFilteredIngredientsForMealPlanning(config);
}

/**
 * Convenience function to get filtered ingredients with metadata
 */
export function getFilteredIngredients(
  config: MealFilterConfig,
  sourceIngredients?: Ingredient[]
): FilteredIngredientsResult {
  return MealFilteringService.applyFilters(config, sourceIngredients);
}

/**
 * Convenience function to validate filter config
 */
export function validateFilterConfig(config: MealFilterConfig): {
  isValid: boolean;
  errors: string[];
} {
  return MealFilteringService.validateFilterConfig(config);
}
