/**
 * Meal Variation Algorithms
 * 
 * Generates meal variations based on subscription tier:
 * - Free tier: Simple 3-day meal rotation with basic variety
 * - Pro tier: Advanced 7+ day rotation with ingredient substitutions and seasonal variations
 * 
 * Maintains macro targets while providing appropriate variety based on tier
 */

import { Ingredient, DietType, CuisineType } from '../types/ingredient';
import { 
  getIngredientsByDietType, 
  getIngredientsByCategory,
  getIngredientById 
} from '../data/ingredientDatabase';
import { MacroDistribution } from './macroIntelligenceSystem';
import { 
  MealFilteringService, 
  CookingTimePreference,
  MealFilterConfig 
} from './mealFilteringService';

export type SubscriptionTier = 'free' | 'pro';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/**
 * Meal variation configuration
 */
export interface MealVariationConfig {
  tier: SubscriptionTier;
  dietType: DietType;
  targetMacros: MacroDistribution;
  mealType: MealType;
  dayNumber: number; // 1-7 for Pro, 1-3 for Free
  season?: Season;
  excludeIngredients?: string[]; // Ingredient IDs to exclude
  preferredCuisines?: CuisineType[];
  cookingTimePreference?: CookingTimePreference;
}

/**
 * Generated meal variation
 */
export interface MealVariation {
  id: string;
  name: string;
  mealType: MealType;
  dayNumber: number;
  ingredients: MealIngredient[];
  macros: MacroDistribution;
  preparation: string;
  cookingTime: number;
  tags: string[];
  variationLevel: 'basic' | 'moderate' | 'advanced';
}

/**
 * Ingredient within a meal with amount
 */
export interface MealIngredient {
  ingredientId: string;
  ingredientName: string;
  amount: number; // grams
  macros: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
  };
}

/**
 * Meal variation strategy result
 */
export interface MealVariationStrategy {
  rotationDays: number;
  varietyLevel: 'low' | 'medium' | 'high';
  substitutionOptions: boolean;
  seasonalVariations: boolean;
  description: string;
}

/**
 * Main Meal Variation Service
 */
export class MealVariationService {
  /**
   * Get meal variation strategy based on subscription tier
   */
  static getVariationStrategy(tier: SubscriptionTier): MealVariationStrategy {
    if (tier === 'free') {
      return {
        rotationDays: 3,
        varietyLevel: 'low',
        substitutionOptions: false,
        seasonalVariations: false,
        description: 'Simple 3-day meal rotation with basic variety. Upgrade to Pro for more variety and customization.'
      };
    }

    return {
      rotationDays: 7,
      varietyLevel: 'high',
      substitutionOptions: true,
      seasonalVariations: true,
      description: 'Advanced 7-day meal rotation with ingredient substitutions and seasonal variations.'
    };
  }

  /**
   * Generate meal variation based on configuration
   */
  static generateMealVariation(config: MealVariationConfig): MealVariation {
    const strategy = this.getVariationStrategy(config.tier);

    // Normalize day number to rotation cycle
    const normalizedDay = ((config.dayNumber - 1) % strategy.rotationDays) + 1;

    // Get compatible ingredients for diet type with filtering
    const compatibleIngredients = this.getCompatibleIngredients(
      config.dietType,
      config.excludeIngredients || [],
      config.cookingTimePreference,
      config.cuisinePreferences
    );

    // Select ingredients based on meal type and macros
    const selectedIngredients = this.selectIngredientsForMeal(
      compatibleIngredients,
      config.targetMacros,
      config.mealType,
      normalizedDay,
      config.tier
    );

    // Calculate actual macros from selected ingredients
    const actualMacros = this.calculateMealMacros(selectedIngredients);

    // Generate meal name
    const mealName = this.generateMealName(selectedIngredients, config.mealType);

    // Generate preparation instructions
    const preparation = this.generatePreparation(selectedIngredients, config.mealType);

    // Calculate cooking time
    const cookingTime = this.calculateCookingTime(selectedIngredients);

    // Generate tags
    const tags = this.generateMealTags(selectedIngredients, config);

    return {
      id: `meal-${config.mealType}-day${normalizedDay}-${Date.now()}`,
      name: mealName,
      mealType: config.mealType,
      dayNumber: normalizedDay,
      ingredients: selectedIngredients,
      macros: actualMacros,
      preparation,
      cookingTime,
      tags,
      variationLevel: config.tier === 'pro' ? 'advanced' : 'basic'
    };
  }

