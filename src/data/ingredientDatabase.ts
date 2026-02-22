/**
 * Comprehensive Ingredient Database
 * Contains detailed macro profiles for meal planning across all diet types
 * All nutritional values are per 100g serving unless otherwise specified
 */

import { Ingredient } from '../types/ingredient';

/**
 * Complete ingredient database with comprehensive nutritional information
 * Organized by category for easy filtering and meal planning
 */
export const ingredientDatabase: Ingredient[] = [
  // ============================================================================
  // PROTEIN SOURCES - Animal Based
  // ============================================================================
  
  {
    id: 'chicken-breast',
    name: 'Chicken Breast (Skinless)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3.5 oz cooked'
    },
    macros: {
      calories: 165,
      protein: 31,
      carbohydrates: 0,
      fiber: 0,
      fats: 3.6,
      saturatedFat: 1,
      cholesterol: 85
    },
    micronutrients: {
      vitaminB6: 30,
      vitaminB12: 6,
      iron: 5,
      zinc: 7,
      phosphorus: 20
    },
    dietTypes: ['standard', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'italian', 'asian', 'mexican', 'mediterranean'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 15,
    shelfLife: 2,
    tags: ['lean', 'high-protein', 'versatile'],
    alternatives: ['turkey-breast', 'chicken-thigh']
  },

  {
    id: 'chicken-thigh',
    name: 'Chicken Thigh (Skinless)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3.5 oz cooked'
    },
    macros: {
      calories: 209,
      protein: 26,
      carbohydrates: 0,
      fiber: 0,
      fats: 11,
      saturatedFat: 3,
      cholesterol: 95
    },
    micronutrients: {
      vitaminB6: 25,
      vitaminB12: 8,
      iron: 7,
      zinc: 15
    },
    dietTypes: ['standard', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'italian', 'asian', 'mexican', 'mediterranean'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 20,
    shelfLife: 2,
    tags: ['high-protein', 'flavorful', 'juicy'],
    alternatives: ['chicken-breast', 'turkey-thigh']
  },

  {
    id: 'turkey-breast',
    name: 'Turkey Breast (Skinless)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3.5 oz cooked'
    },
    macros: {
      calories: 135,
      protein: 30,
      carbohydrates: 0,
      fiber: 0,
      fats: 0.7,
      saturatedFat: 0.2,
      cholesterol: 60
    },
    micronutrients: {
      vitaminB6: 40,
      vitaminB12: 5,
      iron: 7,
      zinc: 10
    },
    dietTypes: ['standard', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'mediterranean'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 15,
    shelfLife: 2,
    tags: ['lean', 'high-protein', 'low-fat'],
    alternatives: ['chicken-breast']
  },

  {
    id: 'salmon',
    name: 'Salmon (Atlantic, Wild)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3.5 oz cooked'
    },
    macros: {
      calories: 206,
      protein: 22,
      carbohydrates: 0,
      fiber: 0,
      fats: 13,
      saturatedFat: 3.1,
      monounsaturatedFat: 3.8,
      polyunsaturatedFat: 4.2,
      cholesterol: 55
    },
    micronutrients: {
      vitaminD: 127,
      vitaminB12: 51,
      vitaminB6: 47,
      iron: 5,
      magnesium: 7,
      potassium: 10
    },
    dietTypes: ['standard', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: ['fish'],
    cuisineTypes: ['american', 'asian', 'mediterranean', 'european'],
    costLevel: 'high',
    availability: 'common',
    cookingRequired: true,
    prepTime: 15,
    shelfLife: 2,
    tags: ['omega-3', 'heart-healthy', 'high-protein'],
    alternatives: ['tuna', 'mackerel', 'trout']
  },

  {
    id: 'tuna',
    name: 'Tuna (Yellowfin)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3.5 oz cooked'
    },
    macros: {
      calories: 144,
      protein: 30,
      carbohydrates: 0,
      fiber: 0,
      fats: 1.3,
      saturatedFat: 0.3,
      cholesterol: 60
    },
    micronutrients: {
      vitaminB12: 160,
      vitaminB6: 45,
      iron: 6,
      magnesium: 15
    },
    dietTypes: ['standard', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: ['fish'],
    cuisineTypes: ['american', 'asian', 'mediterranean'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 10,
    shelfLife: 2,
    tags: ['lean', 'high-protein', 'low-fat'],
    alternatives: ['salmon', 'mahi-mahi']
  },

  {
    id: 'ground-beef-lean',
    name: 'Ground Beef (90% Lean)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3.5 oz cooked'
    },
    macros: {
      calories: 176,
      protein: 25,
      carbohydrates: 0,
      fiber: 0,
      fats: 8,
      saturatedFat: 3.2,
      cholesterol: 70
    },
    micronutrients: {
      iron: 15,
      zinc: 35,
      vitaminB12: 40,
      vitaminB6: 15
    },
    dietTypes: ['standard', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'mexican', 'italian', 'middle_eastern'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 10,
    shelfLife: 2,
    tags: ['high-protein', 'iron-rich', 'versatile'],
    alternatives: ['ground-turkey', 'ground-chicken']
  },

  {
    id: 'eggs-whole',
    name: 'Eggs (Whole, Large)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '2 large eggs'
    },
    macros: {
      calories: 143,
      protein: 13,
      carbohydrates: 0.7,
      fiber: 0,
      fats: 10,
      saturatedFat: 3.1,
      cholesterol: 373
    },
    micronutrients: {
      vitaminA: 19,
      vitaminD: 21,
      vitaminB12: 18,
      iron: 9,
      zinc: 8
    },
    dietTypes: ['standard', 'vegetarian', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: ['eggs'],
    cuisineTypes: ['american', 'european', 'asian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 5,
    shelfLife: 21,
    tags: ['complete-protein', 'budget-friendly', 'versatile'],
    alternatives: ['egg-whites']
  },

  {
    id: 'egg-whites',
    name: 'Egg Whites',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3 large egg whites'
    },
    macros: {
      calories: 52,
      protein: 11,
      carbohydrates: 0.7,
      fiber: 0,
      fats: 0.2,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      calcium: 1,
      iron: 1,
      magnesium: 3
    },
    dietTypes: ['standard', 'vegetarian', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: ['eggs'],
    cuisineTypes: ['american', 'european'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 5,
    shelfLife: 7,
    tags: ['lean', 'high-protein', 'low-fat', 'low-calorie'],
    alternatives: ['eggs-whole']
  },

  // ============================================================================
  // PROTEIN SOURCES - Plant Based
  // ============================================================================

  {
    id: 'tofu-firm',
    name: 'Tofu (Firm)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup cubed'
    },
    macros: {
      calories: 144,
      protein: 17,
      carbohydrates: 3,
      fiber: 2,
      fats: 9,
      saturatedFat: 1.3,
      cholesterol: 0
    },
    micronutrients: {
      calcium: 35,
      iron: 15,
      magnesium: 15,
      zinc: 10
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: ['soy'],
    cuisineTypes: ['asian', 'american'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 5,
    shelfLife: 7,
    tags: ['plant-based', 'high-protein', 'versatile'],
    alternatives: ['tempeh', 'seitan', 'chicken-breast']
  },

  {
    id: 'tempeh',
    name: 'Tempeh',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup'
    },
    macros: {
      calories: 193,
      protein: 20,
      carbohydrates: 9,
      fiber: 7,
      fats: 11,
      saturatedFat: 2.3,
      cholesterol: 0
    },
    micronutrients: {
      calcium: 11,
      iron: 15,
      magnesium: 20,
      phosphorus: 27
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: ['soy'],
    cuisineTypes: ['asian', 'american'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 10,
    shelfLife: 7,
    tags: ['plant-based', 'high-protein', 'fermented', 'high-fiber'],
    alternatives: ['tofu-firm', 'seitan']
  },

  {
    id: 'lentils-cooked',
    name: 'Lentils (Cooked)',
    category: 'legume',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup cooked'
    },
    macros: {
      calories: 116,
      protein: 9,
      carbohydrates: 20,
      fiber: 8,
      fats: 0.4,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      iron: 19,
      folate: 45,
      magnesium: 9,
      potassium: 8
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['indian', 'mediterranean', 'middle_eastern'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 25,
    shelfLife: 5,
    tags: ['plant-based', 'high-fiber', 'budget-friendly', 'iron-rich'],
    alternatives: ['chickpeas', 'black-beans']
  },

  {
    id: 'chickpeas',
    name: 'Chickpeas (Cooked)',
    category: 'legume',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup cooked'
    },
    macros: {
      calories: 164,
      protein: 9,
      carbohydrates: 27,
      fiber: 8,
      fats: 2.6,
      saturatedFat: 0.3,
      cholesterol: 0
    },
    micronutrients: {
      iron: 14,
      folate: 43,
      magnesium: 12,
      zinc: 9
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['mediterranean', 'middle_eastern', 'indian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 30,
    shelfLife: 5,
    tags: ['plant-based', 'high-fiber', 'versatile'],
    alternatives: ['lentils-cooked', 'black-beans']
  },

  {
    id: 'black-beans',
    name: 'Black Beans (Cooked)',
    category: 'legume',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup cooked'
    },
    macros: {
      calories: 132,
      protein: 9,
      carbohydrates: 24,
      fiber: 9,
      fats: 0.5,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      iron: 12,
      folate: 64,
      magnesium: 15,
      potassium: 11
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['mexican', 'latin_american'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 30,
    shelfLife: 5,
    tags: ['plant-based', 'high-fiber', 'budget-friendly'],
    alternatives: ['chickpeas', 'kidney-beans']
  },

  // ============================================================================
  // DAIRY PRODUCTS
  // ============================================================================

  {
    id: 'greek-yogurt-plain',
    name: 'Greek Yogurt (Plain, Non-Fat)',
    category: 'dairy',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup'
    },
    macros: {
      calories: 59,
      protein: 10,
      carbohydrates: 3.6,
      fiber: 0,
      sugars: 3.2,
      fats: 0.4,
      saturatedFat: 0.1,
      cholesterol: 5
    },
    micronutrients: {
      calcium: 11,
      vitaminB12: 21,
      phosphorus: 14
    },
    dietTypes: ['standard', 'vegetarian', 'keto', 'gluten_free'],
    allergens: ['dairy'],
    cuisineTypes: ['american', 'mediterranean', 'european'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 14,
    tags: ['high-protein', 'probiotic', 'low-fat'],
    alternatives: ['cottage-cheese', 'skyr']
  },

  {
    id: 'cottage-cheese',
    name: 'Cottage Cheese (Low-Fat)',
    category: 'dairy',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup'
    },
    macros: {
      calories: 72,
      protein: 12,
      carbohydrates: 4.3,
      fiber: 0,
      fats: 1,
      saturatedFat: 0.6,
      cholesterol: 9
    },
    micronutrients: {
      calcium: 8,
      vitaminB12: 15,
      phosphorus: 16
    },
    dietTypes: ['standard', 'vegetarian', 'keto', 'gluten_free'],
    allergens: ['dairy'],
    cuisineTypes: ['american', 'european'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 10,
    tags: ['high-protein', 'low-fat', 'versatile'],
    alternatives: ['greek-yogurt-plain', 'ricotta']
  },

  // ============================================================================
  // CARBOHYDRATE SOURCES - Grains
  // ============================================================================

  {
    id: 'brown-rice',
    name: 'Brown Rice (Cooked)',
    category: 'grain',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup cooked'
    },
    macros: {
      calories: 112,
      protein: 2.6,
      carbohydrates: 24,
      fiber: 1.8,
      fats: 0.9,
      saturatedFat: 0.2,
      cholesterol: 0
    },
    micronutrients: {
      magnesium: 11,
      phosphorus: 8,
      iron: 3
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['asian', 'american', 'mediterranean'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 40,
    shelfLife: 5,
    tags: ['whole-grain', 'complex-carb', 'budget-friendly'],
    alternatives: ['quinoa', 'white-rice']
  },

  {
    id: 'quinoa',
    name: 'Quinoa (Cooked)',
    category: 'grain',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup cooked'
    },
    macros: {
      calories: 120,
      protein: 4.4,
      carbohydrates: 21,
      fiber: 2.8,
      fats: 1.9,
      saturatedFat: 0.2,
      cholesterol: 0
    },
    micronutrients: {
      iron: 8,
      magnesium: 16,
      phosphorus: 15,
      folate: 11
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'mediterranean', 'latin_american'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 20,
    shelfLife: 5,
    tags: ['complete-protein', 'whole-grain', 'high-fiber'],
    alternatives: ['brown-rice', 'couscous']
  },

  {
    id: 'oats',
    name: 'Oats (Rolled, Dry)',
    category: 'grain',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 cup dry'
    },
    macros: {
      calories: 389,
      protein: 17,
      carbohydrates: 66,
      fiber: 11,
      fats: 7,
      saturatedFat: 1.2,
      cholesterol: 0
    },
    micronutrients: {
      iron: 26,
      magnesium: 44,
      phosphorus: 52,
      zinc: 26
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'european'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 5,
    shelfLife: 365,
    tags: ['whole-grain', 'high-fiber', 'heart-healthy', 'budget-friendly'],
    alternatives: ['oat-bran', 'cream-of-wheat']
  },

  {
    id: 'sweet-potato',
    name: 'Sweet Potato (Baked)',
    category: 'carbohydrate',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 medium potato'
    },
    macros: {
      calories: 90,
      protein: 2,
      carbohydrates: 21,
      fiber: 3.3,
      sugars: 6.5,
      fats: 0.2,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminA: 384,
      vitaminC: 33,
      potassium: 10,
      magnesium: 6
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'african', 'asian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 45,
    shelfLife: 14,
    tags: ['complex-carb', 'high-fiber', 'nutrient-dense'],
    alternatives: ['white-potato', 'butternut-squash']
  },

  {
    id: 'white-potato',
    name: 'White Potato (Baked)',
    category: 'carbohydrate',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 medium potato'
    },
    macros: {
      calories: 93,
      protein: 2.5,
      carbohydrates: 21,
      fiber: 2.2,
      fats: 0.1,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 28,
      potassium: 12,
      vitaminB6: 18
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'european'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 45,
    shelfLife: 14,
    tags: ['complex-carb', 'budget-friendly', 'versatile'],
    alternatives: ['sweet-potato']
  },

  // ============================================================================
  // VEGETABLES
  // ============================================================================

  {
    id: 'broccoli',
    name: 'Broccoli (Cooked)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 cup chopped'
    },
    macros: {
      calories: 35,
      protein: 2.4,
      carbohydrates: 7,
      fiber: 3.3,
      fats: 0.4,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 90,
      vitaminK: 141,
      folate: 16,
      potassium: 9
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'asian', 'italian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: true,
    prepTime: 10,
    shelfLife: 7,
    tags: ['low-calorie', 'high-fiber', 'nutrient-dense'],
    alternatives: ['cauliflower', 'brussels-sprouts']
  },

  {
    id: 'spinach',
    name: 'Spinach (Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3 cups raw'
    },
    macros: {
      calories: 23,
      protein: 2.9,
      carbohydrates: 3.6,
      fiber: 2.2,
      fats: 0.4,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      vitaminA: 188,
      vitaminC: 47,
      vitaminK: 604,
      iron: 15,
      folate: 49
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'mediterranean', 'indian', 'italian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 2,
    shelfLife: 5,
    tags: ['low-calorie', 'iron-rich', 'nutrient-dense'],
    alternatives: ['kale', 'swiss-chard']
  },

  {
    id: 'bell-pepper',
    name: 'Bell Pepper (Red, Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 medium pepper'
    },
    macros: {
      calories: 31,
      protein: 1,
      carbohydrates: 6,
      fiber: 2.1,
      sugars: 4.2,
      fats: 0.3,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 213,
      vitaminA: 63,
      vitaminB6: 15
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'mexican', 'mediterranean', 'asian'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 5,
    shelfLife: 7,
    tags: ['low-calorie', 'vitamin-c-rich', 'versatile'],
    alternatives: ['zucchini', 'tomatoes']
  },

  {
    id: 'asparagus',
    name: 'Asparagus (Cooked)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '6-7 spears'
    },
    macros: {
      calories: 22,
      protein: 2.4,
      carbohydrates: 4.1,
      fiber: 2.1,
      fats: 0.2,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminK: 56,
      folate: 34,
      vitaminC: 9,
      iron: 12
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'european', 'mediterranean'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 10,
    shelfLife: 5,
    tags: ['low-calorie', 'nutrient-dense'],
    alternatives: ['green-beans', 'broccoli']
  },

  // ============================================================================
  // FRUITS
  // ============================================================================

  {
    id: 'banana',
    name: 'Banana',
    category: 'fruit',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 medium banana'
    },
    macros: {
      calories: 89,
      protein: 1.1,
      carbohydrates: 23,
      fiber: 2.6,
      sugars: 12,
      fats: 0.3,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      potassium: 10,
      vitaminC: 15,
      vitaminB6: 22
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'latin_american', 'asian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 5,
    tags: ['quick-energy', 'potassium-rich', 'portable'],
    alternatives: ['apple', 'dates']
  },

  {
    id: 'blueberries',
    name: 'Blueberries (Fresh)',
    category: 'fruit',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '2/3 cup'
    },
    macros: {
      calories: 57,
      protein: 0.7,
      carbohydrates: 14,
      fiber: 2.4,
      sugars: 10,
      fats: 0.3,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 16,
      vitaminK: 24,
      manganese: 17
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'european'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 7,
    tags: ['antioxidant-rich', 'low-calorie', 'nutrient-dense'],
    alternatives: ['strawberries', 'raspberries']
  },

  {
    id: 'apple',
    name: 'Apple (with skin)',
    category: 'fruit',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 small apple'
    },
    macros: {
      calories: 52,
      protein: 0.3,
      carbohydrates: 14,
      fiber: 2.4,
      sugars: 10,
      fats: 0.2,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 8,
      potassium: 3
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'european'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 14,
    tags: ['low-calorie', 'portable', 'budget-friendly'],
    alternatives: ['pear', 'orange']
  },

  // ============================================================================
  // HEALTHY FATS
  // ============================================================================

  {
    id: 'avocado',
    name: 'Avocado',
    category: 'fat',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 medium avocado'
    },
    macros: {
      calories: 160,
      protein: 2,
      carbohydrates: 9,
      fiber: 7,
      fats: 15,
      saturatedFat: 2.1,
      monounsaturatedFat: 10,
      cholesterol: 0
    },
    micronutrients: {
      vitaminK: 26,
      folate: 20,
      vitaminC: 17,
      potassium: 14
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['mexican', 'american', 'latin_american'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 2,
    shelfLife: 5,
    tags: ['healthy-fats', 'heart-healthy', 'nutrient-dense'],
    alternatives: ['olive-oil', 'nuts']
  },

  {
    id: 'almonds',
    name: 'Almonds (Raw)',
    category: 'nut_seed',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3/4 cup or 23 almonds'
    },
    macros: {
      calories: 579,
      protein: 21,
      carbohydrates: 22,
      fiber: 13,
      fats: 50,
      saturatedFat: 3.8,
      monounsaturatedFat: 31,
      cholesterol: 0
    },
    micronutrients: {
      vitaminE: 171,
      magnesium: 67,
      calcium: 26,
      iron: 21
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: ['tree_nuts'],
    cuisineTypes: ['american', 'mediterranean', 'middle_eastern'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 180,
    tags: ['healthy-fats', 'high-protein', 'nutrient-dense', 'portable'],
    alternatives: ['walnuts', 'cashews']
  },

  {
    id: 'peanut-butter',
    name: 'Peanut Butter (Natural)',
    category: 'nut_seed',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '6 tablespoons'
    },
    macros: {
      calories: 588,
      protein: 25,
      carbohydrates: 20,
      fiber: 8,
      sugars: 9,
      fats: 50,
      saturatedFat: 10,
      monounsaturatedFat: 24,
      cholesterol: 0
    },
    micronutrients: {
      vitaminE: 45,
      magnesium: 39,
      phosphorus: 34
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
    allergens: ['peanuts'],
    cuisineTypes: ['american', 'asian', 'african'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 90,
    tags: ['healthy-fats', 'high-protein', 'versatile', 'budget-friendly'],
    alternatives: ['almond-butter', 'cashew-butter']
  },

  {
    id: 'olive-oil',
    name: 'Olive Oil (Extra Virgin)',
    category: 'fat',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '7 tablespoons'
    },
    macros: {
      calories: 884,
      protein: 0,
      carbohydrates: 0,
      fiber: 0,
      fats: 100,
      saturatedFat: 14,
      monounsaturatedFat: 73,
      cholesterol: 0
    },
    micronutrients: {
      vitaminE: 72,
      vitaminK: 75
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['mediterranean', 'italian', 'middle_eastern'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 365,
    tags: ['healthy-fats', 'heart-healthy', 'anti-inflammatory'],
    alternatives: ['avocado-oil', 'coconut-oil']
  },

  {
    id: 'chia-seeds',
    name: 'Chia Seeds',
    category: 'nut_seed',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '10 tablespoons'
    },
    macros: {
      calories: 486,
      protein: 17,
      carbohydrates: 42,
      fiber: 34,
      fats: 31,
      saturatedFat: 3.3,
      polyunsaturatedFat: 24,
      cholesterol: 0
    },
    micronutrients: {
      calcium: 63,
      iron: 43,
      magnesium: 95,
      phosphorus: 86
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'latin_american'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 365,
    tags: ['omega-3', 'high-fiber', 'nutrient-dense'],
    alternatives: ['flax-seeds', 'hemp-seeds']
  },

  // ============================================================================
  // KETO-SPECIFIC INGREDIENTS
  // ============================================================================

  {
    id: 'cauliflower',
    name: 'Cauliflower (Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 cup chopped'
    },
    macros: {
      calories: 25,
      protein: 1.9,
      carbohydrates: 5,
      fiber: 2,
      fats: 0.3,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 77,
      vitaminK: 20,
      folate: 14
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'indian', 'mediterranean'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 5,
    shelfLife: 7,
    tags: ['low-carb', 'low-calorie', 'versatile', 'rice-substitute'],
    alternatives: ['broccoli', 'zucchini']
  },

  {
    id: 'zucchini',
    name: 'Zucchini (Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 medium zucchini'
    },
    macros: {
      calories: 17,
      protein: 1.2,
      carbohydrates: 3.1,
      fiber: 1,
      fats: 0.3,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 29,
      vitaminA: 4,
      potassium: 8
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['italian', 'mediterranean', 'american'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 5,
    shelfLife: 7,
    tags: ['low-carb', 'low-calorie', 'versatile', 'pasta-substitute'],
    alternatives: ['cauliflower', 'cucumber']
  },

  {
    id: 'cheese-cheddar',
    name: 'Cheddar Cheese',
    category: 'dairy',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 cup shredded'
    },
    macros: {
      calories: 403,
      protein: 25,
      carbohydrates: 1.3,
      fiber: 0,
      fats: 33,
      saturatedFat: 21,
      cholesterol: 105
    },
    micronutrients: {
      calcium: 72,
      vitaminA: 29,
      phosphorus: 51
    },
    dietTypes: ['standard', 'vegetarian', 'keto', 'gluten_free'],
    allergens: ['dairy'],
    cuisineTypes: ['american', 'european'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 30,
    tags: ['high-protein', 'high-fat', 'keto-friendly'],
    alternatives: ['mozzarella', 'swiss-cheese']
  },

  {
    id: 'bacon',
    name: 'Bacon (Cooked)',
    category: 'protein',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '8-10 slices'
    },
    macros: {
      calories: 541,
      protein: 37,
      carbohydrates: 1.4,
      fiber: 0,
      fats: 42,
      saturatedFat: 14,
      cholesterol: 110
    },
    micronutrients: {
      sodium: 72,
      phosphorus: 39,
      zinc: 17
    },
    dietTypes: ['standard', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: true,
    prepTime: 10,
    shelfLife: 7,
    tags: ['high-protein', 'high-fat', 'keto-friendly'],
    alternatives: ['turkey-bacon', 'sausage']
  },

  // ============================================================================
  // MEDITERRANEAN DIET SPECIFIC
  // ============================================================================

  {
    id: 'hummus',
    name: 'Hummus',
    category: 'legume',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 cup'
    },
    macros: {
      calories: 166,
      protein: 8,
      carbohydrates: 14,
      fiber: 6,
      fats: 10,
      saturatedFat: 1.4,
      cholesterol: 0
    },
    micronutrients: {
      iron: 14,
      folate: 23,
      magnesium: 11
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: ['sesame'],
    cuisineTypes: ['mediterranean', 'middle_eastern'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 7,
    tags: ['plant-based', 'high-fiber', 'versatile'],
    alternatives: ['baba-ganoush', 'tzatziki']
  },

  {
    id: 'feta-cheese',
    name: 'Feta Cheese',
    category: 'dairy',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3/4 cup crumbled'
    },
    macros: {
      calories: 264,
      protein: 14,
      carbohydrates: 4.1,
      fiber: 0,
      fats: 21,
      saturatedFat: 15,
      cholesterol: 89
    },
    micronutrients: {
      calcium: 49,
      phosphorus: 34,
      vitaminB12: 28
    },
    dietTypes: ['standard', 'vegetarian', 'keto', 'mediterranean', 'gluten_free'],
    allergens: ['dairy'],
    cuisineTypes: ['mediterranean', 'middle_eastern', 'european'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 14,
    tags: ['high-protein', 'tangy', 'versatile'],
    alternatives: ['goat-cheese', 'ricotta']
  },

  {
    id: 'olives',
    name: 'Olives (Black, Canned)',
    category: 'fat',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '3/4 cup'
    },
    macros: {
      calories: 115,
      protein: 0.8,
      carbohydrates: 6,
      fiber: 3.2,
      fats: 11,
      saturatedFat: 1.4,
      monounsaturatedFat: 7.9,
      cholesterol: 0
    },
    micronutrients: {
      vitaminE: 18,
      iron: 18,
      calcium: 9
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['mediterranean', 'middle_eastern', 'italian'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 0,
    shelfLife: 180,
    tags: ['healthy-fats', 'mediterranean', 'antioxidant-rich'],
    alternatives: ['capers', 'sun-dried-tomatoes']
  },

  // ============================================================================
  // ADDITIONAL VERSATILE INGREDIENTS
  // ============================================================================

  {
    id: 'tomatoes',
    name: 'Tomatoes (Fresh)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 medium tomato'
    },
    macros: {
      calories: 18,
      protein: 0.9,
      carbohydrates: 3.9,
      fiber: 1.2,
      sugars: 2.6,
      fats: 0.2,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 23,
      vitaminK: 10,
      potassium: 7
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['italian', 'mediterranean', 'mexican', 'american'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 2,
    shelfLife: 7,
    tags: ['low-calorie', 'versatile', 'antioxidant-rich'],
    alternatives: ['bell-pepper', 'cucumber']
  },

  {
    id: 'cucumber',
    name: 'Cucumber (with peel)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1/2 medium cucumber'
    },
    macros: {
      calories: 15,
      protein: 0.7,
      carbohydrates: 3.6,
      fiber: 0.5,
      fats: 0.1,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminK: 19,
      vitaminC: 5,
      potassium: 4
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['mediterranean', 'middle_eastern', 'asian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 2,
    shelfLife: 7,
    tags: ['low-calorie', 'hydrating', 'refreshing'],
    alternatives: ['zucchini', 'celery']
  },

  {
    id: 'mushrooms',
    name: 'Mushrooms (White, Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1.5 cups sliced'
    },
    macros: {
      calories: 22,
      protein: 3.1,
      carbohydrates: 3.3,
      fiber: 1,
      fats: 0.3,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminD: 7,
      vitaminB6: 5,
      phosphorus: 9
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'italian', 'asian', 'european'],
    costLevel: 'medium',
    availability: 'common',
    cookingRequired: false,
    prepTime: 5,
    shelfLife: 7,
    tags: ['low-calorie', 'umami', 'versatile'],
    alternatives: ['portobello', 'shiitake']
  },

  {
    id: 'onion',
    name: 'Onion (Yellow, Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '1 medium onion'
    },
    macros: {
      calories: 40,
      protein: 1.1,
      carbohydrates: 9,
      fiber: 1.7,
      sugars: 4.2,
      fats: 0.1,
      saturatedFat: 0,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 12,
      vitaminB6: 6,
      folate: 5
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['american', 'italian', 'mexican', 'indian', 'asian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 5,
    shelfLife: 30,
    tags: ['flavor-base', 'versatile', 'budget-friendly'],
    alternatives: ['shallots', 'leeks']
  },

  {
    id: 'garlic',
    name: 'Garlic (Raw)',
    category: 'vegetable',
    servingSize: {
      amount: 100,
      unit: 'g',
      gramsEquivalent: 100,
      description: '30 cloves'
    },
    macros: {
      calories: 149,
      protein: 6.4,
      carbohydrates: 33,
      fiber: 2.1,
      fats: 0.5,
      saturatedFat: 0.1,
      cholesterol: 0
    },
    micronutrients: {
      vitaminC: 52,
      vitaminB6: 59,
      manganese: 84
    },
    dietTypes: ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'gluten_free', 'dairy_free'],
    allergens: [],
    cuisineTypes: ['italian', 'mediterranean', 'asian', 'mexican', 'indian'],
    costLevel: 'low',
    availability: 'common',
    cookingRequired: false,
    prepTime: 2,
    shelfLife: 90,
    tags: ['flavor-enhancer', 'anti-inflammatory', 'immune-support'],
    alternatives: ['ginger', 'shallots']
  },
];

/**
 * Helper function to filter ingredients by diet type
 */
export function getIngredientsByDietType(dietType: string): Ingredient[] {
  return ingredientDatabase.filter(ingredient => 
    ingredient.dietTypes.includes(dietType as any)
  );
}

/**
 * Helper function to filter ingredients by category
 */
export function getIngredientsByCategory(category: string): Ingredient[] {
  return ingredientDatabase.filter(ingredient => 
    ingredient.category === category
  );
}

/**
 * Helper function to get ingredients excluding specific allergens
 */
export function getIngredientsWithoutAllergens(allergens: string[]): Ingredient[] {
  return ingredientDatabase.filter(ingredient =>
    !ingredient.allergens.some(allergen => allergens.includes(allergen))
  );
}

/**
 * Helper function to filter by cooking time
 */
export function getIngredientsByPrepTime(maxPrepTime: number): Ingredient[] {
  return ingredientDatabase.filter(ingredient =>
    !ingredient.prepTime || ingredient.prepTime <= maxPrepTime
  );
}

/**
 * Helper function to filter by cuisine type
 */
export function getIngredientsByCuisine(cuisineType: string): Ingredient[] {
  return ingredientDatabase.filter(ingredient =>
    ingredient.cuisineTypes?.includes(cuisineType as any)
  );
}

/**
 * Helper function to get high-protein ingredients
 */
export function getHighProteinIngredients(minProtein: number = 15): Ingredient[] {
  return ingredientDatabase.filter(ingredient =>
    ingredient.macros.protein >= minProtein
  );
}

/**
 * Helper function to get low-carb ingredients (keto-friendly)
 */
export function getLowCarbIngredients(maxCarbs: number = 10): Ingredient[] {
  return ingredientDatabase.filter(ingredient =>
    ingredient.macros.carbohydrates <= maxCarbs
  );
}

/**
 * Get ingredient by ID
 */
export function getIngredientById(id: string): Ingredient | undefined {
  return ingredientDatabase.find(ingredient => ingredient.id === id);
}

/**
 * Search ingredients by name
 */
export function searchIngredientsByName(query: string): Ingredient[] {
  const lowerQuery = query.toLowerCase();
  return ingredientDatabase.filter(ingredient =>
    ingredient.name.toLowerCase().includes(lowerQuery) ||
    ingredient.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
