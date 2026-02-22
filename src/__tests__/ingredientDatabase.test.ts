/**
 * Ingredient Database Tests
 * Validates the comprehensive ingredient database structure and helper functions
 */

import {
  ingredientDatabase,
  getIngredientsByDietType,
  getIngredientsByCategory,
  getIngredientsWithoutAllergens,
  getIngredientsByPrepTime,
  getIngredientsByCuisine,
  getHighProteinIngredients,
  getLowCarbIngredients,
  getIngredientById,
  searchIngredientsByName,
} from '../data/ingredientDatabase';

describe('Ingredient Database', () => {
  describe('Database Structure', () => {
    it('should contain ingredients', () => {
      expect(ingredientDatabase).toBeDefined();
      expect(ingredientDatabase.length).toBeGreaterThan(0);
    });

    it('should have valid ingredient structure', () => {
      ingredientDatabase.forEach(ingredient => {
        expect(ingredient.id).toBeDefined();
        expect(ingredient.name).toBeDefined();
        expect(ingredient.category).toBeDefined();
        expect(ingredient.servingSize).toBeDefined();
        expect(ingredient.macros).toBeDefined();
        expect(ingredient.dietTypes).toBeDefined();
        expect(ingredient.allergens).toBeDefined();
        expect(ingredient.costLevel).toBeDefined();
        expect(ingredient.availability).toBeDefined();
        expect(typeof ingredient.cookingRequired).toBe('boolean');
      });
    });

    it('should have valid macro profiles', () => {
      ingredientDatabase.forEach(ingredient => {
        expect(ingredient.macros.calories).toBeGreaterThanOrEqual(0);
        expect(ingredient.macros.protein).toBeGreaterThanOrEqual(0);
        expect(ingredient.macros.carbohydrates).toBeGreaterThanOrEqual(0);
        expect(ingredient.macros.fiber).toBeGreaterThanOrEqual(0);
        expect(ingredient.macros.fats).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have unique IDs', () => {
      const ids = ingredientDatabase.map(i => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Diet Type Filtering', () => {
    it('should filter by standard diet', () => {
      const standard = getIngredientsByDietType('standard');
      expect(standard.length).toBeGreaterThan(0);
      standard.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('standard');
      });
    });

    it('should filter by vegetarian diet', () => {
      const vegetarian = getIngredientsByDietType('vegetarian');
      expect(vegetarian.length).toBeGreaterThan(0);
      vegetarian.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('vegetarian');
      });
    });

    it('should filter by vegan diet', () => {
      const vegan = getIngredientsByDietType('vegan');
      expect(vegan.length).toBeGreaterThan(0);
      vegan.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('vegan');
        // Vegan should not contain dairy or eggs
        expect(ingredient.allergens).not.toContain('dairy');
        expect(ingredient.allergens).not.toContain('eggs');
      });
    });

    it('should filter by keto diet', () => {
      const keto = getIngredientsByDietType('keto');
      expect(keto.length).toBeGreaterThan(0);
      keto.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('keto');
      });
    });

    it('should filter by paleo diet', () => {
      const paleo = getIngredientsByDietType('paleo');
      expect(paleo.length).toBeGreaterThan(0);
      paleo.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('paleo');
      });
    });

    it('should filter by mediterranean diet', () => {
      const mediterranean = getIngredientsByDietType('mediterranean');
      expect(mediterranean.length).toBeGreaterThan(0);
      mediterranean.forEach(ingredient => {
        expect(ingredient.dietTypes).toContain('mediterranean');
      });
    });
  });

  describe('Category Filtering', () => {
    it('should filter protein sources', () => {
      const proteins = getIngredientsByCategory('protein');
      expect(proteins.length).toBeGreaterThan(0);
      proteins.forEach(ingredient => {
        expect(ingredient.category).toBe('protein');
      });
    });

    it('should filter carbohydrate sources', () => {
      const carbs = getIngredientsByCategory('carbohydrate');
      carbs.forEach(ingredient => {
        expect(ingredient.category).toBe('carbohydrate');
      });
    });

    it('should filter vegetables', () => {
      const vegetables = getIngredientsByCategory('vegetable');
      expect(vegetables.length).toBeGreaterThan(0);
      vegetables.forEach(ingredient => {
        expect(ingredient.category).toBe('vegetable');
      });
    });

    it('should filter fruits', () => {
      const fruits = getIngredientsByCategory('fruit');
      expect(fruits.length).toBeGreaterThan(0);
      fruits.forEach(ingredient => {
        expect(ingredient.category).toBe('fruit');
      });
    });

    it('should filter fats', () => {
      const fats = getIngredientsByCategory('fat');
      expect(fats.length).toBeGreaterThan(0);
      fats.forEach(ingredient => {
        expect(ingredient.category).toBe('fat');
      });
    });

    it('should filter dairy', () => {
      const dairy = getIngredientsByCategory('dairy');
      expect(dairy.length).toBeGreaterThan(0);
      dairy.forEach(ingredient => {
        expect(ingredient.category).toBe('dairy');
      });
    });

    it('should filter grains', () => {
      const grains = getIngredientsByCategory('grain');
      expect(grains.length).toBeGreaterThan(0);
      grains.forEach(ingredient => {
        expect(ingredient.category).toBe('grain');
      });
    });

    it('should filter legumes', () => {
      const legumes = getIngredientsByCategory('legume');
      expect(legumes.length).toBeGreaterThan(0);
      legumes.forEach(ingredient => {
        expect(ingredient.category).toBe('legume');
      });
    });
  });

  describe('Allergen Filtering', () => {
    it('should exclude dairy allergens', () => {
      const noDairy = getIngredientsWithoutAllergens(['dairy']);
      noDairy.forEach(ingredient => {
        expect(ingredient.allergens).not.toContain('dairy');
      });
    });

    it('should exclude egg allergens', () => {
      const noEggs = getIngredientsWithoutAllergens(['eggs']);
      noEggs.forEach(ingredient => {
        expect(ingredient.allergens).not.toContain('eggs');
      });
    });

    it('should exclude multiple allergens', () => {
      const noMultiple = getIngredientsWithoutAllergens(['dairy', 'eggs', 'soy']);
      noMultiple.forEach(ingredient => {
        expect(ingredient.allergens).not.toContain('dairy');
        expect(ingredient.allergens).not.toContain('eggs');
        expect(ingredient.allergens).not.toContain('soy');
      });
    });

    it('should exclude fish allergens', () => {
      const noFish = getIngredientsWithoutAllergens(['fish']);
      noFish.forEach(ingredient => {
        expect(ingredient.allergens).not.toContain('fish');
      });
    });
  });

  describe('Prep Time Filtering', () => {
    it('should filter quick prep ingredients (<=15 min)', () => {
      const quick = getIngredientsByPrepTime(15);
      quick.forEach(ingredient => {
        if (ingredient.prepTime) {
          expect(ingredient.prepTime).toBeLessThanOrEqual(15);
        }
      });
    });

    it('should filter no-prep ingredients', () => {
      const noPrep = getIngredientsByPrepTime(0);
      noPrep.forEach(ingredient => {
        expect(ingredient.prepTime === undefined || ingredient.prepTime === 0).toBe(true);
      });
    });

    it('should filter moderate prep ingredients (<=30 min)', () => {
      const moderate = getIngredientsByPrepTime(30);
      moderate.forEach(ingredient => {
        if (ingredient.prepTime) {
          expect(ingredient.prepTime).toBeLessThanOrEqual(30);
        }
      });
    });
  });

  describe('Cuisine Filtering', () => {
    it('should filter by American cuisine', () => {
      const american = getIngredientsByCuisine('american');
      expect(american.length).toBeGreaterThan(0);
      american.forEach(ingredient => {
        expect(ingredient.cuisineTypes).toContain('american');
      });
    });

    it('should filter by Mediterranean cuisine', () => {
      const mediterranean = getIngredientsByCuisine('mediterranean');
      expect(mediterranean.length).toBeGreaterThan(0);
      mediterranean.forEach(ingredient => {
        expect(ingredient.cuisineTypes).toContain('mediterranean');
      });
    });

    it('should filter by Asian cuisine', () => {
      const asian = getIngredientsByCuisine('asian');
      expect(asian.length).toBeGreaterThan(0);
      asian.forEach(ingredient => {
        expect(ingredient.cuisineTypes).toContain('asian');
      });
    });
  });

  describe('Macro-Based Filtering', () => {
    it('should filter high-protein ingredients (>=15g)', () => {
      const highProtein = getHighProteinIngredients(15);
      expect(highProtein.length).toBeGreaterThan(0);
      highProtein.forEach(ingredient => {
        expect(ingredient.macros.protein).toBeGreaterThanOrEqual(15);
      });
    });

    it('should filter very high-protein ingredients (>=20g)', () => {
      const veryHighProtein = getHighProteinIngredients(20);
      expect(veryHighProtein.length).toBeGreaterThan(0);
      veryHighProtein.forEach(ingredient => {
        expect(ingredient.macros.protein).toBeGreaterThanOrEqual(20);
      });
    });

    it('should filter low-carb ingredients (<=10g)', () => {
      const lowCarb = getLowCarbIngredients(10);
      expect(lowCarb.length).toBeGreaterThan(0);
      lowCarb.forEach(ingredient => {
        expect(ingredient.macros.carbohydrates).toBeLessThanOrEqual(10);
      });
    });

    it('should filter very low-carb ingredients (<=5g)', () => {
      const veryLowCarb = getLowCarbIngredients(5);
      expect(veryLowCarb.length).toBeGreaterThan(0);
      veryLowCarb.forEach(ingredient => {
        expect(ingredient.macros.carbohydrates).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Search Functions', () => {
    it('should find ingredient by ID', () => {
      const chicken = getIngredientById('chicken-breast');
      expect(chicken).toBeDefined();
      expect(chicken?.id).toBe('chicken-breast');
      expect(chicken?.name).toContain('Chicken');
    });

    it('should return undefined for non-existent ID', () => {
      const notFound = getIngredientById('non-existent-ingredient');
      expect(notFound).toBeUndefined();
    });

    it('should search by name', () => {
      const chickenResults = searchIngredientsByName('chicken');
      expect(chickenResults.length).toBeGreaterThan(0);
      chickenResults.forEach(ingredient => {
        expect(
          ingredient.name.toLowerCase().includes('chicken') ||
          ingredient.tags?.some(tag => tag.toLowerCase().includes('chicken'))
        ).toBe(true);
      });
    });

    it('should search by tag', () => {
      const highProtein = searchIngredientsByName('high-protein');
      expect(highProtein.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const upper = searchIngredientsByName('CHICKEN');
      const lower = searchIngredientsByName('chicken');
      expect(upper.length).toBe(lower.length);
    });
  });

  describe('Database Coverage', () => {
    it('should have ingredients for all major diet types', () => {
      const dietTypes = ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'];
      dietTypes.forEach(diet => {
        const ingredients = getIngredientsByDietType(diet);
        expect(ingredients.length).toBeGreaterThan(5);
      });
    });

    it('should have ingredients across all major categories', () => {
      const categories = ['protein', 'vegetable', 'fruit', 'grain', 'fat', 'dairy', 'legume'];
      categories.forEach(category => {
        const ingredients = getIngredientsByCategory(category);
        expect(ingredients.length).toBeGreaterThan(0);
      });
    });

    it('should have budget-friendly options', () => {
      const budgetFriendly = ingredientDatabase.filter(i => i.costLevel === 'low');
      expect(budgetFriendly.length).toBeGreaterThan(10);
    });

    it('should have quick-prep options', () => {
      const quickPrep = getIngredientsByPrepTime(10);
      expect(quickPrep.length).toBeGreaterThan(10);
    });

    it('should have plant-based protein sources', () => {
      const plantProtein = ingredientDatabase.filter(
        i => i.category === 'protein' && i.dietTypes.includes('vegan')
      );
      expect(plantProtein.length).toBeGreaterThan(0);
    });

    it('should have keto-friendly options', () => {
      const keto = ingredientDatabase.filter(
        i => i.dietTypes.includes('keto') && i.macros.carbohydrates <= 10
      );
      expect(keto.length).toBeGreaterThan(10);
    });
  });

  describe('Nutritional Accuracy', () => {
    it('should have realistic calorie calculations', () => {
      ingredientDatabase.forEach(ingredient => {
        const { protein, carbohydrates, fats } = ingredient.macros;
        // Approximate calorie calculation: protein*4 + carbs*4 + fats*9
        const calculatedCalories = (protein * 4) + (carbohydrates * 4) + (fats * 9);
        const difference = Math.abs(ingredient.macros.calories - calculatedCalories);
        // Allow 25% variance for fiber, water content, alcohol, etc.
        // Very low-calorie foods (like vegetables) have higher water content
        const tolerance = ingredient.macros.calories < 30 ? 10 : ingredient.macros.calories * 0.25;
        expect(difference).toBeLessThan(tolerance);
      });
    });

    it('should have fiber less than or equal to carbohydrates', () => {
      ingredientDatabase.forEach(ingredient => {
        expect(ingredient.macros.fiber).toBeLessThanOrEqual(ingredient.macros.carbohydrates);
      });
    });
  });
});
