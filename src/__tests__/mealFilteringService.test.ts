/**
 * Tests for Meal Filtering Service
 * 
 * Tests cooking time and cuisine preference filtering functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  MealFilteringService,
  CookingTimePreference,
  MealFilterConfig,
  filterIngredients,
  getFilteredIngredients,
  validateFilterConfig
} from '../lib/mealFilteringService';
import { Ingredient, CuisineType, DietType } from '../types/ingredient';
import { ingredientDatabase } from '../data/ingredientDatabase';

describe('MealFilteringService', () => {
  describe('filterByCookingTime', () => {
    it('should filter ingredients for quick cooking time (≤15 minutes)', () => {
      const result = MealFilteringService.filterByCookingTime(
        ingredientDatabase,
        'quick'
      );

      result.forEach(ingredient => {
        const prepTime = ingredient.prepTime ?? 0;
        expect(prepTime).toBeLessThanOrEqual(15);
      });
    });

    it('should filter ingredients for moderate cooking time (≤30 minutes)', () => {
      const result = MealFilteringService.filterByCookingTime(
        ingredientDatabase,
        'moderate'
      );

      result.forEach(ingredient => {
        const prepTime = ingredient.prepTime ?? 0;
        expect(prepTime).toBeLessThanOrEqual(30);
      });
    });

    it('should return all ingredients for elaborate cooking time', () => {
      const result = MealFilteringService.filterByCookingTime(
        ingredientDatabase,
        'elaborate'
      );

      expect(result.length).toBe(ingredientDatabase.length);
    });

    it('should return all ingredients for "any" preference', () => {
      const result = MealFilteringService.filterByCookingTime(
        ingredientDatabase,
        'any'
      );

      expect(result.length).toBe(ingredientDatabase.length);
    });

    it('should treat ingredients without prepTime as quick (0 minutes)', () => {
      const testIngredients: Ingredient[] = [
        {
          id: 'test-1',
          name: 'Test Ingredient',
          category: 'protein',
          servingSize: { amount: 100, unit: 'g', gramsEquivalent: 100 },
          macros: { calories: 100, protein: 20, carbohydrates: 0, fiber: 0, fats: 2 },
          dietTypes: ['standard'],
          allergens: [],
          costLevel: 'medium',
          availability: 'common',
          cookingRequired: false
          // No prepTime specified
        }
      ];

      const result = MealFilteringService.filterByCookingTime(
        testIngredients,
        'quick'
      );

      expect(result.length).toBe(1);
    });
  });

  describe('filterByCuisinePreferences', () => {
    it('should filter ingredients by single cuisine preference', () => {
      const result = MealFilteringService.filterByCuisinePreferences(
        ingredientDatabase,
        ['mediterranean']
      );

      result.forEach(ingredient => {
        if (ingredient.cuisineTypes && ingredient.cuisineTypes.length > 0) {
          expect(ingredient.cuisineTypes).toContain('mediterranean');
        }
      });
    });

    it('should filter ingredients by multiple cuisine preferences', () => {
      const cuisines: CuisineType[] = ['italian', 'mexican'];
      const result = MealFilteringService.filterByCuisinePreferences(
        ingredientDatabase,
        cuisines
      );

      result.forEach(ingredient => {
        if (ingredient.cuisineTypes && ingredient.cuisineTypes.length > 0) {
          const hasMatchingCuisine = ingredient.cuisineTypes.some(cuisine =>
            cuisines.includes(cuisine)
          );
          expect(hasMatchingCuisine).toBe(true);
        }
      });
    });

    it('should include ingredients with no cuisine types (universal)', () => {
      const testIngredients: Ingredient[] = [
        {
          id: 'universal',
          name: 'Universal Ingredient',
          category: 'protein',
          servingSize: { amount: 100, unit: 'g', gramsEquivalent: 100 },
          macros: { calories: 100, protein: 20, carbohydrates: 0, fiber: 0, fats: 2 },
          dietTypes: ['standard'],
          allergens: [],
          costLevel: 'medium',
          availability: 'common',
          cookingRequired: false
          // No cuisineTypes specified
        }
      ];

      const result = MealFilteringService.filterByCuisinePreferences(
        testIngredients,
        ['italian']
      );

      expect(result.length).toBe(1);
    });

    it('should return all ingredients when no cuisine preferences specified', () => {
      const result = MealFilteringService.filterByCuisinePreferences(
        ingredientDatabase,
        []
      );

      expect(result.length).toBe(ingredientDatabase.length);
    });
  });

  describe('filterByDietType', () => {
    it('should filter ingredients by vegetarian diet', () => {
      const result = MealFilteringService.filterByDietType(
        ingredientDatabase,
        'vegetarian'
      );

      result.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('vegetarian');
      });
    });

    it('should filter ingredients by vegan diet', () => {
      const result = MealFilteringService.filterByDietType(
        ingredientDatabase,
        'vegan'
      );

      result.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('vegan');
      });
    });

    it('should filter ingredients by keto diet', () => {
      const result = MealFilteringService.filterByDietType(
        ingredientDatabase,
        'keto'
      );

      result.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('keto');
      });
    });
  });

  describe('applyFilters', () => {
    it('should apply multiple filters together', () => {
      const config: MealFilterConfig = {
        dietType: 'vegetarian',
        cookingTimePreference: 'quick',
        cuisinePreferences: ['mediterranean', 'italian']
      };

      const result = MealFilteringService.applyFilters(config);

      expect(result.filteredCount).toBeGreaterThan(0);
      expect(result.filteredCount).toBeLessThanOrEqual(result.totalAvailable);

      result.ingredients.forEach(ingredient => {
        // Check diet type
        expect(ingredient.dietTypes).toContain('vegetarian');

        // Check cooking time
        const prepTime = ingredient.prepTime ?? 0;
        expect(prepTime).toBeLessThanOrEqual(15);

        // Check cuisine (if specified)
        if (ingredient.cuisineTypes && ingredient.cuisineTypes.length > 0) {
          const hasMatchingCuisine = ingredient.cuisineTypes.some(cuisine =>
            ['mediterranean', 'italian'].includes(cuisine)
          );
          expect(hasMatchingCuisine).toBe(true);
        }
      });
    });

    it('should return metadata about applied filters', () => {
      const config: MealFilterConfig = {
        dietType: 'keto',
        cookingTimePreference: 'moderate',
        cuisinePreferences: ['american']
      };

      const result = MealFilteringService.applyFilters(config);

      expect(result.appliedFilters.dietType).toBe('keto');
      expect(result.appliedFilters.cookingTime).toBe('moderate');
      expect(result.appliedFilters.cuisines).toEqual(['american']);
    });

    it('should exclude specified allergens', () => {
      const config: MealFilterConfig = {
        dietType: 'standard',
        excludeAllergens: ['dairy', 'eggs']
      };

      const result = MealFilteringService.applyFilters(config);

      result.ingredients.forEach(ingredient => {
        expect(ingredient.allergens).not.toContain('dairy');
        expect(ingredient.allergens).not.toContain('eggs');
      });
    });

    it('should exclude specified ingredients', () => {
      const config: MealFilterConfig = {
        dietType: 'standard',
        excludeIngredients: ['chicken-breast', 'salmon']
      };

      const result = MealFilteringService.applyFilters(config);

      result.ingredients.forEach(ingredient => {
        expect(ingredient.id).not.toBe('chicken-breast');
        expect(ingredient.id).not.toBe('salmon');
      });
    });
  });

  describe('getFilteredIngredientsForMealPlanning', () => {
    it('should return filtered ingredients array', () => {
      const config: MealFilterConfig = {
        dietType: 'paleo',
        cookingTimePreference: 'quick'
      };

      const result = MealFilteringService.getFilteredIngredientsForMealPlanning(config);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('paleo');
        const prepTime = ingredient.prepTime ?? 0;
        expect(prepTime).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('getCookingTimeDescription', () => {
    it('should return correct descriptions for cooking time preferences', () => {
      expect(MealFilteringService.getCookingTimeDescription('quick'))
        .toBe('Quick meals (≤15 minutes)');
      expect(MealFilteringService.getCookingTimeDescription('moderate'))
        .toBe('Moderate prep time (≤30 minutes)');
      expect(MealFilteringService.getCookingTimeDescription('elaborate'))
        .toBe('Elaborate meals (>30 minutes)');
      expect(MealFilteringService.getCookingTimeDescription('any'))
        .toBe('Any cooking time');
    });
  });

  describe('getAvailableCuisines', () => {
    it('should return unique cuisines from ingredients', () => {
      const cuisines = MealFilteringService.getAvailableCuisines(ingredientDatabase);

      expect(Array.isArray(cuisines)).toBe(true);
      expect(cuisines.length).toBeGreaterThan(0);

      // Check for duplicates
      const uniqueCuisines = new Set(cuisines);
      expect(uniqueCuisines.size).toBe(cuisines.length);
    });

    it('should return sorted cuisine list', () => {
      const cuisines = MealFilteringService.getAvailableCuisines(ingredientDatabase);
      const sortedCuisines = [...cuisines].sort();

      expect(cuisines).toEqual(sortedCuisines);
    });
  });

  describe('getFilterStatistics', () => {
    it('should return statistics about filtered ingredients', () => {
      const config: MealFilterConfig = {
        dietType: 'vegetarian',
        cookingTimePreference: 'quick'
      };

      const result = MealFilteringService.applyFilters(config);
      const stats = MealFilteringService.getFilterStatistics(result);

      expect(stats.totalIngredients).toBe(ingredientDatabase.length);
      expect(stats.filteredIngredients).toBe(result.filteredCount);
      expect(stats.filterEfficiency).toBeGreaterThan(0);
      expect(stats.filterEfficiency).toBeLessThanOrEqual(1);
      expect(typeof stats.categoryCounts).toBe('object');
      expect(typeof stats.cuisineCounts).toBe('object');
    });
  });

  describe('validateFilterConfig', () => {
    it('should validate correct filter configuration', () => {
      const config: MealFilterConfig = {
        dietType: 'standard',
        cookingTimePreference: 'quick',
        cuisinePreferences: ['italian', 'mexican']
      };

      const validation = MealFilteringService.validateFilterConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should reject invalid cooking time preference', () => {
      const config: MealFilterConfig = {
        cookingTimePreference: 'super-fast' as CookingTimePreference
      };

      const validation = MealFilteringService.validateFilterConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid cuisine preferences', () => {
      const config: MealFilterConfig = {
        cuisinePreferences: ['invalid-cuisine' as CuisineType]
      };

      const validation = MealFilteringService.validateFilterConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedFilters', () => {
    it('should recommend quick cooking for limited time', () => {
      const recommended = MealFilteringService.getRecommendedFilters({
        availableTime: 20
      });

      expect(recommended.cookingTimePreference).toBe('quick');
    });

    it('should recommend moderate cooking for medium time', () => {
      const recommended = MealFilteringService.getRecommendedFilters({
        availableTime: 45
      });

      expect(recommended.cookingTimePreference).toBe('moderate');
    });

    it('should recommend elaborate cooking for ample time', () => {
      const recommended = MealFilteringService.getRecommendedFilters({
        availableTime: 90
      });

      expect(recommended.cookingTimePreference).toBe('elaborate');
    });

    it('should use provided cuisine preferences', () => {
      const recommended = MealFilteringService.getRecommendedFilters({
        preferredCuisines: ['italian', 'mediterranean']
      });

      expect(recommended.cuisinePreferences).toEqual(['italian', 'mediterranean']);
    });

    it('should use provided diet type', () => {
      const recommended = MealFilteringService.getRecommendedFilters({
        dietType: 'vegan'
      });

      expect(recommended.dietType).toBe('vegan');
    });
  });

  describe('Convenience functions', () => {
    it('filterIngredients should work correctly', () => {
      const config: MealFilterConfig = {
        dietType: 'keto',
        cookingTimePreference: 'quick'
      };

      const result = filterIngredients(config);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('keto');
      });
    });

    it('getFilteredIngredients should return full result', () => {
      const config: MealFilterConfig = {
        dietType: 'paleo'
      };

      const result = getFilteredIngredients(config);

      expect(result.ingredients).toBeDefined();
      expect(result.appliedFilters).toBeDefined();
      expect(result.totalAvailable).toBeDefined();
      expect(result.filteredCount).toBeDefined();
    });

    it('validateFilterConfig should work correctly', () => {
      const config: MealFilterConfig = {
        cookingTimePreference: 'quick'
      };

      const validation = validateFilterConfig(config);

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Integration with all diet types', () => {
    const dietTypes: DietType[] = [
      'standard',
      'vegetarian',
      'vegan',
      'keto',
      'paleo',
      'mediterranean',
      'gluten_free',
      'dairy_free'
    ];

    dietTypes.forEach(dietType => {
      it(`should filter ingredients for ${dietType} diet`, () => {
        const config: MealFilterConfig = {
          dietType,
          cookingTimePreference: 'moderate'
        };

        const result = MealFilteringService.applyFilters(config);

        expect(result.filteredCount).toBeGreaterThan(0);
        result.ingredients.forEach(ingredient => {
          expect(ingredient.dietTypes).toContain(dietType);
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty ingredient database', () => {
      const result = MealFilteringService.applyFilters(
        { dietType: 'standard' },
        []
      );

      expect(result.filteredCount).toBe(0);
      expect(result.ingredients.length).toBe(0);
    });

    it('should handle filters that match no ingredients', () => {
      const config: MealFilterConfig = {
        dietType: 'vegan',
        excludeIngredients: ingredientDatabase
          .filter(i => i.dietTypes.includes('vegan'))
          .map(i => i.id)
      };

      const result = MealFilteringService.applyFilters(config);

      expect(result.filteredCount).toBe(0);
    });

    it('should handle multiple cuisine preferences with no matches', () => {
      const testIngredients: Ingredient[] = [
        {
          id: 'test',
          name: 'Test',
          category: 'protein',
          servingSize: { amount: 100, unit: 'g', gramsEquivalent: 100 },
          macros: { calories: 100, protein: 20, carbohydrates: 0, fiber: 0, fats: 2 },
          dietTypes: ['standard'],
          allergens: [],
          cuisineTypes: ['american'],
          costLevel: 'medium',
          availability: 'common',
          cookingRequired: false
        }
      ];

      const result = MealFilteringService.filterByCuisinePreferences(
        testIngredients,
        ['italian', 'mexican']
      );

      expect(result.length).toBe(0);
    });
  });
});
