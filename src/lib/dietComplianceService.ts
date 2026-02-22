/**
 * Diet Type Compliance Service
 * Validates meal plans and ingredients against diet type restrictions
 * Ensures strict adherence to dietary preferences and restrictions
 */

import { Ingredient, DietType } from '../types/ingredient';
import { getIngredientsByDietType, getIngredientById } from '../data/ingredientDatabase';

/**
 * Validation result for diet compliance
 */
export interface DietComplianceResult {
  isCompliant: boolean;
  violations: DietViolation[];
  warnings: string[];
}

/**
 * Specific violation of diet restrictions
 */
export interface DietViolation {
  ingredientId: string;
  ingredientName: string;
  dietType: DietType;
  reason: string;
  severity: 'error' | 'warning';
}

/**
 * Meal plan structure for validation
 */
export interface MealPlan {
  meals: Meal[];
  dietType: DietType;
}

/**
 * Individual meal structure
 */
export interface Meal {
  id: string;
  name: string;
  ingredients: MealIngredient[];
}

/**
 * Ingredient within a meal
 */
export interface MealIngredient {
  ingredientId: string;
  amount: number; // grams
}

/**
 * Diet type restriction rules
 * Defines what is NOT allowed for each diet type
 */
const DIET_RESTRICTIONS: Record<DietType, {
  excludedCategories?: string[];
  excludedIngredients?: string[];
  requiredDietTypes?: DietType[];
  description: string;
}> = {
  standard: {
    description: 'No restrictions - all ingredients allowed',
  },
  vegetarian: {
    excludedCategories: ['protein'],
    excludedIngredients: [
      'chicken-breast', 'chicken-thigh', 'turkey-breast', 'salmon', 'tuna',
      'ground-beef-lean', 'bacon', 'any-meat', 'any-poultry', 'any-fish'
    ],
    requiredDietTypes: ['vegetarian', 'vegan'],
    description: 'No meat, poultry, or fish. Eggs and dairy allowed.',
  },
  vegan: {
    excludedCategories: ['dairy'],
    excludedIngredients: [
      'chicken-breast', 'chicken-thigh', 'turkey-breast', 'salmon', 'tuna',
      'ground-beef-lean', 'eggs-whole', 'egg-whites', 'greek-yogurt-plain',
      'cottage-cheese', 'cheese-cheddar', 'feta-cheese', 'bacon'
    ],
    requiredDietTypes: ['vegan'],
    description: 'No animal products including meat, dairy, eggs, or honey.',
  },
  keto: {
    description: 'Very low carb (<50g/day), high fat, moderate protein.',
  },
  paleo: {
    excludedCategories: ['grain', 'legume', 'dairy'],
    excludedIngredients: [
      'brown-rice', 'quinoa', 'oats', 'lentils-cooked', 'chickpeas',
      'black-beans', 'greek-yogurt-plain', 'cottage-cheese', 'cheese-cheddar',
      'feta-cheese', 'peanut-butter', 'hummus'
    ],
    requiredDietTypes: ['paleo'],
    description: 'No grains, legumes, dairy, or processed foods.',
  },
  mediterranean: {
    requiredDietTypes: ['mediterranean'],
    description: 'Emphasis on fish, olive oil, vegetables, whole grains, and moderate dairy.',
  },
  gluten_free: {
    excludedIngredients: ['oats', 'wheat', 'barley', 'rye'],
    requiredDietTypes: ['gluten_free'],
    description: 'No gluten-containing grains.',
  },
  dairy_free: {
    excludedCategories: ['dairy'],
    excludedIngredients: [
      'greek-yogurt-plain', 'cottage-cheese', 'cheese-cheddar', 'feta-cheese'
    ],
    requiredDietTypes: ['dairy_free'],
    description: 'No dairy products.',
  },
};

/**
 * Validate a single ingredient against a diet type
 */