  /**
   * Generate multiple meal variations for a rotation cycle
   */
  static generateMealRotation(
    tier: SubscriptionTier,
    dietType: DietType,
    targetMacros: MacroDistribution,
    mealType: MealType,
    season?: Season
  ): MealVariation[] {
    const strategy = this.getVariationStrategy(tier);
    const variations: MealVariation[] = [];

    for (let day = 1; day <= strategy.rotationDays; day++) {
      const config: MealVariationConfig = {
        tier,
        dietType,
        targetMacros,
        mealType,
        dayNumber: day,
        season
      };

      variations.push(this.generateMealVariation(config));
    }

    return variations;
  }

  /**
   * Get compatible ingredients for diet type with optional filtering
   */
  private static getCompatibleIngredients(
    dietType: DietType,
    excludeIngredients: string[],
    cookingTimePreference?: CookingTimePreference,
    cuisinePreferences?: CuisineType[]
  ): Ingredient[] {
    // Apply meal filtering service
    const filterConfig: MealFilterConfig = {
      dietType,
      excludeIngredients,
      cookingTimePreference,
      cuisinePreferences
    };

    return MealFilteringService.getFilteredIngredientsForMealPlanning(filterConfig);
  }

  /**
   * Select ingredients for a meal based on macros and meal type
   */
  private static selectIngredientsForMeal(
    availableIngredients: Ingredient[],
    targetMacros: MacroDistribution,
    mealType: MealType,
    dayNumber: number,
    tier: SubscriptionTier
  ): MealIngredient[] {
    const mealIngredients: MealIngredient[] = [];

    // Define meal structure based on meal type
    const structure = this.getMealStructure(mealType);

    // Select protein source
    const proteinSource = this.selectIngredient(
      availableIngredients,
      'protein',
      dayNumber,
      tier
    );
    if (proteinSource) {
      const proteinAmount = this.calculateIngredientAmount(
        proteinSource,
        targetMacros.protein,
        'protein'
      );
      mealIngredients.push(this.createMealIngredient(proteinSource, proteinAmount));
    }

    // Select carb source (skip for very low carb diets)
    if (targetMacros.carbohydrates > 20) {
      const carbSource = this.selectIngredient(
        availableIngredients,
        structure.carbCategory,
        dayNumber,
        tier
      );
      if (carbSource) {
        const carbAmount = this.calculateIngredientAmount(
          carbSource,
          targetMacros.carbohydrates,
          'carbohydrates'
        );
        mealIngredients.push(this.createMealIngredient(carbSource, carbAmount));
      }
    }

    // Select vegetable (smaller portion for low-carb diets)
    const vegetable = this.selectIngredient(
      availableIngredients,
      'vegetable',
      dayNumber,
      tier
    );
    if (vegetable) {
      // Use smaller portion for low-carb diets
      const vegetableAmount = targetMacros.carbohydrates < 30 ? 100 : 150;
      mealIngredients.push(this.createMealIngredient(vegetable, vegetableAmount));
    }

    // Select fat source if needed
    const currentFats = this.calculateTotalMacro(mealIngredients, 'fats');
    if (currentFats < targetMacros.fats * 0.8) {
      const fatSource = this.selectIngredient(
        availableIngredients,
        'fat',
        dayNumber,
        tier
      );
      if (fatSource) {
        const fatAmount = this.calculateIngredientAmount(
          fatSource,
          targetMacros.fats - currentFats,
          'fats'
        );
        mealIngredients.push(this.createMealIngredient(fatSource, fatAmount));
      }
    }

    return mealIngredients;
  }

