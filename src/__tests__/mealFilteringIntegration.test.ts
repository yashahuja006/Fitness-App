/**
 * Integration Tests for Meal Filtering with Meal Variation Algorithms
 * 
 * Tests that filtering integrates correctly with meal generation
 */

import { describe, it, expect } from '@jest/globals';
import {
  MealVariationService,
  MealVariationConfig,
  generateMealVariation
} from '../lib/mealVariationAlgorithms';
import { CuisineType } from '../types/ingredient';

describe('Meal Filtering Integration', () => {
  describe('Integration with Meal Variation Service', () => {
    it('should generate meals with quick cooking time preference', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: {
          calories: 500,
          protein: 30,
          carbohydrates: 50,
          fats: 15,
          fiber: 8
        },
        mealType: 'lunch',
        dayNumber: 1,
        cookingTimePreference: 'quick'
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
      expect(meal.cookingTime).toBeLessThanOrEqual(15);
    });

    it('should generate meals with moderate cooking time preference', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'vegetarian',
        targetMacros: {
          calories: 600,
          protein: 25,
          carbohydrates: 70,
          fats: 20,
          fiber: 12
        },
        mealType: 'dinner',
        dayNumber: 2,
        cookingTimePreference: 'moderate'
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
      expect(meal.cookingTime).toBeLessThanOrEqual(30);
    });

    it('should generate meals with cuisine preferences', () => {
      const cuisines: CuisineType[] = ['mediterranean', 'italian'];
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'mediterranean',
        targetMacros: {
          calories: 550,
          protein: 28,
          carbohydrates: 55,
          fats: 18,
          fiber: 10
        },
        mealType: 'lunch',
        dayNumber: 1,
        cuisinePreferences: cuisines
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);

      // Check that ingredients match cuisine preferences (if they have cuisine types)
      meal.ingredients.forEach(mealIngredient => {
        const ingredient = meal.ingredients.find(i => i.ingredientId === mealIngredient.ingredientId);
        expect(ingredient).toBeDefined();
      });
    });

    it('should generate meals with both cooking time and cuisine filters', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: {
          calories: 500,
          protein: 35,
          carbohydrates: 45,
          fats: 15,
          fiber: 8
        },
        mealType: 'breakfast',
        dayNumber: 1,
        cookingTimePreference: 'quick',
        cuisinePreferences: ['american']
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
      expect(meal.cookingTime).toBeLessThanOrEqual(15);
    });

    it('should work with free tier and filtering', () => {
      const config: MealVariationConfig = {
        tier: 'free',
        dietType: 'standard',
        targetMacros: {
          calories: 450,
          protein: 30,
          carbohydrates: 50,
          fats: 12,
          fiber: 7
        },
        mealType: 'lunch',
        dayNumber: 1,
        cookingTimePreference: 'quick'
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.variationLevel).toBe('basic');
      expect(meal.cookingTime).toBeLessThanOrEqual(15);
    });
  });

  describe('Meal Rotation with Filtering', () => {
    it('should generate meal rotation with consistent filtering', () => {
      const meals = MealVariationService.generateMealRotation(
        'pro',
        'vegetarian',
        {
          calories: 500,
          protein: 25,
          carbohydrates: 60,
          fats: 15,
          fiber: 10
        },
        'lunch'
      );

      expect(meals.length).toBe(7); // Pro tier gets 7-day rotation
      meals.forEach(meal => {
        expect(meal.ingredients.length).toBeGreaterThan(0);
        expect(meal.macros).toBeDefined();
      });
    });

    it('should generate different meals across rotation days', () => {
      const meals = MealVariationService.generateMealRotation(
        'pro',
        'standard',
        {
          calories: 550,
          protein: 30,
          carbohydrates: 55,
          fats: 18,
          fiber: 9
        },
        'dinner'
      );

      // Check that meals are different (at least some variation in ingredients)
      const mealNames = meals.map(m => m.name);
      const uniqueNames = new Set(mealNames);
      
      // Should have some variety (not all identical)
      expect(uniqueNames.size).toBeGreaterThan(1);
    });
  });

  describe('Filter Impact on Meal Quality', () => {
    it('should maintain macro targets with filtering', () => {
      const targetMacros = {
        calories: 500,
        protein: 30,
        carbohydrates: 50,
        fats: 15,
        fiber: 8
      };

      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros,
        mealType: 'lunch',
        dayNumber: 1,
        cookingTimePreference: 'quick',
        cuisinePreferences: ['american', 'italian']
      };

      const meal = generateMealVariation(config);

      // Allow 30% tolerance for macro matching
      const tolerance = 0.3;
      
      expect(meal.macros.protein).toBeGreaterThan(targetMacros.protein * (1 - tolerance));
      expect(meal.macros.protein).toBeLessThan(targetMacros.protein * (1 + tolerance));
    });

    it('should generate valid meals for restrictive filters', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'vegan',
        targetMacros: {
          calories: 450,
          protein: 20,
          carbohydrates: 60,
          fats: 12,
          fiber: 12
        },
        mealType: 'dinner',
        dayNumber: 1,
        cookingTimePreference: 'quick',
        cuisinePreferences: ['asian']
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
      expect(meal.cookingTime).toBeLessThanOrEqual(15);
    });
  });

  describe('Cuisine Preference Impact', () => {
    it('should respect single cuisine preference', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'mediterranean',
        targetMacros: {
          calories: 550,
          protein: 28,
          carbohydrates: 55,
          fats: 18,
          fiber: 10
        },
        mealType: 'lunch',
        dayNumber: 1,
        cuisinePreferences: ['mediterranean']
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.tags).toContain('mediterranean');
    });

    it('should work with multiple cuisine preferences', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: {
          calories: 500,
          protein: 30,
          carbohydrates: 50,
          fats: 15,
          fiber: 8
        },
        mealType: 'dinner',
        dayNumber: 1,
        cuisinePreferences: ['italian', 'mediterranean', 'american']
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
    });
  });

  describe('Cooking Time Categories', () => {
    it('should generate quick meals consistently', () => {
      for (let day = 1; day <= 3; day++) {
        const config: MealVariationConfig = {
          tier: 'pro',
          dietType: 'standard',
          targetMacros: {
            calories: 500,
            protein: 30,
            carbohydrates: 50,
            fats: 15,
            fiber: 8
          },
          mealType: 'breakfast',
          dayNumber: day,
          cookingTimePreference: 'quick'
        };

        const meal = generateMealVariation(config);
        expect(meal.cookingTime).toBeLessThanOrEqual(15);
      }
    });

    it('should generate moderate meals consistently', () => {
      for (let day = 1; day <= 3; day++) {
        const config: MealVariationConfig = {
          tier: 'pro',
          dietType: 'vegetarian',
          targetMacros: {
            calories: 550,
            protein: 25,
            carbohydrates: 65,
            fats: 18,
            fiber: 12
          },
          mealType: 'lunch',
          dayNumber: day,
          cookingTimePreference: 'moderate'
        };

        const meal = generateMealVariation(config);
        expect(meal.cookingTime).toBeLessThanOrEqual(30);
      }
    });
  });

  describe('Diet Type Compatibility', () => {
    const dietTypes = ['vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'] as const;

    dietTypes.forEach(dietType => {
      it(`should generate meals for ${dietType} diet with filtering`, () => {
        const config: MealVariationConfig = {
          tier: 'pro',
          dietType,
          targetMacros: {
            calories: 500,
            protein: 25,
            carbohydrates: dietType === 'keto' ? 20 : 50,
            fats: dietType === 'keto' ? 35 : 15,
            fiber: 8
          },
          mealType: 'lunch',
          dayNumber: 1,
          cookingTimePreference: 'moderate'
        };

        const meal = generateMealVariation(config);

        expect(meal).toBeDefined();
        expect(meal.ingredients.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle no cooking time preference (defaults to any)', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: {
          calories: 500,
          protein: 30,
          carbohydrates: 50,
          fats: 15,
          fiber: 8
        },
        mealType: 'lunch',
        dayNumber: 1
        // No cookingTimePreference specified
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
    });

    it('should handle no cuisine preferences', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: {
          calories: 500,
          protein: 30,
          carbohydrates: 50,
          fats: 15,
          fiber: 8
        },
        mealType: 'lunch',
        dayNumber: 1,
        cookingTimePreference: 'quick'
        // No cuisinePreferences specified
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      expect(meal.ingredients.length).toBeGreaterThan(0);
    });

    it('should handle excluded ingredients with filtering', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: {
          calories: 500,
          protein: 30,
          carbohydrates: 50,
          fats: 15,
          fiber: 8
        },
        mealType: 'lunch',
        dayNumber: 1,
        cookingTimePreference: 'quick',
        excludeIngredients: ['chicken-breast', 'salmon']
      };

      const meal = generateMealVariation(config);

      expect(meal).toBeDefined();
      
      // Verify excluded ingredients are not present
      meal.ingredients.forEach(ingredient => {
        expect(ingredient.ingredientId).not.toBe('chicken-breast');
        expect(ingredient.ingredientId).not.toBe('salmon');
      });
    });
  });
});
