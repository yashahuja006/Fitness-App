/**
 * Meal Filtering Service - Usage Examples
 * 
 * Demonstrates how to use cooking time and cuisine preference filtering
 * in meal planning scenarios
 */

import {
  MealFilteringService,
  MealFilterConfig,
  filterIngredients,
  getFilteredIngredients,
  validateFilterConfig
} from '../lib/mealFilteringService';
import { generateMealVariation, MealVariationConfig } from '../lib/mealVariationAlgorithms';
import { UserProfileExtended } from '../types/nutrition';
import { CuisineType } from '../types/ingredient';

/**
 * Example 1: Basic filtering for quick vegetarian meals
 */
export function example1_QuickVegetarianMeals() {
  console.log('=== Example 1: Quick Vegetarian Meals ===\n');

  const config: MealFilterConfig = {
    dietType: 'vegetarian',
    cookingTimePreference: 'quick'
  };

  const ingredients = filterIngredients(config);

  console.log(`Found ${ingredients.length} quick vegetarian ingredients`);
  console.log('Sample ingredients:');
  ingredients.slice(0, 5).forEach(ing => {
    console.log(`  - ${ing.name} (${ing.prepTime || 0} min prep)`);
  });
}

/**
 * Example 2: Mediterranean cuisine with moderate cooking time
 */
export function example2_MediterraneanModerate() {
  console.log('\n=== Example 2: Mediterranean Cuisine (Moderate) ===\n');

  const config: MealFilterConfig = {
    dietType: 'mediterranean',
    cookingTimePreference: 'moderate',
    cuisinePreferences: ['mediterranean', 'italian']
  };

  const result = getFilteredIngredients(config);

  console.log(`Filtered ${result.filteredCount} out of ${result.totalAvailable} ingredients`);
  console.log('Applied filters:', result.appliedFilters);
  
  const stats = MealFilteringService.getFilterStatistics(result);
  console.log(`Filter efficiency: ${(stats.filterEfficiency * 100).toFixed(1)}%`);
  console.log('Ingredients by category:', stats.categoryCounts);
}

/**
 * Example 3: Keto meals with no dairy
 */
export function example3_KetoNoDairy() {
  console.log('\n=== Example 3: Keto Meals (No Dairy) ===\n');

  const config: MealFilterConfig = {
    dietType: 'keto',
    cookingTimePreference: 'quick',
    excludeAllergens: ['dairy']
  };

  const ingredients = filterIngredients(config);

  console.log(`Found ${ingredients.length} keto-friendly ingredients without dairy`);
  console.log('High-fat protein sources:');
  ingredients
    .filter(ing => ing.category === 'protein' && ing.macros.fats > 10)
    .slice(0, 5)
    .forEach(ing => {
      console.log(`  - ${ing.name}: ${ing.macros.fats}g fat, ${ing.macros.protein}g protein`);
    });
}

/**
 * Example 4: User profile-based filtering
 */
export function example4_UserProfileFiltering() {
  console.log('\n=== Example 4: User Profile-Based Filtering ===\n');

  // Simulate a user profile
  const userProfile: Partial<UserProfileExtended> = {
    diet_type: 'vegetarian',
    cooking_time: 'quick',
    cuisine_preference: ['italian', 'mediterranean', 'american']
  };

  // Convert to filter config
  const config: MealFilterConfig = {
    dietType: userProfile.diet_type,
    cookingTimePreference: userProfile.cooking_time,
    cuisinePreferences: userProfile.cuisine_preference as CuisineType[]
  };

  // Validate configuration
  const validation = validateFilterConfig(config);
  if (!validation.isValid) {
    console.error('Invalid configuration:', validation.errors);
    return;
  }

  const ingredients = filterIngredients(config);

  console.log(`User preferences: ${userProfile.diet_type}, ${userProfile.cooking_time} cooking`);
  console.log(`Preferred cuisines: ${userProfile.cuisine_preference.join(', ')}`);
  console.log(`Found ${ingredients.length} matching ingredients`);
}

/**
 * Example 5: Generate complete meal with filtering
 */
export function example5_GenerateMealWithFiltering() {
  console.log('\n=== Example 5: Generate Meal with Filtering ===\n');

  const config: MealVariationConfig = {
    tier: 'pro',
    dietType: 'mediterranean',
    targetMacros: {
      calories: 550,
      protein: 30,
      carbohydrates: 55,
      fats: 18,
      fiber: 10
    },
    mealType: 'lunch',
    dayNumber: 1,
    cookingTimePreference: 'quick',
    cuisinePreferences: ['mediterranean', 'italian']
  };

  const meal = generateMealVariation(config);

  console.log(`Meal: ${meal.name}`);
  console.log(`Cooking time: ${meal.cookingTime} minutes`);
  console.log(`Macros: ${meal.macros.calories} cal, ${meal.macros.protein}g protein`);
  console.log('\nIngredients:');
  meal.ingredients.forEach(ing => {
    console.log(`  - ${ing.amount}g ${ing.ingredientName}`);
  });
  console.log(`\nPreparation: ${meal.preparation}`);
}

/**
 * Example 6: Recommended filters based on available time
 */
