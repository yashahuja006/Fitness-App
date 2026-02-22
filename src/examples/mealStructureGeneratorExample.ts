/**
 * Meal Structure Generator - Usage Examples
 * 
 * Demonstrates how to use the meal structure generator to create
 * personalized meal structures based on user preferences.
 */

import {
  generateMealStructure,
  validateMealStructure,
  applyMealStructureToMacros,
  MealStructurePreferences
} from '../lib/mealStructureGenerator';
import { MacroDistribution } from '../lib/macroIntelligenceSystem';

/**
 * Example 1: Traditional 3 meals per day for fat loss
 */
export function example1_TraditionalFatLoss() {
  console.log('=== Example 1: Traditional 3 Meals for Fat Loss ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 3,
    snacksPerDay: 1,
    goal: 'fat_loss',
    workoutTime: 'morning',
    workoutDaysPerWeek: 4
  };
  
  const structure = generateMealStructure(preferences);
  
  console.log('Structure Type:', structure.structureType);
  console.log('Total Meals:', structure.totalMeals);
  console.log('Total Snacks:', structure.totalSnacks);
  console.log('\nMeals:');
  structure.meals.forEach(meal => {
    console.log(`  ${meal.name} (${meal.timing.suggestedTime})`);
    console.log(`    Calories: ${(meal.caloriePercentage * 100).toFixed(1)}%`);
    console.log(`    Macros: P${meal.macroDistribution.proteinPercentage}% C${meal.macroDistribution.carbPercentage}% F${meal.macroDistribution.fatPercentage}%`);
    if (meal.timing.isPreWorkout) console.log('    [PRE-WORKOUT]');
    if (meal.timing.isPostWorkout) console.log('    [POST-WORKOUT]');
  });
  
  console.log('\nRecommendations:');
  structure.recommendations.forEach(rec => console.log(`  - ${rec}`));
  
  return structure;
}

/**
 * Example 2: Intermittent Fasting (16:8) for fat loss
 */
export function example2_IntermittentFasting() {
  console.log('\n=== Example 2: Intermittent Fasting 16:8 ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 3,
    snacksPerDay: 0,
    goal: 'fat_loss',
    intermittentFasting: true,
    fastingHours: 16
  };
  
  const structure = generateMealStructure(preferences);
  
  console.log('Structure Type:', structure.structureType);
  console.log('Eating Window:', structure.eatingWindow?.start, '-', structure.eatingWindow?.end);
  console.log('Duration:', structure.eatingWindow?.durationHours, 'hours');
  
  console.log('\nMeals:');
  structure.meals.forEach(meal => {
    console.log(`  ${meal.name} at ${meal.timing.suggestedTime} - ${(meal.caloriePercentage * 100).toFixed(1)}% calories`);
  });
  
  console.log('\nRecommendations:');
  structure.recommendations.slice(0, 3).forEach(rec => console.log(`  - ${rec}`));
  
  return structure;
}

/**
 * Example 3: Frequent small meals for muscle gain
 */
export function example3_FrequentSmallMeals() {
  console.log('\n=== Example 3: Frequent Small Meals for Muscle Gain ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 5,
    snacksPerDay: 1,
    goal: 'muscle_gain',
    workoutTime: 'afternoon',
    workoutDaysPerWeek: 5
  };
  
  const structure = generateMealStructure(preferences);
  
  console.log('Structure Type:', structure.structureType);
  console.log('Total Daily Eating Occasions:', structure.totalMeals + structure.totalSnacks);
  
  console.log('\nMeal Schedule:');
  structure.meals.forEach(meal => {
    console.log(`  ${meal.timing.suggestedTime} - ${meal.name} (${(meal.caloriePercentage * 100).toFixed(1)}%)`);
  });
  
  return structure;
}

/**
 * Example 4: Athlete meal structure with workout optimization
 */
export function example4_AthleteStructure() {
  console.log('\n=== Example 4: Athlete Meal Structure ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 4,
    snacksPerDay: 2,
    goal: 'muscle_gain',
    workoutTime: 'afternoon',
    workoutDaysPerWeek: 6,
    dietType: 'standard'
  };
  
  const structure = generateMealStructure(preferences);
  
  console.log('Structure Type:', structure.structureType);
  console.log('Workout Time:', structure.workoutTiming?.preferredTime);
  
  console.log('\nWorkout-Optimized Meals:');
  structure.meals.forEach(meal => {
    let label = meal.name;
    if (meal.timing.isPreWorkout) label += ' [PRE-WORKOUT]';
    if (meal.timing.isPostWorkout) label += ' [POST-WORKOUT]';
    console.log(`  ${label}`);
    console.log(`    Time: ${meal.timing.suggestedTime}`);
    console.log(`    Calories: ${(meal.caloriePercentage * 100).toFixed(1)}%`);
    console.log(`    Macros: ${meal.macroDistribution.proteinPercentage}% protein, ${meal.macroDistribution.carbPercentage}% carbs`);
  });
  
  return structure;
}

/**
 * Example 5: Apply meal structure to actual macro targets
 */