export function validateIngredientCompliance(
  ingredientId: string,
  dietType: DietType
): DietComplianceResult {
  const ingredient = getIngredientById(ingredientId);
  
  if (!ingredient) {
    return {
      isCompliant: false,
      violations: [{
        ingredientId,
        ingredientName: 'Unknown',
        dietType,
        reason: `Ingredient with ID "${ingredientId}" not found in database`,
        severity: 'error',
      }],
      warnings: [],
    };
  }

  const violations: DietViolation[] = [];
  const warnings: string[] = [];

  // Check if ingredient is compatible with diet type
  if (!isIngredientCompatible(ingredient, dietType)) {
    const restriction = DIET_RESTRICTIONS[dietType];
    violations.push({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      dietType,
      reason: `${ingredient.name} is not compatible with ${dietType} diet. ${restriction.description}`,
      severity: 'error',
    });
  }

  // Additional checks for specific diet types
  if (dietType === 'keto') {
    const carbsPerServing = ingredient.macros.carbohydrates;
    if (carbsPerServing > 15) {
      warnings.push(
        `${ingredient.name} contains ${carbsPerServing}g carbs per serving, which may be high for keto diet`
      );
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Check if an ingredient is compatible with a diet type
 */
export function isIngredientCompatible(
  ingredient: Ingredient,
  dietType: DietType
): boolean {
  // Standard diet allows everything
  if (dietType === 'standard') {
    return true;
  }

  const restriction = DIET_RESTRICTIONS[dietType];

  // Check if ingredient's diet types include the required diet type
  if (restriction.requiredDietTypes) {
    const hasRequiredDietType = restriction.requiredDietTypes.some(
      requiredType => ingredient.dietTypes.includes(requiredType)
    );
    if (!hasRequiredDietType) {
      return false;
    }
  }

  // Check excluded categories
  if (restriction.excludedCategories) {
    if (restriction.excludedCategories.includes(ingredient.category)) {
      // Special case: vegetarian allows eggs and dairy from protein category
      if (dietType === 'vegetarian' && ingredient.category === 'protein') {
        return ingredient.dietTypes.includes('vegetarian');
      }
      return false;
    }
  }

  // Check excluded ingredients
  if (restriction.excludedIngredients) {
    if (restriction.excludedIngredients.includes(ingredient.id)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate a complete meal against diet restrictions
 */
export function validateMealCompliance(
  meal: Meal,
  dietType: DietType
): DietComplianceResult {
  const violations: DietViolation[] = [];
  const warnings: string[] = [];

  // Validate each ingredient in the meal
  for (const mealIngredient of meal.ingredients) {
    const result = validateIngredientCompliance(mealIngredient.ingredientId, dietType);
    violations.push(...result.violations);
    warnings.push(...result.warnings);
  }

  // Additional meal-level checks
  if (dietType === 'keto') {
    const totalCarbs = calculateMealCarbs(meal);
    if (totalCarbs > 20) {
      warnings.push(
        `Meal "${meal.name}" contains ${totalCarbs.toFixed(1)}g total carbs, which may be high for a single keto meal`
      );
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Validate a complete meal plan against diet restrictions
 */
export function validateMealPlanCompliance(
  mealPlan: MealPlan
): DietComplianceResult {
  const violations: DietViolation[] = [];
  const warnings: string[] = [];

  // Validate each meal in the plan
  for (const meal of mealPlan.meals) {
    const result = validateMealCompliance(meal, mealPlan.dietType);
    violations.push(...result.violations);
    warnings.push(...result.warnings);
  }

  // Additional plan-level checks
  if (mealPlan.dietType === 'keto') {
    const totalDailyCarbs = calculateDailyCarbs(mealPlan);
    if (totalDailyCarbs > 50) {
      warnings.push(
        `Total daily carbs (${totalDailyCarbs.toFixed(1)}g) exceeds typical keto limit of 50g`
      );
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Get all compatible ingredients for a diet type
 */
export function getCompatibleIngredients(dietType: DietType): Ingredient[] {
  return getIngredientsByDietType(dietType);
}

/**
 * Find suitable substitutes for a non-compliant ingredient
 */
export function findDietCompliantSubstitutes(
  ingredientId: string,
  dietType: DietType,
  maxResults: number = 5
): Ingredient[] {
  const originalIngredient = getIngredientById(ingredientId);
  
  if (!originalIngredient) {
    return [];
  }

  // Get all compatible ingredients for the diet type
  const compatibleIngredients = getCompatibleIngredients(dietType);

  // Filter by same category
  const sameCategoryIngredients = compatibleIngredients.filter(
    ing => ing.category === originalIngredient.category
  );

  // Sort by macro similarity
  const sortedSubstitutes = sameCategoryIngredients
    .map(ingredient => ({
      ingredient,
      similarity: calculateMacroSimilarity(originalIngredient, ingredient),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
    .map(item => item.ingredient);

  return sortedSubstitutes;
}

/**
 * Calculate macro similarity between two ingredients (0-1 score)
 */
function calculateMacroSimilarity(ing1: Ingredient, ing2: Ingredient): number {
  const proteinDiff = Math.abs(ing1.macros.protein - ing2.macros.protein);
  const carbsDiff = Math.abs(ing1.macros.carbohydrates - ing2.macros.carbohydrates);
  const fatsDiff = Math.abs(ing1.macros.fats - ing2.macros.fats);
  const caloriesDiff = Math.abs(ing1.macros.calories - ing2.macros.calories);

  // Normalize differences (assuming max reasonable differences)
  const normalizedProteinDiff = proteinDiff / 50;
  const normalizedCarbsDiff = carbsDiff / 100;
  const normalizedFatsDiff = fatsDiff / 50;
  const normalizedCaloriesDiff = caloriesDiff / 500;

  // Calculate average difference
  const avgDiff = (normalizedProteinDiff + normalizedCarbsDiff + normalizedFatsDiff + normalizedCaloriesDiff) / 4;

  // Convert to similarity score (1 - difference)
  return Math.max(0, 1 - avgDiff);
}

/**
 * Calculate total carbs in a meal
 */
function calculateMealCarbs(meal: Meal): number {
  let totalCarbs = 0;

  for (const mealIngredient of meal.ingredients) {
    const ingredient = getIngredientById(mealIngredient.ingredientId);
    if (ingredient) {
      // Calculate carbs based on amount (ingredient macros are per 100g)
      const carbsPerGram = ingredient.macros.carbohydrates / 100;
      totalCarbs += carbsPerGram * mealIngredient.amount;
    }
  }

  return totalCarbs;
}

/**
 * Calculate total daily carbs in a meal plan
 */
function calculateDailyCarbs(mealPlan: MealPlan): number {
  let totalCarbs = 0;

  for (const meal of mealPlan.meals) {
    totalCarbs += calculateMealCarbs(meal);
  }

  return totalCarbs;
}

/**
 * Get detailed diet type information
 */
export function getDietTypeInfo(dietType: DietType): {
  name: string;
  description: string;
  restrictions: string[];
  benefits: string[];
} {
  const restriction = DIET_RESTRICTIONS[dietType];

  const dietInfo: Record<DietType, {
    name: string;
    restrictions: string[];
    benefits: string[];
  }> = {
    standard: {
      name: 'Standard',
      restrictions: ['No restrictions'],
      benefits: ['Maximum flexibility', 'Easy to follow', 'Wide food variety'],
    },
    vegetarian: {
      name: 'Vegetarian',
      restrictions: ['No meat', 'No poultry', 'No fish'],
      benefits: ['Lower environmental impact', 'Heart health', 'Rich in fiber'],
    },
    vegan: {
      name: 'Vegan',
      restrictions: ['No animal products', 'No meat', 'No dairy', 'No eggs'],
      benefits: ['Lowest environmental impact', 'High in antioxidants', 'Plant-based nutrition'],
    },
    keto: {
      name: 'Ketogenic',
      restrictions: ['Very low carb (<50g/day)', 'High fat', 'Moderate protein'],
      benefits: ['Fat loss', 'Mental clarity', 'Blood sugar control'],
    },
    paleo: {
      name: 'Paleo',
      restrictions: ['No grains', 'No legumes', 'No dairy', 'No processed foods'],
      benefits: ['Whole foods focus', 'Anti-inflammatory', 'Nutrient-dense'],
    },
    mediterranean: {
      name: 'Mediterranean',
      restrictions: ['Limited red meat', 'Emphasis on fish and olive oil'],
      benefits: ['Heart health', 'Longevity', 'Balanced nutrition'],
    },
    gluten_free: {
      name: 'Gluten-Free',
      restrictions: ['No wheat', 'No barley', 'No rye', 'No gluten'],
      benefits: ['Celiac-safe', 'Reduced inflammation', 'Digestive health'],
    },
    dairy_free: {
      name: 'Dairy-Free',
      restrictions: ['No milk', 'No cheese', 'No yogurt', 'No dairy products'],
      benefits: ['Lactose intolerance safe', 'Reduced inflammation', 'Clearer skin'],
    },
  };

  const info = dietInfo[dietType];

  return {
    name: info.name,
    description: restriction.description,
    restrictions: info.restrictions,
    benefits: info.benefits,
  };
}

/**
 * Check if a diet type is more restrictive than another
 */
export function isDietMoreRestrictive(dietType1: DietType, dietType2: DietType): boolean {
  const restrictiveness: Record<DietType, number> = {
    standard: 0,
    gluten_free: 1,
    dairy_free: 1,
    mediterranean: 2,
    vegetarian: 3,
    keto: 4,
    paleo: 4,
    vegan: 5,
  };

  return restrictiveness[dietType1] > restrictiveness[dietType2];
}

/**
 * Validate and provide detailed compliance report
 */
export function generateComplianceReport(
  mealPlan: MealPlan
): {
  summary: string;
  complianceResult: DietComplianceResult;
  dietInfo: ReturnType<typeof getDietTypeInfo>;
  substitutionSuggestions: Array<{
    originalIngredient: string;
    substitutes: Ingredient[];
  }>;
} {
  const complianceResult = validateMealPlanCompliance(mealPlan);
  const dietInfo = getDietTypeInfo(mealPlan.dietType);

  // Generate substitution suggestions for violations
  const substitutionSuggestions = complianceResult.violations.map(violation => ({
    originalIngredient: violation.ingredientName,
    substitutes: findDietCompliantSubstitutes(violation.ingredientId, mealPlan.dietType),
  }));

  const summary = complianceResult.isCompliant
    ? `✓ Meal plan is fully compliant with ${dietInfo.name} diet`
    : `✗ Meal plan has ${complianceResult.violations.length} violation(s) for ${dietInfo.name} diet`;

  return {
    summary,
    complianceResult,
    dietInfo,
    substitutionSuggestions,
  };
}
