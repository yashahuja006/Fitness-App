/**
 * Diet Compliance Service Tests
 * Comprehensive tests for diet type validation and compliance checking
 */

import {
  validateIngredientCompliance,
  validateMealCompliance,
  validateMealPlanCompliance,
  isIngredientCompatible,
  getCompatibleIngredients,
  findDietCompliantSubstitutes,
  getDietTypeInfo,
  isDietMoreRestrictive,
  generateComplianceReport,
  type Meal,
  type MealPlan,
} from '../lib/dietComplianceService';
import { getIngredientById } from '../data/ingredientDatabase';
import { DietType } from '../types/ingredient';

describe('Diet Compliance Service', () => {
  describe('validateIngredientCompliance', () => {
    it('should validate chicken breast as non-compliant for vegetarian diet', () => {
      const result = validateIngredientCompliance('chicken-breast', 'vegetarian');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ingredientName).toBe('Chicken Breast (Skinless)');
      expect(result.violations[0].dietType).toBe('vegetarian');
    });

    it('should validate tofu as compliant for vegan diet', () => {
      const result = validateIngredientCompliance('tofu-firm', 'vegan');
      
      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should validate eggs as compliant for vegetarian but not vegan', () => {
      const vegetarianResult = validateIngredientCompliance('eggs-whole', 'vegetarian');
      const veganResult = validateIngredientCompliance('eggs-whole', 'vegan');
      
      expect(vegetarianResult.isCompliant).toBe(true);
      expect(veganResult.isCompliant).toBe(false);
    });

    it('should validate salmon as compliant for keto diet', () => {
      const result = validateIngredientCompliance('salmon', 'keto');
      
      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should warn about high-carb ingredients for keto diet', () => {
      const result = validateIngredientCompliance('banana', 'keto');
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('carbs');
    });

    it('should validate brown rice as non-compliant for paleo diet', () => {
      const result = validateIngredientCompliance('brown-rice', 'paleo');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations[0].reason).toContain('paleo');
    });

    it('should validate all ingredients as compliant for standard diet', () => {
      const ingredients = ['chicken-breast', 'tofu-firm', 'brown-rice', 'cheese-cheddar'];
      
      ingredients.forEach(ingredientId => {
        const result = validateIngredientCompliance(ingredientId, 'standard');
        expect(result.isCompliant).toBe(true);
      });
    });

    it('should return error for non-existent ingredient', () => {
      const result = validateIngredientCompliance('non-existent-ingredient', 'vegan');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations[0].reason).toContain('not found');
    });

    it('should validate dairy products as non-compliant for dairy-free diet', () => {
      const result = validateIngredientCompliance('greek-yogurt-plain', 'dairy_free');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations[0].dietType).toBe('dairy_free');
    });

    it('should validate legumes as non-compliant for paleo diet', () => {
      const result = validateIngredientCompliance('lentils-cooked', 'paleo');
      
      expect(result.isCompliant).toBe(false);
    });
  });

  describe('isIngredientCompatible', () => {
    it('should check compatibility correctly for vegetarian diet', () => {
      const chickenBreast = getIngredientById('chicken-breast')!;
      const tofu = getIngredientById('tofu-firm')!;
      const eggs = getIngredientById('eggs-whole')!;
      
      expect(isIngredientCompatible(chickenBreast, 'vegetarian')).toBe(false);
      expect(isIngredientCompatible(tofu, 'vegetarian')).toBe(true);
      expect(isIngredientCompatible(eggs, 'vegetarian')).toBe(true);
    });

    it('should check compatibility correctly for vegan diet', () => {
      const tofu = getIngredientById('tofu-firm')!;
      const eggs = getIngredientById('eggs-whole')!;
      const cheese = getIngredientById('cheese-cheddar')!;
      
      expect(isIngredientCompatible(tofu, 'vegan')).toBe(true);
      expect(isIngredientCompatible(eggs, 'vegan')).toBe(false);
      expect(isIngredientCompatible(cheese, 'vegan')).toBe(false);
    });

    it('should check compatibility correctly for paleo diet', () => {
      const chicken = getIngredientById('chicken-breast')!;
      const rice = getIngredientById('brown-rice')!;
      const sweetPotato = getIngredientById('sweet-potato')!;
      
      expect(isIngredientCompatible(chicken, 'paleo')).toBe(true);
      expect(isIngredientCompatible(rice, 'paleo')).toBe(false);
      expect(isIngredientCompatible(sweetPotato, 'paleo')).toBe(true);
    });

    it('should allow all ingredients for standard diet', () => {
      const chicken = getIngredientById('chicken-breast')!;
      const tofu = getIngredientById('tofu-firm')!;
      
      expect(isIngredientCompatible(chicken, 'standard')).toBe(true);
      expect(isIngredientCompatible(tofu, 'standard')).toBe(true);
    });
  });

  describe('validateMealCompliance', () => {
    it('should validate a vegetarian meal as compliant', () => {
      const meal: Meal = {
        id: 'meal-1',
        name: 'Vegetarian Breakfast',
        ingredients: [
          { ingredientId: 'eggs-whole', amount: 100 },
          { ingredientId: 'spinach', amount: 50 },
          { ingredientId: 'avocado', amount: 50 },
        ],
      };
      
      const result = validateMealCompliance(meal, 'vegetarian');
      
      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect non-compliant ingredients in a vegetarian meal', () => {
      const meal: Meal = {
        id: 'meal-2',
        name: 'Non-Vegetarian Meal',
        ingredients: [
          { ingredientId: 'chicken-breast', amount: 150 },
          { ingredientId: 'broccoli', amount: 100 },
        ],
      };
      
      const result = validateMealCompliance(meal, 'vegetarian');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].ingredientId).toBe('chicken-breast');
    });

    it('should validate a vegan meal as compliant', () => {
      const meal: Meal = {
        id: 'meal-3',
        name: 'Vegan Bowl',
        ingredients: [
          { ingredientId: 'tofu-firm', amount: 150 },
          { ingredientId: 'quinoa', amount: 100 },
          { ingredientId: 'broccoli', amount: 100 },
          { ingredientId: 'avocado', amount: 50 },
        ],
      };
      
      const result = validateMealCompliance(meal, 'vegan');
      
      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect dairy in a vegan meal', () => {
      const meal: Meal = {
        id: 'meal-4',
        name: 'Non-Vegan Meal',
        ingredients: [
          { ingredientId: 'tofu-firm', amount: 150 },
          { ingredientId: 'greek-yogurt-plain', amount: 100 },
        ],
      };
      
      const result = validateMealCompliance(meal, 'vegan');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.ingredientId === 'greek-yogurt-plain')).toBe(true);
    });

    it('should warn about high carbs in keto meal', () => {
      const meal: Meal = {
        id: 'meal-5',
        name: 'High Carb Meal',
        ingredients: [
          { ingredientId: 'chicken-breast', amount: 150 },
          { ingredientId: 'brown-rice', amount: 200 }, // High carbs
        ],
      };
      
      const result = validateMealCompliance(meal, 'keto');
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate a paleo meal correctly', () => {
      const meal: Meal = {
        id: 'meal-6',
        name: 'Paleo Meal',
        ingredients: [
          { ingredientId: 'salmon', amount: 150 },
          { ingredientId: 'sweet-potato', amount: 150 },
          { ingredientId: 'asparagus', amount: 100 },
        ],
      };
      
      const result = validateMealCompliance(meal, 'paleo');
      
      expect(result.isCompliant).toBe(true);
    });

    it('should detect grains in a paleo meal', () => {
      const meal: Meal = {
        id: 'meal-7',
        name: 'Non-Paleo Meal',
        ingredients: [
          { ingredientId: 'chicken-breast', amount: 150 },
          { ingredientId: 'quinoa', amount: 100 }, // Grain - not paleo
        ],
      };
      
      const result = validateMealCompliance(meal, 'paleo');
      
      expect(result.isCompliant).toBe(false);
    });
  });

  describe('validateMealPlanCompliance', () => {
    it('should validate a complete vegetarian meal plan', () => {
      const mealPlan: MealPlan = {
        dietType: 'vegetarian',
        meals: [
          {
            id: 'breakfast',
            name: 'Breakfast',
            ingredients: [
              { ingredientId: 'eggs-whole', amount: 100 },
              { ingredientId: 'oats', amount: 50 },
            ],
          },
          {
            id: 'lunch',
            name: 'Lunch',
            ingredients: [
              { ingredientId: 'tofu-firm', amount: 150 },
              { ingredientId: 'quinoa', amount: 100 },
              { ingredientId: 'broccoli', amount: 100 },
            ],
          },
        ],
      };
      
      const result = validateMealPlanCompliance(mealPlan);
      
      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect violations across multiple meals', () => {
      const mealPlan: MealPlan = {
        dietType: 'vegan',
        meals: [
          {
            id: 'breakfast',
            name: 'Breakfast',
            ingredients: [
              { ingredientId: 'eggs-whole', amount: 100 }, // Not vegan
            ],
          },
          {
            id: 'lunch',
            name: 'Lunch',
            ingredients: [
              { ingredientId: 'chicken-breast', amount: 150 }, // Not vegan
            ],
          },
        ],
      };
      
      const result = validateMealPlanCompliance(mealPlan);
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });

    it('should warn about total daily carbs for keto diet', () => {
      const mealPlan: MealPlan = {
        dietType: 'keto',
        meals: [
          {
            id: 'meal1',
            name: 'Meal 1',
            ingredients: [
              { ingredientId: 'chicken-breast', amount: 150 },
              { ingredientId: 'brown-rice', amount: 100 },
            ],
          },
          {
            id: 'meal2',
            name: 'Meal 2',
            ingredients: [
              { ingredientId: 'salmon', amount: 150 },
              { ingredientId: 'sweet-potato', amount: 150 },
            ],
          },
        ],
      };
      
      const result = validateMealPlanCompliance(mealPlan);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('daily carbs'))).toBe(true);
    });
  });

  describe('getCompatibleIngredients', () => {
    it('should return only vegetarian-compatible ingredients', () => {
      const ingredients = getCompatibleIngredients('vegetarian');
      
      expect(ingredients.length).toBeGreaterThan(0);
      ingredients.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('vegetarian');
      });
    });

    it('should return only vegan-compatible ingredients', () => {
      const ingredients = getCompatibleIngredients('vegan');
      
      expect(ingredients.length).toBeGreaterThan(0);
      ingredients.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('vegan');
      });
    });

    it('should return keto-compatible ingredients', () => {
      const ingredients = getCompatibleIngredients('keto');
      
      expect(ingredients.length).toBeGreaterThan(0);
      ingredients.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('keto');
      });
    });

    it('should return paleo-compatible ingredients', () => {
      const ingredients = getCompatibleIngredients('paleo');
      
      expect(ingredients.length).toBeGreaterThan(0);
      ingredients.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('paleo');
      });
    });
  });

  describe('findDietCompliantSubstitutes', () => {
    it('should find vegan substitutes for chicken breast', () => {
      const substitutes = findDietCompliantSubstitutes('chicken-breast', 'vegan');
      
      expect(substitutes.length).toBeGreaterThan(0);
      substitutes.forEach(substitute => {
        expect(substitute.dietTypes).toContain('vegan');
        expect(substitute.category).toBe('protein');
      });
    });

    it('should find vegetarian substitutes for beef', () => {
      const substitutes = findDietCompliantSubstitutes('ground-beef-lean', 'vegetarian');
      
      expect(substitutes.length).toBeGreaterThan(0);
      substitutes.forEach(substitute => {
        expect(substitute.dietTypes).toContain('vegetarian');
      });
    });

    it('should find paleo substitutes for rice', () => {
      const substitutes = findDietCompliantSubstitutes('brown-rice', 'paleo');
      
      // Brown rice is a grain, and paleo excludes all grains
      // So there won't be same-category substitutes, but the function should still work
      expect(Array.isArray(substitutes)).toBe(true);
      // If substitutes are found, they should be paleo-compatible
      substitutes.forEach(substitute => {
        expect(substitute.dietTypes).toContain('paleo');
      });
    });

    it('should return empty array for non-existent ingredient', () => {
      const substitutes = findDietCompliantSubstitutes('non-existent', 'vegan');
      
      expect(substitutes).toHaveLength(0);
    });

    it('should limit results to maxResults parameter', () => {
      const substitutes = findDietCompliantSubstitutes('chicken-breast', 'vegan', 3);
      
      expect(substitutes.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getDietTypeInfo', () => {
    it('should return correct info for vegetarian diet', () => {
      const info = getDietTypeInfo('vegetarian');
      
      expect(info.name).toBe('Vegetarian');
      expect(info.description).toContain('meat');
      expect(info.restrictions.length).toBeGreaterThan(0);
      expect(info.benefits.length).toBeGreaterThan(0);
    });

    it('should return correct info for vegan diet', () => {
      const info = getDietTypeInfo('vegan');
      
      expect(info.name).toBe('Vegan');
      expect(info.description).toContain('animal');
      expect(info.restrictions).toContain('No animal products');
    });

    it('should return correct info for keto diet', () => {
      const info = getDietTypeInfo('keto');
      
      expect(info.name).toBe('Ketogenic');
      expect(info.description).toContain('carb');
      expect(info.restrictions.some(r => r.includes('carb'))).toBe(true);
    });

    it('should return correct info for paleo diet', () => {
      const info = getDietTypeInfo('paleo');
      
      expect(info.name).toBe('Paleo');
      expect(info.restrictions).toContain('No grains');
      expect(info.restrictions).toContain('No legumes');
    });

    it('should return correct info for all diet types', () => {
      const dietTypes: DietType[] = [
        'standard', 'vegetarian', 'vegan', 'keto', 'paleo',
        'mediterranean', 'gluten_free', 'dairy_free'
      ];
      
      dietTypes.forEach(dietType => {
        const info = getDietTypeInfo(dietType);
        expect(info.name).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.restrictions).toBeDefined();
        expect(info.benefits).toBeDefined();
      });
    });
  });

  describe('isDietMoreRestrictive', () => {
    it('should recognize vegan as more restrictive than vegetarian', () => {
      expect(isDietMoreRestrictive('vegan', 'vegetarian')).toBe(true);
    });

    it('should recognize vegetarian as more restrictive than standard', () => {
      expect(isDietMoreRestrictive('vegetarian', 'standard')).toBe(true);
    });

    it('should recognize paleo as more restrictive than standard', () => {
      expect(isDietMoreRestrictive('paleo', 'standard')).toBe(true);
    });

    it('should recognize standard as less restrictive than all others', () => {
      const dietTypes: DietType[] = ['vegetarian', 'vegan', 'keto', 'paleo'];
      
      dietTypes.forEach(dietType => {
        expect(isDietMoreRestrictive('standard', dietType)).toBe(false);
      });
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a complete compliance report for compliant meal plan', () => {
      const mealPlan: MealPlan = {
        dietType: 'vegetarian',
        meals: [
          {
            id: 'meal-1',
            name: 'Breakfast',
            ingredients: [
              { ingredientId: 'eggs-whole', amount: 100 },
              { ingredientId: 'oats', amount: 50 },
            ],
          },
        ],
      };
      
      const report = generateComplianceReport(mealPlan);
      
      expect(report.summary).toContain('compliant');
      expect(report.complianceResult.isCompliant).toBe(true);
      expect(report.dietInfo).toBeDefined();
      expect(report.dietInfo.name).toBe('Vegetarian');
      expect(report.substitutionSuggestions).toHaveLength(0);
    });

    it('should generate substitution suggestions for non-compliant meal plan', () => {
      const mealPlan: MealPlan = {
        dietType: 'vegan',
        meals: [
          {
            id: 'meal-1',
            name: 'Breakfast',
            ingredients: [
              { ingredientId: 'chicken-breast', amount: 150 },
            ],
          },
        ],
      };
      
      const report = generateComplianceReport(mealPlan);
      
      expect(report.summary).toContain('violation');
      expect(report.complianceResult.isCompliant).toBe(false);
      expect(report.substitutionSuggestions.length).toBeGreaterThan(0);
      expect(report.substitutionSuggestions[0].substitutes.length).toBeGreaterThan(0);
    });

    it('should include diet info in the report', () => {
      const mealPlan: MealPlan = {
        dietType: 'keto',
        meals: [
          {
            id: 'meal-1',
            name: 'Lunch',
            ingredients: [
              { ingredientId: 'salmon', amount: 150 },
              { ingredientId: 'avocado', amount: 50 },
            ],
          },
        ],
      };
      
      const report = generateComplianceReport(mealPlan);
      
      expect(report.dietInfo.name).toBe('Ketogenic');
      expect(report.dietInfo.restrictions.length).toBeGreaterThan(0);
      expect(report.dietInfo.benefits.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty meal plan', () => {
      const mealPlan: MealPlan = {
        dietType: 'vegan',
        meals: [],
      };
      
      const result = validateMealPlanCompliance(mealPlan);
      
      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle meal with no ingredients', () => {
      const meal: Meal = {
        id: 'empty-meal',
        name: 'Empty Meal',
        ingredients: [],
      };
      
      const result = validateMealCompliance(meal, 'vegan');
      
      expect(result.isCompliant).toBe(true);
    });

    it('should handle multiple violations in single meal', () => {
      const meal: Meal = {
        id: 'multi-violation',
        name: 'Multiple Violations',
        ingredients: [
          { ingredientId: 'chicken-breast', amount: 150 },
          { ingredientId: 'eggs-whole', amount: 100 },
          { ingredientId: 'cheese-cheddar', amount: 50 },
        ],
      };
      
      const result = validateMealCompliance(meal, 'vegan');
      
      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBe(3);
    });
  });
});