export function example5_ApplyToMacros() {
  console.log('\n=== Example 5: Apply Structure to Macro Targets ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 4,
    snacksPerDay: 1,
    goal: 'muscle_gain',
    workoutTime: 'morning'
  };
  
  const structure = generateMealStructure(preferences);
  
  // Daily macro targets
  const dailyMacros: MacroDistribution = {
    protein: 180,
    carbohydrates: 300,
    fats: 60,
    fiber: 35,
    calories: 2400
  };
  
  console.log('Daily Macro Targets:');
  console.log(`  Calories: ${dailyMacros.calories} kcal`);
  console.log(`  Protein: ${dailyMacros.protein}g`);
  console.log(`  Carbs: ${dailyMacros.carbohydrates}g`);
  console.log(`  Fats: ${dailyMacros.fats}g`);
  
  const mealMacros = applyMealStructureToMacros(structure, dailyMacros);
  
  console.log('\nMeal-by-Meal Breakdown:');
  structure.meals.forEach(meal => {
    const macros = mealMacros.get(meal.id);
    if (macros) {
      console.log(`\n  ${meal.name} (${meal.timing.suggestedTime}):`);
      console.log(`    Calories: ${macros.calories} kcal`);
      console.log(`    Protein: ${macros.protein}g`);
      console.log(`    Carbs: ${macros.carbohydrates}g`);
      console.log(`    Fats: ${macros.fats}g`);
    }
  });
  
  structure.snacks.forEach(snack => {
    const macros = mealMacros.get(snack.id);
    if (macros) {
      console.log(`\n  ${snack.name}:`);
      console.log(`    Calories: ${macros.calories} kcal`);
      console.log(`    Protein: ${macros.protein}g`);
      console.log(`    Carbs: ${macros.carbohydrates}g`);
      console.log(`    Fats: ${macros.fats}g`);
    }
  });
  
  return { structure, mealMacros };
}

/**
 * Example 6: Validate meal structure
 */
export function example6_ValidateStructure() {
  console.log('\n=== Example 6: Validate Meal Structure ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 3,
    snacksPerDay: 2,
    goal: 'recomposition',
    dietType: 'vegetarian'
  };
  
  const structure = generateMealStructure(preferences);
  const validation = validateMealStructure(structure);
  
  console.log('Validation Result:', validation.isValid ? 'VALID ✓' : 'INVALID ✗');
  
  if (validation.errors.length > 0) {
    console.log('\nErrors:');
    validation.errors.forEach(error => console.log(`  ✗ ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\nWarnings:');
    validation.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
  }
  
  // Calculate total calorie percentage
  const totalCalories = [...structure.meals, ...structure.snacks]
    .reduce((sum, item) => sum + item.caloriePercentage, 0);
  
  console.log('\nTotal Calorie Allocation:', (totalCalories * 100).toFixed(2) + '%');
  
  return { structure, validation };
}

/**
 * Example 7: Keto diet meal structure
 */
export function example7_KetoDiet() {
  console.log('\n=== Example 7: Keto Diet Meal Structure ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 3,
    snacksPerDay: 1,
    goal: 'fat_loss',
    dietType: 'keto'
  };
  
  const structure = generateMealStructure(preferences);
  
  console.log('Diet Type: Keto');
  console.log('Goal: Fat Loss');
  
  console.log('\nMacro Distribution (Keto-Optimized):');
  structure.meals.forEach(meal => {
    console.log(`  ${meal.name}:`);
    console.log(`    Protein: ${meal.macroDistribution.proteinPercentage}%`);
    console.log(`    Carbs: ${meal.macroDistribution.carbPercentage}% (very low)`);
    console.log(`    Fats: ${meal.macroDistribution.fatPercentage}% (high)`);
  });
  
  console.log('\nKeto-Specific Recommendations:');
  structure.recommendations
    .filter(rec => rec.toLowerCase().includes('carb') || rec.toLowerCase().includes('fat'))
    .forEach(rec => console.log(`  - ${rec}`));
  
  return structure;
}

/**
 * Example 8: Endurance athlete meal structure
 */
export function example8_EnduranceAthlete() {
  console.log('\n=== Example 8: Endurance Athlete Meal Structure ===\n');
  
  const preferences: MealStructurePreferences = {
    mealsPerDay: 5,
    snacksPerDay: 2,
    goal: 'endurance',
    workoutTime: 'morning',
    workoutDaysPerWeek: 6
  };
  
  const structure = generateMealStructure(preferences);
  
  console.log('Goal: Endurance Performance');
  console.log('Training Frequency: 6 days/week');
  
  console.log('\nCarb-Focused Meal Plan:');
  structure.meals.forEach(meal => {
    const carbFocus = meal.macroDistribution.carbPercentage > 40 ? '🔥' : '';
    console.log(`  ${meal.timing.suggestedTime} - ${meal.name} ${carbFocus}`);
    console.log(`    Carbs: ${meal.macroDistribution.carbPercentage}%`);
  });
  
  console.log('\nEndurance-Specific Recommendations:');
  structure.recommendations
    .filter(rec => rec.toLowerCase().includes('carb') || rec.toLowerCase().includes('endurance'))
    .forEach(rec => console.log(`  - ${rec}`));
  
  return structure;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  example1_TraditionalFatLoss();
  example2_IntermittentFasting();
  example3_FrequentSmallMeals();
  example4_AthleteStructure();
  example5_ApplyToMacros();
  example6_ValidateStructure();
  example7_KetoDiet();
  example8_EnduranceAthlete();
}

// Uncomment to run examples
// runAllExamples();
