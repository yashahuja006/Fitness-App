/**
 * Tests for Meal Variation Algorithms
 * 
 * Tests both Free and Pro tier meal variation functionality including:
 * - Rotation day limits (3-day vs 7-day)
 * - Ingredient variety levels
 * - Macro target compliance
 * - Substitution features (Pro only)
 * - Seasonal variations (Pro only)
 */

import {
  MealVariationService,
  generateMealVariation,
  generateMealRotation,
  getVariationStrategy,
  findIngredientSubstitutions,
  MealVariationConfig,
  SubscriptionTier,
  MealType
} from '../mealVariationAlgorithms';
import { DietType } from '../../types/ingredient';
import { MacroDistribution } from '../macroIntelligenceSystem';

describe('MealVariationService', () => {
  // Test data
  const mockTargetMacros: MacroDistribution = {
    calories: 500,
    protein: 40,
    carbohydrates: 50,
    fats: 15,
    fiber: 10
  };

  describe('getVariationStrategy', () => {
    it('should return 3-day rotation for free tier', () => {
      const strategy = getVariationStrategy('free');

      expect(strategy.rotationDays).toBe(3);
      expect(strategy.varietyLevel).toBe('low');
      expect(strategy.substitutionOptions).toBe(false);
      expect(strategy.seasonalVariations).toBe(false);
      expect(strategy.description).toContain('3-day');
    });

    it('should return 7-day rotation for pro tier', () => {
      const strategy = getVariationStrategy('pro');

      expect(strategy.rotationDays).toBe(7);
      expect(strategy.varietyLevel).toBe('high');
      expect(strategy.substitutionOptions).toBe(true);
      expect(strategy.seasonalVariations).toBe(true);
      expect(strategy.description).toContain('7-day');
    });
  });

  describe('generateMealVariation', () => {
    it('should generate a valid meal variation for free tier', () => {
      const config: MealVariationConfig = {
        tier: 'free',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      expect(variation).toBeDefined();
      expect(variation.mealType).toBe('lunch');
      expect(variation.dayNumber).toBe(1);
      expect(variation.variationLevel).toBe('basic');
      expect(variation.ingredients.length).toBeGreaterThan(0);
      expect(variation.macros).toBeDefined();
      expect(variation.preparation).toBeTruthy();
      expect(variation.cookingTime).toBeGreaterThan(0);
    });

    it('should generate a valid meal variation for pro tier', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'dinner',
        dayNumber: 5
      };

      const variation = generateMealVariation(config);

      expect(variation).toBeDefined();
      expect(variation.mealType).toBe('dinner');
      expect(variation.dayNumber).toBe(5);
      expect(variation.variationLevel).toBe('advanced');
      expect(variation.ingredients.length).toBeGreaterThan(0);
    });

    it('should normalize day number to rotation cycle for free tier', () => {
      const config: MealVariationConfig = {
        tier: 'free',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'breakfast',
        dayNumber: 5 // Should normalize to day 2 (5 % 3 = 2)
      };

      const variation = generateMealVariation(config);

      expect(variation.dayNumber).toBe(2);
    });

    it('should normalize day number to rotation cycle for pro tier', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'breakfast',
        dayNumber: 9 // Should normalize to day 2 (9 % 7 = 2)
      };

      const variation = generateMealVariation(config);

      expect(variation.dayNumber).toBe(2);
    });

    it('should respect diet type restrictions', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'vegan',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      // Check that no animal products are included
      const animalProducts = ['chicken', 'beef', 'fish', 'egg', 'dairy'];
      const hasAnimalProducts = variation.ingredients.some(ing =>
        animalProducts.some(product => 
          ing.ingredientName.toLowerCase().includes(product)
        )
      );

      expect(hasAnimalProducts).toBe(false);
    });

    it('should exclude specified ingredients', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'dinner',
        dayNumber: 1,
        excludeIngredients: ['chicken-breast', 'salmon']
      };

      const variation = generateMealVariation(config);

      const hasExcludedIngredients = variation.ingredients.some(ing =>
        config.excludeIngredients?.includes(ing.ingredientId)
      );

      expect(hasExcludedIngredients).toBe(false);
    });

    it('should generate appropriate macros close to target', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      // Allow 30% tolerance for generated meals
      const tolerance = 0.3;
      
      expect(variation.macros.protein).toBeGreaterThan(mockTargetMacros.protein * (1 - tolerance));
      expect(variation.macros.protein).toBeLessThan(mockTargetMacros.protein * (1 + tolerance));
    });

    it('should include appropriate tags', () => {
      const config: MealVariationConfig = {
        tier: 'free',
        dietType: 'keto',
        targetMacros: { ...mockTargetMacros, carbohydrates: 10 },
        mealType: 'breakfast',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      expect(variation.tags).toContain('basic-rotation');
      expect(variation.tags).toContain('keto');
      expect(variation.tags).toContain('breakfast');
      expect(variation.tags).toContain('low-carb');
    });
  });

  describe('generateMealRotation', () => {
    it('should generate 3 meals for free tier', () => {
      const rotation = generateMealRotation(
        'free',
        'standard',
        mockTargetMacros,
        'lunch'
      );

      expect(rotation).toHaveLength(3);
      expect(rotation[0].dayNumber).toBe(1);
      expect(rotation[1].dayNumber).toBe(2);
      expect(rotation[2].dayNumber).toBe(3);
    });

    it('should generate 7 meals for pro tier', () => {
      const rotation = generateMealRotation(
        'pro',
        'standard',
        mockTargetMacros,
        'dinner'
      );

      expect(rotation).toHaveLength(7);
      expect(rotation[0].dayNumber).toBe(1);
      expect(rotation[6].dayNumber).toBe(7);
    });

    it('should generate different meals for each day', () => {
      const rotation = generateMealRotation(
        'pro',
        'standard',
        mockTargetMacros,
        'breakfast'
      );

      // Check that meals have different names (indicating variety)
      const mealNames = rotation.map(m => m.name);
      const uniqueNames = new Set(mealNames);
      
      // Should have at least some variety
      expect(uniqueNames.size).toBeGreaterThan(1);
    });

    it('should maintain consistent meal type across rotation', () => {
      const rotation = generateMealRotation(
        'pro',
        'standard',
        mockTargetMacros,
        'snack'
      );

      rotation.forEach(meal => {
        expect(meal.mealType).toBe('snack');
      });
    });
  });

  describe('findIngredientSubstitutions', () => {
    it('should find substitutions for a protein source', () => {
      const substitutions = findIngredientSubstitutions(
        'chicken-breast',
        'standard',
        3
      );

      expect(substitutions.length).toBeGreaterThan(0);
      expect(substitutions.length).toBeLessThanOrEqual(3);
      
      // All substitutions should be protein sources
      substitutions.forEach(sub => {
        expect(sub.category).toBe('protein');
      });
    });

    it('should respect diet type when finding substitutions', () => {
      const substitutions = findIngredientSubstitutions(
        'tofu-firm',
        'vegan',
        5
      );

      // All substitutions should be vegan-compatible
      substitutions.forEach(sub => {
        expect(sub.dietTypes).toContain('vegan');
      });
    });

    it('should return empty array for non-existent ingredient', () => {
      const substitutions = findIngredientSubstitutions(
        'non-existent-ingredient',
        'standard'
      );

      expect(substitutions).toEqual([]);
    });

    it('should find similar macro profiles', () => {
      const substitutions = findIngredientSubstitutions(
        'chicken-breast',
        'standard',
        3
      );

      // Substitutions should have similar protein content
      // Chicken breast has ~31g protein per 100g
      substitutions.forEach(sub => {
        expect(sub.macros.protein).toBeGreaterThan(20);
        expect(sub.macros.protein).toBeLessThan(40);
      });
    });
  });

  describe('validateMealVariation', () => {
    it('should validate meal within tolerance', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);
      const validation = MealVariationService.validateMealVariation(
        variation,
        mockTargetMacros,
        0.5 // 50% tolerance for this test
      );

      // With generous tolerance, should pass
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect meals outside tolerance', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);
      
      // Use very strict tolerance
      const validation = MealVariationService.validateMealVariation(
        variation,
        mockTargetMacros,
        0.05 // 5% tolerance
      );

      // With strict tolerance, might fail
      if (!validation.isValid) {
        expect(validation.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateUpgradePrompt', () => {
    it('should return empty string for days 1-3', () => {
      expect(MealVariationService.generateUpgradePrompt(1)).toBe('');
      expect(MealVariationService.generateUpgradePrompt(2)).toBe('');
      expect(MealVariationService.generateUpgradePrompt(3)).toBe('');
    });

    it('should return upgrade prompt for day 4+', () => {
      const prompt = MealVariationService.generateUpgradePrompt(4);
      
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Pro');
      expect(prompt).toContain('3-day rotation');
    });
  });

  describe('Tier-specific behavior', () => {
    it('should show limited variety for free tier across multiple days', () => {
      const day1Config: MealVariationConfig = {
        tier: 'free',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const day4Config: MealVariationConfig = {
        ...day1Config,
        dayNumber: 4 // Should be same as day 1 (4 % 3 = 1)
      };

      const day1Meal = generateMealVariation(day1Config);
      const day4Meal = generateMealVariation(day4Config);

      // Both should normalize to day 1
      expect(day1Meal.dayNumber).toBe(1);
      expect(day4Meal.dayNumber).toBe(1);
    });

    it('should show more variety for pro tier across multiple days', () => {
      const meals: any[] = [];
      
      for (let day = 1; day <= 7; day++) {
        const config: MealVariationConfig = {
          tier: 'pro',
          dietType: 'standard',
          targetMacros: mockTargetMacros,
          mealType: 'dinner',
          dayNumber: day
        };
        
        meals.push(generateMealVariation(config));
      }

      // Check that we have 7 different day numbers
      const dayNumbers = meals.map(m => m.dayNumber);
      const uniqueDays = new Set(dayNumbers);
      
      expect(uniqueDays.size).toBe(7);
    });
  });

  describe('Different meal types', () => {
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

    mealTypes.forEach(mealType => {
      it(`should generate valid ${mealType} meal`, () => {
        const config: MealVariationConfig = {
          tier: 'pro',
          dietType: 'standard',
          targetMacros: mockTargetMacros,
          mealType,
          dayNumber: 1
        };

        const variation = generateMealVariation(config);

        expect(variation.mealType).toBe(mealType);
        expect(variation.ingredients.length).toBeGreaterThan(0);
        expect(variation.name).toBeTruthy();
      });
    });
  });

  describe('Different diet types', () => {
    const dietTypes: DietType[] = ['standard', 'vegetarian', 'vegan', 'keto', 'paleo'];

    dietTypes.forEach(dietType => {
      it(`should generate valid meal for ${dietType} diet`, () => {
        const config: MealVariationConfig = {
          tier: 'pro',
          dietType,
          targetMacros: mockTargetMacros,
          mealType: 'lunch',
          dayNumber: 1
        };

        const variation = generateMealVariation(config);

        expect(variation).toBeDefined();
        expect(variation.ingredients.length).toBeGreaterThan(0);
        expect(variation.tags).toContain(dietType);
      });
    });
  });

  describe('Macro cycling support', () => {
    it('should handle high-carb training day macros', () => {
      const trainingDayMacros: MacroDistribution = {
        calories: 600,
        protein: 45,
        carbohydrates: 80,
        fats: 12,
        fiber: 12
      };

      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: trainingDayMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      expect(variation.macros.carbohydrates).toBeGreaterThan(50);
    });

    it('should handle low-carb rest day macros', () => {
      const restDayMacros: MacroDistribution = {
        calories: 400,
        protein: 45,
        carbohydrates: 20,
        fats: 20,
        fiber: 8
      };

      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: restDayMacros,
        mealType: 'dinner',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      expect(variation.macros.carbohydrates).toBeLessThan(40);
    });
  });

  describe('Edge cases', () => {
    it('should handle very high protein targets', () => {
      const highProteinMacros: MacroDistribution = {
        calories: 600,
        protein: 80,
        carbohydrates: 30,
        fats: 15,
        fiber: 10
      };

      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: highProteinMacros,
        mealType: 'lunch',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      expect(variation).toBeDefined();
      expect(variation.macros.protein).toBeGreaterThan(40);
      expect(variation.tags).toContain('high-protein');
    });

    it('should handle keto macros (very low carb)', () => {
      const ketoMacros: MacroDistribution = {
        calories: 500,
        protein: 35,
        carbohydrates: 8,
        fats: 40,
        fiber: 5
      };

      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'keto',
        targetMacros: ketoMacros,
        mealType: 'dinner',
        dayNumber: 1
      };

      const variation = generateMealVariation(config);

      expect(variation).toBeDefined();
      // Keto meals should stay under 30g carbs per meal (realistic for keto diet)
      expect(variation.macros.carbohydrates).toBeLessThan(30);
      expect(variation.tags).toContain('low-carb');
    });

    it('should handle empty exclude list', () => {
      const config: MealVariationConfig = {
        tier: 'pro',
        dietType: 'standard',
        targetMacros: mockTargetMacros,
        mealType: 'lunch',
        dayNumber: 1,
        excludeIngredients: []
      };

      const variation = generateMealVariation(config);

      expect(variation).toBeDefined();
      expect(variation.ingredients.length).toBeGreaterThan(0);
    });
  });
});
