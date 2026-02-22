/**
 * Ingredient Database Types
 * Comprehensive type definitions for ingredient database with macro profiles
 */

/**
 * Ingredient category for classification
 */
export type IngredientCategory =
  | 'protein'
  | 'carbohydrate'
  | 'vegetable'
  | 'fruit'
  | 'fat'
  | 'dairy'
  | 'grain'
  | 'legume'
  | 'nut_seed'
  | 'beverage'
  | 'condiment'
  | 'spice';

/**
 * Diet type compatibility
 */
export type DietType =
  | 'standard'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'gluten_free'
  | 'dairy_free';

/**
 * Common allergens
 */
export type Allergen =
  | 'dairy'
  | 'eggs'
  | 'fish'
  | 'shellfish'
  | 'tree_nuts'
  | 'peanuts'
  | 'wheat'
  | 'soy'
  | 'sesame';

/**
 * Cuisine type
 */
export type CuisineType =
  | 'american'
  | 'italian'
  | 'mexican'
  | 'asian'
  | 'indian'
  | 'mediterranean'
  | 'middle_eastern'
  | 'latin_american'
  | 'european'
  | 'african';

/**
 * Micronutrient information
 */
export interface Micronutrients {
  // Vitamins (% of daily value per serving)
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  vitaminB6?: number;
  vitaminB12?: number;
  folate?: number;
  
  // Minerals (% of daily value per serving)
  calcium?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
  sodium?: number;
  zinc?: number;
  phosphorus?: number;
}

/**
 * Serving size information
 */
export interface ServingSize {
  amount: number;
  unit: 'g' | 'ml' | 'oz' | 'cup' | 'tbsp' | 'tsp' | 'piece' | 'slice' | 'serving';
  gramsEquivalent: number; // Always provide grams for standardization
  description?: string; // e.g., "1 medium apple", "1 cup cooked"
}

/**
 * Macronutrient profile per serving
 */
export interface MacroProfile {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fiber: number; // grams
  sugars?: number; // grams
  fats: number; // grams
  saturatedFat?: number; // grams
  monounsaturatedFat?: number; // grams
  polyunsaturatedFat?: number; // grams
  transFat?: number; // grams
  cholesterol?: number; // mg
}

/**
 * Complete ingredient definition
 */
export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  servingSize: ServingSize;
  macros: MacroProfile;
  micronutrients?: Micronutrients;
  
  // Diet compatibility
  dietTypes: DietType[];
  allergens: Allergen[];
  
  // Additional properties
  cuisineTypes?: CuisineType[];
  isOrganic?: boolean;
  isSeasonal?: boolean;
  seasonalMonths?: number[]; // 1-12 for Jan-Dec
  
  // Cost and availability
  costLevel: 'low' | 'medium' | 'high';
  availability: 'common' | 'specialty' | 'rare';
  
  // Preparation
  cookingRequired: boolean;
  prepTime?: number; // minutes
  shelfLife?: number; // days
  
  // Metadata
  tags?: string[];
  alternatives?: string[]; // IDs of alternative ingredients
  description?: string;
}

/**
 * Ingredient filter criteria
 */
export interface IngredientFilter {
  categories?: IngredientCategory[];
  dietTypes?: DietType[];
  excludeAllergens?: Allergen[];
  cuisineTypes?: CuisineType[];
  costLevel?: ('low' | 'medium' | 'high')[];
  availability?: ('common' | 'specialty' | 'rare')[];
  maxPrepTime?: number;
  minProtein?: number;
  maxCarbs?: number;
  maxFats?: number;
  isOrganic?: boolean;
  isSeasonal?: boolean;
  currentMonth?: number;
}

/**
 * Ingredient search result
 */
export interface IngredientSearchResult {
  ingredient: Ingredient;
  matchScore: number; // 0-1, how well it matches the filter
  reason?: string; // Why this ingredient was matched
}

/**
 * Nutritional goal for ingredient selection
 */
export interface NutritionalGoal {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetFiber?: number;
}