export function example6_RecommendedFilters() {
  console.log('\n=== Example 6: Recommended Filters ===\n');

  // User has only 20 minutes per day for cooking
  const userProfile = {
    availableTime: 20,
    preferredCuisines: ['asian', 'american'] as CuisineType[],
    dietType: 'standard' as const
  };

  const recommended = MealFilteringService.getRecommendedFilters(userProfile);

  console.log('User has 20 minutes available for cooking');
  console.log('Recommended configuration:');
  console.log(`  - Cooking time: ${recommended.cookingTimePreference}`);
  console.log(`  - Cuisines: ${recommended.cuisinePreferences?.join(', ')}`);
  console.log(`  - Diet type: ${recommended.dietType}`);

  const ingredients = filterIngredients(recommended);
  console.log(`\nFound ${ingredients.length} ingredients matching recommendations`);
}

/**
 * Example 7: Multiple cuisine preferences
 */
export function example7_MultipleCuisines() {
  console.log('\n=== Example 7: Multiple Cuisine Preferences ===\n');

  const cuisines: CuisineType[] = ['italian', 'mexican', 'asian'];
  
  const config: MealFilterConfig = {
    dietType: 'standard',
    cookingTimePreference: 'moderate',
    cuisinePreferences: cuisines
  };

  const result = getFilteredIngredients(config);

  console.log(`Filtering for cuisines: ${cuisines.join(', ')}`);
  console.log(`Found ${result.filteredCount} ingredients`);

  // Get available cuisines from filtered results
  const availableCuisines = MealFilteringService.getAvailableCuisines(result.ingredients);
  console.log('Available cuisines in results:', availableCuisines.join(', '));

  // Show statistics
  const stats = MealFilteringService.getFilterStatistics(result);
  console.log('\nIngredients by cuisine:');
  Object.entries(stats.cuisineCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cuisine, count]) => {
      console.log(`  ${cuisine}: ${count}`);
    });
}

/**
 * Example 8: Vegan Asian quick meals
 */
export function example8_VeganAsianQuick() {
  console.log('\n=== Example 8: Vegan Asian Quick Meals ===\n');

  const config: MealFilterConfig = {
    dietType: 'vegan',
    cookingTimePreference: 'quick',
    cuisinePreferences: ['asian', 'indian']
  };

  const result = getFilteredIngredients(config);

  console.log('Filtering for: Vegan, Asian/Indian, Quick prep');
  console.log(`Found ${result.filteredCount} ingredients`);

  // Show protein sources
  const proteinSources = result.ingredients.filter(
    ing => ing.category === 'protein' || ing.category === 'legume'
  );
  
  console.log('\nVegan protein sources:');
  proteinSources.slice(0, 5).forEach(ing => {
    console.log(`  - ${ing.name}: ${ing.macros.protein}g protein per 100g`);
  });
}

/**
 * Example 9: Exclude specific ingredients
 */
export function example9_ExcludeIngredients() {
  console.log('\n=== Example 9: Exclude Specific Ingredients ===\n');

  // User doesn't like chicken or fish
  const config: MealFilterConfig = {
    dietType: 'standard',
    cookingTimePreference: 'moderate',
    excludeIngredients: ['chicken-breast', 'chicken-thigh', 'salmon', 'tuna']
  };

  const ingredients = filterIngredients(config);

  console.log('Excluded: chicken and fish');
  console.log(`Found ${ingredients.length} alternative ingredients`);

  // Show alternative protein sources
  const proteinSources = ingredients.filter(ing => ing.category === 'protein');
  console.log('\nAlternative protein sources:');
  proteinSources.slice(0, 5).forEach(ing => {
    console.log(`  - ${ing.name}`);
  });
}

/**
 * Example 10: Filter statistics and insights
 */
export function example10_FilterStatistics() {
  console.log('\n=== Example 10: Filter Statistics ===\n');

  const config: MealFilterConfig = {
    dietType: 'paleo',
    cookingTimePreference: 'quick',
    cuisinePreferences: ['american', 'mediterranean']
  };

  const result = getFilteredIngredients(config);
  const stats = MealFilteringService.getFilterStatistics(result);

  console.log('Filter Configuration:');
  console.log(`  Diet: ${config.dietType}`);
  console.log(`  Cooking time: ${config.cookingTimePreference}`);
  console.log(`  Cuisines: ${config.cuisinePreferences?.join(', ')}`);

  console.log('\nStatistics:');
  console.log(`  Total ingredients: ${stats.totalIngredients}`);
  console.log(`  Filtered ingredients: ${stats.filteredIngredients}`);
  console.log(`  Filter efficiency: ${(stats.filterEfficiency * 100).toFixed(1)}%`);

  console.log('\nIngredients by category:');
  Object.entries(stats.categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

  console.log('\nCooking time description:');
  console.log(`  ${MealFilteringService.getCookingTimeDescription(config.cookingTimePreference!)}`);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  example1_QuickVegetarianMeals();
  example2_MediterraneanModerate();
  example3_KetoNoDairy();
  example4_UserProfileFiltering();
  example5_GenerateMealWithFiltering();
  example6_RecommendedFilters();
  example7_MultipleCuisines();
  example8_VeganAsianQuick();
  example9_ExcludeIngredients();
  example10_FilterStatistics();
}

// Uncomment to run examples
// runAllExamples();