  /**
   * Get meal structure based on meal type
   */
  private static getMealStructure(mealType: MealType): {
    carbCategory: string;
    includesFruit: boolean;
  } {
    switch (mealType) {
      case 'breakfast':
        return { carbCategory: 'grain', includesFruit: true };
      case 'lunch':
      case 'dinner':
        return { carbCategory: 'carbohydrate', includesFruit: false };
      case 'snack':
        return { carbCategory: 'fruit', includesFruit: true };
      default:
        return { carbCategory: 'grain', includesFruit: false };
    }
  }

  /**
   * Select an ingredient from a category with variation based on day and tier
   */
  private static selectIngredient(
    availableIngredients: Ingredient[],
    category: string,
    dayNumber: number,
    tier: SubscriptionTier
  ): Ingredient | null {
    const categoryIngredients = availableIngredients.filter(
      ing => ing.category === category
    );

    if (categoryIngredients.length === 0) {
      return null;
    }

    // For free tier, use simple rotation
    if (tier === 'free') {
      const index = (dayNumber - 1) % Math.min(categoryIngredients.length, 3);
      return categoryIngredients[index];
    }

    // For pro tier, use more variety
    const index = (dayNumber - 1) % categoryIngredients.length;
    return categoryIngredients[index];
  }

  /**
   * Calculate ingredient amount to meet macro target
   */
  private static calculateIngredientAmount(
    ingredient: Ingredient,
    targetAmount: number,
    macroType: 'protein' | 'carbohydrates' | 'fats'
  ): number {
    const macroPerGram = ingredient.macros[macroType] / 100;
    const amount = targetAmount / macroPerGram;
    
    // Round to reasonable serving sizes
    return Math.round(amount / 10) * 10;
  }

  /**
   * Create meal ingredient with calculated macros
   */
  private static createMealIngredient(
    ingredient: Ingredient,
    amount: number
  ): MealIngredient {
    const multiplier = amount / 100;

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount,
      macros: {
        calories: Math.round(ingredient.macros.calories * multiplier),
        protein: Math.round(ingredient.macros.protein * multiplier),
        carbohydrates: Math.round(ingredient.macros.carbohydrates * multiplier),
        fats: Math.round(ingredient.macros.fats * multiplier)
      }
    };
  }

  /**
   * Calculate total macros for a meal
   */
  private static calculateMealMacros(ingredients: MealIngredient[]): MacroDistribution {
    const totals = ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.macros.calories,
        protein: acc.protein + ing.macros.protein,
        carbohydrates: acc.carbohydrates + ing.macros.carbohydrates,
        fats: acc.fats + ing.macros.fats
      }),
      { calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
    );

    return {
      ...totals,
      fiber: Math.round(totals.calories / 1000 * 14) // Estimate fiber
    };
  }

  /**
   * Calculate total of a specific macro
   */
  private static calculateTotalMacro(
    ingredients: MealIngredient[],
    macroType: 'protein' | 'carbohydrates' | 'fats'
  ): number {
    return ingredients.reduce((sum, ing) => sum + ing.macros[macroType], 0);
  }

  /**
   * Generate meal name based on ingredients
   */
  private static generateMealName(
    ingredients: MealIngredient[],
    mealType: MealType
  ): string {
    if (ingredients.length === 0) {
      return `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
    }

    // Get primary protein
    const protein = ingredients[0];
    const proteinName = protein.ingredientName.split('(')[0].trim();

    // Get carb source if exists
    const carb = ingredients.find(ing => 
      ing.ingredientName.toLowerCase().includes('rice') ||
      ing.ingredientName.toLowerCase().includes('potato') ||
      ing.ingredientName.toLowerCase().includes('quinoa')
    );

    if (carb) {
      const carbName = carb.ingredientName.split('(')[0].trim();
      return `${proteinName} with ${carbName}`;
    }

    return `${proteinName} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
  }

  /**
   * Generate preparation instructions
   */
  private static generatePreparation(
    ingredients: MealIngredient[],
    mealType: MealType
  ): string {
    const steps: string[] = [];

    // Add basic preparation steps
    steps.push(`Prepare all ingredients: ${ingredients.map(i => i.ingredientName).join(', ')}.`);

    // Add cooking instructions based on ingredients
    const needsCooking = ingredients.some(ing => {
      const ingredient = getIngredientById(ing.ingredientId);
      return ingredient?.cookingRequired;
    });

    if (needsCooking) {
      steps.push('Cook protein and carb sources according to preference (grilled, baked, or pan-fried).');
      steps.push('Steam or sauté vegetables until tender.');
    }

    steps.push('Combine all ingredients on a plate and serve.');

    return steps.join(' ');
  }

  /**
   * Calculate total cooking time
   */
  private static calculateCookingTime(ingredients: MealIngredient[]): number {
    let maxTime = 0;

    for (const ing of ingredients) {
      const ingredient = getIngredientById(ing.ingredientId);
      if (ingredient?.prepTime) {
        maxTime = Math.max(maxTime, ingredient.prepTime);
      }
    }

    return maxTime || 15; // Default to 15 minutes
  }

  /**
   * Generate meal tags
   */
  private static generateMealTags(
    ingredients: MealIngredient[],
    config: MealVariationConfig
  ): string[] {
    const tags: string[] = [];

    // Add tier tag
    tags.push(config.tier === 'pro' ? 'pro-variety' : 'basic-rotation');

    // Add diet type
    tags.push(config.dietType);

    // Add meal type
    tags.push(config.mealType);

    // Add cooking time category
    const cookingTime = this.calculateCookingTime(ingredients);
    if (cookingTime <= 15) {
      tags.push('quick');
    } else if (cookingTime <= 30) {
      tags.push('moderate-prep');
    } else {
      tags.push('elaborate');
    }

    // Add macro focus
    if (config.targetMacros.protein > 30) {
      tags.push('high-protein');
    }
    if (config.targetMacros.carbohydrates < 20) {
      tags.push('low-carb');
    }

    return tags;
  }

  /**
   * Find ingredient substitutions (Pro feature)
   */
  static findIngredientSubstitutions(
    ingredientId: string,
    dietType: DietType,
    maxResults: number = 3
  ): Ingredient[] {
    const originalIngredient = getIngredientById(ingredientId);
    
    if (!originalIngredient) {
      return [];
    }

    // Get all compatible ingredients for the diet type
    const compatibleIngredients = getIngredientsByDietType(dietType);

    // Filter by same category
    const sameCategoryIngredients = compatibleIngredients.filter(
      ing => ing.category === originalIngredient.category && ing.id !== ingredientId
    );

    // Sort by macro similarity
    const sortedSubstitutes = sameCategoryIngredients
      .map(ingredient => ({
        ingredient,
        similarity: this.calculateMacroSimilarity(originalIngredient, ingredient)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults)
      .map(item => item.ingredient);

    return sortedSubstitutes;
  }

  /**
   * Calculate macro similarity between two ingredients (0-1 score)
   */
  private static calculateMacroSimilarity(ing1: Ingredient, ing2: Ingredient): number {
    const proteinDiff = Math.abs(ing1.macros.protein - ing2.macros.protein);
    const carbsDiff = Math.abs(ing1.macros.carbohydrates - ing2.macros.carbohydrates);
    const fatsDiff = Math.abs(ing1.macros.fats - ing2.macros.fats);
    const caloriesDiff = Math.abs(ing1.macros.calories - ing2.macros.calories);

    // Normalize differences
    const normalizedProteinDiff = proteinDiff / 50;
    const normalizedCarbsDiff = carbsDiff / 100;
    const normalizedFatsDiff = fatsDiff / 50;
    const normalizedCaloriesDiff = caloriesDiff / 500;

    // Calculate average difference
    const avgDiff = (normalizedProteinDiff + normalizedCarbsDiff + normalizedFatsDiff + normalizedCaloriesDiff) / 4;

    // Convert to similarity score
    return Math.max(0, 1 - avgDiff);
  }

  /**
   * Get seasonal ingredient recommendations (Pro feature)
   */
  static getSeasonalIngredients(season: Season, dietType: DietType): Ingredient[] {
    // This is a simplified implementation
    // In production, you'd have a more comprehensive seasonal mapping
    const seasonalCategories: Record<Season, string[]> = {
      spring: ['vegetable', 'fruit'],
      summer: ['fruit', 'vegetable'],
      fall: ['carbohydrate', 'vegetable'],
      winter: ['protein', 'carbohydrate']
    };

    const categories = seasonalCategories[season];
    const compatibleIngredients = getIngredientsByDietType(dietType);

    return compatibleIngredients.filter(ing => 
      categories.includes(ing.category)
    );
  }

  /**
   * Generate upgrade prompt for free users
   */
  static generateUpgradePrompt(currentDay: number): string {
    if (currentDay <= 3) {
      return '';
    }

    return `🌟 Upgrade to Pro for more variety! You're seeing repeated meals from your 3-day rotation. Pro members get 7+ days of unique meals with ingredient substitutions and seasonal variations.`;
  }

  /**
   * Validate meal variation meets macro targets
   */
  static validateMealVariation(
    meal: MealVariation,
    targetMacros: MacroDistribution,
    tolerance: number = 0.15 // 15% tolerance
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check protein
    const proteinDiff = Math.abs(meal.macros.protein - targetMacros.protein) / targetMacros.protein;
    if (proteinDiff > tolerance) {
      errors.push(`Protein is ${proteinDiff > 0 ? 'over' : 'under'} target by ${Math.round(proteinDiff * 100)}%`);
    }

    // Check carbs
    const carbsDiff = Math.abs(meal.macros.carbohydrates - targetMacros.carbohydrates) / targetMacros.carbohydrates;
    if (carbsDiff > tolerance) {
      errors.push(`Carbs are ${carbsDiff > 0 ? 'over' : 'under'} target by ${Math.round(carbsDiff * 100)}%`);
    }

    // Check fats
    const fatsDiff = Math.abs(meal.macros.fats - targetMacros.fats) / targetMacros.fats;
    if (fatsDiff > tolerance) {
      errors.push(`Fats are ${fatsDiff > 0 ? 'over' : 'under'} target by ${Math.round(fatsDiff * 100)}%`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Convenience function to generate meal variation
 */
export function generateMealVariation(config: MealVariationConfig): MealVariation {
  return MealVariationService.generateMealVariation(config);
}

/**
 * Convenience function to generate meal rotation
 */
export function generateMealRotation(
  tier: SubscriptionTier,
  dietType: DietType,
  targetMacros: MacroDistribution,
  mealType: MealType,
  season?: Season
): MealVariation[] {
  return MealVariationService.generateMealRotation(tier, dietType, targetMacros, mealType, season);
}

/**
 * Convenience function to get variation strategy
 */
export function getVariationStrategy(tier: SubscriptionTier): MealVariationStrategy {
  return MealVariationService.getVariationStrategy(tier);
}

/**
 * Convenience function to find substitutions
 */
export function findIngredientSubstitutions(
  ingredientId: string,
  dietType: DietType,
  maxResults?: number
): Ingredient[] {
  return MealVariationService.findIngredientSubstitutions(ingredientId, dietType, maxResults);
}
