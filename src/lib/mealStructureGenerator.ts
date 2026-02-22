/**
 * Meal Structure Generator
 * 
 * Generates personalized meal structures based on user preferences including:
 * - Meal frequency (3-6 meals per day)
 * - Meal timing preferences
 * - Dietary restrictions
 * - Macro distribution across meals
 * - Goal-specific meal structures (e.g., intermittent fasting, traditional 3 meals, frequent small meals)
 */

import { UserProfileExtended } from '../types/nutrition';
import { MacroDistribution } from './macroIntelligenceSystem';

export interface MealTiming {
  name: string;
  timeRange: string; // e.g., "7:00-9:00 AM"
  suggestedTime: string; // e.g., "8:00 AM"
  isPreWorkout?: boolean;
  isPostWorkout?: boolean;
}

export interface MealStructureItem {
  id: string;
  name: string;
  type: 'meal' | 'snack';
  timing: MealTiming;
  caloriePercentage: number; // percentage of daily calories
  macroDistribution: {
    proteinPercentage: number;
    carbPercentage: number;
    fatPercentage: number;
  };
  priority: number; // 1 = highest priority
  description: string;
}

export interface MealStructure {
  id: string;
  userId?: string;
  structureType: 'traditional' | 'intermittent_fasting' | 'frequent_small' | 'athlete' | 'custom';
  totalMeals: number;
  totalSnacks: number;
  meals: MealStructureItem[];
  snacks: MealStructureItem[];
  eatingWindow?: {
    start: string;
    end: string;
    durationHours: number;
  };
  workoutTiming?: {
    preferredTime: string;
    preWorkoutMealId?: string;
    postWorkoutMealId?: string;
  };
  recommendations: string[];
}

export interface MealStructurePreferences {
  mealsPerDay: 3 | 4 | 5 | 6;
  snacksPerDay: 0 | 1 | 2 | 3;
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance';
  workoutTime?: 'morning' | 'afternoon' | 'evening';
  workoutDaysPerWeek?: number;
  dietType?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  intermittentFasting?: boolean;
  fastingHours?: number; // e.g., 16 for 16:8 IF
}

/**
 * Determine meal structure type based on preferences
 */
export function determineMealStructureType(
  preferences: MealStructurePreferences
): 'traditional' | 'intermittent_fasting' | 'frequent_small' | 'athlete' | 'custom' {
  
  if (preferences.intermittentFasting) {
    return 'intermittent_fasting';
  }
  
  if (preferences.mealsPerDay >= 5) {
    return 'frequent_small';
  }
  
  if (preferences.workoutDaysPerWeek && preferences.workoutDaysPerWeek >= 5) {
    return 'athlete';
  }
  
  if (preferences.mealsPerDay === 3 && preferences.snacksPerDay <= 1) {
    return 'traditional';
  }
  
  return 'custom';
}

/**
 * Generate meal timing based on structure type and preferences
 */
export function generateMealTimings(
  structureType: 'traditional' | 'intermittent_fasting' | 'frequent_small' | 'athlete' | 'custom',
  mealsPerDay: number,
  workoutTime?: 'morning' | 'afternoon' | 'evening',
  fastingHours?: number
): MealTiming[] {
  
  const timings: MealTiming[] = [];
  
  if (structureType === 'intermittent_fasting') {
    // 16:8 IF - eating window typically 12pm-8pm
    const fastingHrs = fastingHours || 16;
    const eatingWindowHrs = 24 - fastingHrs;
    const startHour = 12; // noon
    
    if (mealsPerDay === 3) {
      timings.push(
        { name: 'Meal 1', timeRange: '12:00-1:00 PM', suggestedTime: '12:00 PM' },
        { name: 'Meal 2', timeRange: '3:00-4:00 PM', suggestedTime: '3:30 PM' },
        { name: 'Meal 3', timeRange: '7:00-8:00 PM', suggestedTime: '7:30 PM' }
      );
    } else if (mealsPerDay === 2) {
      timings.push(
        { name: 'Meal 1', timeRange: '12:00-1:00 PM', suggestedTime: '12:00 PM' },
        { name: 'Meal 2', timeRange: '7:00-8:00 PM', suggestedTime: '7:30 PM' }
      );
    }
  } else if (structureType === 'traditional') {
    timings.push(
      { name: 'Breakfast', timeRange: '7:00-9:00 AM', suggestedTime: '8:00 AM' },
      { name: 'Lunch', timeRange: '12:00-1:00 PM', suggestedTime: '12:30 PM' },
      { name: 'Dinner', timeRange: '6:00-8:00 PM', suggestedTime: '7:00 PM' }
    );
  } else if (structureType === 'frequent_small') {
    // 5-6 smaller meals throughout the day
    if (mealsPerDay === 5) {
      timings.push(
        { name: 'Meal 1', timeRange: '7:00-8:00 AM', suggestedTime: '7:30 AM' },
        { name: 'Meal 2', timeRange: '10:00-11:00 AM', suggestedTime: '10:30 AM' },
        { name: 'Meal 3', timeRange: '1:00-2:00 PM', suggestedTime: '1:30 PM' },
        { name: 'Meal 4', timeRange: '4:00-5:00 PM', suggestedTime: '4:30 PM' },
        { name: 'Meal 5', timeRange: '7:00-8:00 PM', suggestedTime: '7:30 PM' }
      );
    } else if (mealsPerDay === 6) {
      timings.push(
        { name: 'Meal 1', timeRange: '7:00-8:00 AM', suggestedTime: '7:30 AM' },
        { name: 'Meal 2', timeRange: '9:30-10:30 AM', suggestedTime: '10:00 AM' },
        { name: 'Meal 3', timeRange: '12:30-1:30 PM', suggestedTime: '1:00 PM' },
        { name: 'Meal 4', timeRange: '3:30-4:30 PM', suggestedTime: '4:00 PM' },
        { name: 'Meal 5', timeRange: '6:00-7:00 PM', suggestedTime: '6:30 PM' },
        { name: 'Meal 6', timeRange: '8:30-9:30 PM', suggestedTime: '9:00 PM' }
      );
    }
  } else if (structureType === 'athlete') {
    // 4-5 meals optimized around training
    if (mealsPerDay === 4) {
      timings.push(
        { name: 'Breakfast', timeRange: '7:00-8:00 AM', suggestedTime: '7:30 AM' },
        { name: 'Pre-Workout', timeRange: '11:00-12:00 PM', suggestedTime: '11:30 AM', isPreWorkout: true },
        { name: 'Post-Workout', timeRange: '2:00-3:00 PM', suggestedTime: '2:30 PM', isPostWorkout: true },
        { name: 'Dinner', timeRange: '7:00-8:00 PM', suggestedTime: '7:30 PM' }
      );
    } else if (mealsPerDay === 5) {
      timings.push(
        { name: 'Breakfast', timeRange: '7:00-8:00 AM', suggestedTime: '7:30 AM' },
        { name: 'Mid-Morning', timeRange: '10:00-11:00 AM', suggestedTime: '10:30 AM' },
        { name: 'Lunch', timeRange: '1:00-2:00 PM', suggestedTime: '1:30 PM' },
        { name: 'Post-Workout', timeRange: '4:00-5:00 PM', suggestedTime: '4:30 PM', isPostWorkout: true },
        { name: 'Dinner', timeRange: '7:00-8:00 PM', suggestedTime: '7:30 PM' }
      );
    }
  } else {
    // Custom - evenly distribute meals
    const startHour = 7;
    const endHour = 20;
    const totalHours = endHour - startHour;
    const intervalHours = totalHours / (mealsPerDay - 1);
    
    for (let i = 0; i < mealsPerDay; i++) {
      const hour = Math.floor(startHour + (i * intervalHours));
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      
      timings.push({
        name: `Meal ${i + 1}`,
        timeRange: `${displayHour}:00-${displayHour + 1}:00 ${period}`,
        suggestedTime: `${displayHour}:00 ${period}`
      });
    }
  }
  
  // Adjust timings based on workout time
  if (workoutTime && timings.length > 0) {
    adjustTimingsForWorkout(timings, workoutTime);
  }
  
  return timings;
}

/**
 * Adjust meal timings to optimize around workout
 */
function adjustTimingsForWorkout(
  timings: MealTiming[],
  workoutTime: 'morning' | 'afternoon' | 'evening'
): void {
  
  if (workoutTime === 'morning') {
    // Mark first meal as pre-workout, second as post-workout
    if (timings.length >= 2) {
      timings[0].isPreWorkout = true;
      timings[1].isPostWorkout = true;
    }
  } else if (workoutTime === 'afternoon') {
    // Mark middle meals
    const midIndex = Math.floor(timings.length / 2);
    if (midIndex > 0 && midIndex < timings.length - 1) {
      timings[midIndex - 1].isPreWorkout = true;
      timings[midIndex].isPostWorkout = true;
    }
  } else if (workoutTime === 'evening') {
    // Mark later meals
    if (timings.length >= 2) {
      timings[timings.length - 2].isPreWorkout = true;
      timings[timings.length - 1].isPostWorkout = true;
    }
  }
}

/**
 * Calculate calorie distribution across meals based on goal
 */
export function calculateMealCalorieDistribution(
  mealsPerDay: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance',
  structureType: 'traditional' | 'intermittent_fasting' | 'frequent_small' | 'athlete' | 'custom'
): number[] {
  
  const distribution: number[] = [];
  
  if (structureType === 'traditional' && mealsPerDay === 3) {
    // Traditional: Breakfast 30%, Lunch 35%, Dinner 35%
    distribution.push(0.30, 0.35, 0.35);
  } else if (structureType === 'intermittent_fasting') {
    if (mealsPerDay === 2) {
      // IF 2 meals: 45%, 55%
      distribution.push(0.45, 0.55);
    } else if (mealsPerDay === 3) {
      // IF 3 meals: 30%, 35%, 35%
      distribution.push(0.30, 0.35, 0.35);
    }
  } else if (structureType === 'frequent_small') {
    // Evenly distribute for frequent small meals
    const percentage = 1.0 / mealsPerDay;
    for (let i = 0; i < mealsPerDay; i++) {
      distribution.push(percentage);
    }
    // Return early to avoid goal-specific adjustments for frequent small meals
    return distribution;
  } else if (structureType === 'athlete') {
    // Athlete: Larger meals around workout
    if (mealsPerDay === 4) {
      distribution.push(0.20, 0.25, 0.30, 0.25); // Larger post-workout
    } else if (mealsPerDay === 5) {
      distribution.push(0.20, 0.15, 0.25, 0.25, 0.15); // Larger lunch and post-workout
    }
  } else {
    // Custom: Even distribution
    const percentage = 1.0 / mealsPerDay;
    for (let i = 0; i < mealsPerDay; i++) {
      distribution.push(percentage);
    }
  }
  
  // Adjust for goal-specific needs
  if (goal === 'muscle_gain' && distribution.length >= 3) {
    // Increase post-workout meal
    const postWorkoutIndex = Math.floor(distribution.length / 2);
    distribution[postWorkoutIndex] += 0.05;
    distribution[0] -= 0.05;
  } else if (goal === 'fat_loss' && distribution.length >= 3) {
    // Front-load calories
    distribution[0] += 0.05;
    distribution[distribution.length - 1] -= 0.05;
  }
  
  return distribution;
}

/**
 * Calculate macro distribution for each meal based on timing and goal
 */
export function calculateMealMacroDistribution(
  mealTiming: MealTiming,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance',
  dietType?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean'
): { proteinPercentage: number; carbPercentage: number; fatPercentage: number } {
  
  // Base distribution
  let protein = 30;
  let carbs = 40;
  let fats = 30;
  
  // Adjust for meal timing
  if (mealTiming.isPreWorkout) {
    // Pre-workout: Higher carbs, moderate protein, lower fat
    protein = 25;
    carbs = 55;
    fats = 20;
  } else if (mealTiming.isPostWorkout) {
    // Post-workout: High carbs, high protein, lower fat
    protein = 35;
    carbs = 50;
    fats = 15;
  }
  
  // Adjust for goal
  if (goal === 'fat_loss') {
    protein += 5;
    carbs -= 5;
  } else if (goal === 'muscle_gain') {
    carbs += 5;
    fats -= 5;
  } else if (goal === 'endurance') {
    carbs += 10;
    protein -= 5;
    fats -= 5;
  }
  
  // Adjust for diet type
  if (dietType === 'keto') {
    protein = 25;
    carbs = 5;
    fats = 70;
  } else if (dietType === 'paleo') {
    protein += 5;
    carbs -= 5;
  }
  
  // Ensure percentages add up to 100
  const total = protein + carbs + fats;
  protein = Math.round((protein / total) * 100);
  carbs = Math.round((carbs / total) * 100);
  fats = 100 - protein - carbs;
  
  return {
    proteinPercentage: protein,
    carbPercentage: carbs,
    fatPercentage: fats
  };
}

/**
 * Generate snack structure
 */
export function generateSnackStructure(
  snacksPerDay: number,
  mealTimings: MealTiming[],
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): MealStructureItem[] {
  
  const snacks: MealStructureItem[] = [];
  
  if (snacksPerDay === 0) {
    return snacks;
  }
  
  // Allocate remaining calories to snacks (after meals take their share)
  // Typically 5-10% per snack depending on number of snacks
  const totalSnackPercentage = Math.min(0.20, snacksPerDay * 0.08); // Max 20% for all snacks
  const snackCaloriePercentage = totalSnackPercentage / snacksPerDay;
  
  for (let i = 0; i < snacksPerDay; i++) {
    const snackTiming: MealTiming = {
      name: `Snack ${i + 1}`,
      timeRange: 'Flexible',
      suggestedTime: 'Between meals'
    };
    
    // Snacks: Higher protein for satiety
    const macroDistribution = {
      proteinPercentage: 40,
      carbPercentage: 35,
      fatPercentage: 25
    };
    
    snacks.push({
      id: `snack-${i + 1}`,
      name: `Snack ${i + 1}`,
      type: 'snack',
      timing: snackTiming,
      caloriePercentage: snackCaloriePercentage,
      macroDistribution,
      priority: 10 + i,
      description: 'Optional snack for sustained energy and satiety'
    });
  }
  
  return snacks;
}

/**
 * Generate complete meal structure
 */
export function generateMealStructure(
  preferences: MealStructurePreferences,
  profile?: UserProfileExtended
): MealStructure {
  
  const structureType = determineMealStructureType(preferences);
  
  const mealTimings = generateMealTimings(
    structureType,
    preferences.mealsPerDay,
    preferences.workoutTime,
    preferences.fastingHours
  );
  
  // Generate snacks first to know how much to allocate to meals
  const snacks = generateSnackStructure(
    preferences.snacksPerDay,
    mealTimings,
    preferences.goal
  );
  
  // Calculate total snack percentage
  const totalSnackPercentage = snacks.reduce((sum, snack) => sum + snack.caloriePercentage, 0);
  
  // Remaining percentage for meals
  const remainingForMeals = 1.0 - totalSnackPercentage;
  
  const calorieDistribution = calculateMealCalorieDistribution(
    preferences.mealsPerDay,
    preferences.goal,
    structureType
  );
  
  // Adjust meal distribution to account for snacks
  const adjustedCalorieDistribution = calorieDistribution.map(pct => pct * remainingForMeals);
  
  const meals: MealStructureItem[] = mealTimings.map((timing, index) => {
    const macroDistribution = calculateMealMacroDistribution(
      timing,
      preferences.goal,
      preferences.dietType
    );
    
    return {
      id: `meal-${index + 1}`,
      name: timing.name,
      type: 'meal',
      timing,
      caloriePercentage: adjustedCalorieDistribution[index] || (remainingForMeals / preferences.mealsPerDay),
      macroDistribution,
      priority: index + 1,
      description: generateMealDescription(timing, preferences.goal)
    };
  });
  
  // Calculate eating window for IF
  let eatingWindow: MealStructure['eatingWindow'];
  if (structureType === 'intermittent_fasting' && preferences.fastingHours) {
    const eatingHours = 24 - preferences.fastingHours;
    eatingWindow = {
      start: mealTimings[0]?.suggestedTime || '12:00 PM',
      end: mealTimings[mealTimings.length - 1]?.suggestedTime || '8:00 PM',
      durationHours: eatingHours
    };
  }
  
  // Identify workout timing
  let workoutTiming: MealStructure['workoutTiming'];
  if (preferences.workoutTime) {
    const preWorkoutMeal = meals.find(m => m.timing.isPreWorkout);
    const postWorkoutMeal = meals.find(m => m.timing.isPostWorkout);
    
    workoutTiming = {
      preferredTime: preferences.workoutTime,
      preWorkoutMealId: preWorkoutMeal?.id,
      postWorkoutMealId: postWorkoutMeal?.id
    };
  }
  
  const recommendations = generateMealStructureRecommendations(
    structureType,
    preferences,
    meals,
    snacks
  );
  
  return {
    id: `structure-${Date.now()}`,
    userId: profile?.subscription_tier,
    structureType,
    totalMeals: preferences.mealsPerDay,
    totalSnacks: preferences.snacksPerDay,
    meals,
    snacks,
    eatingWindow,
    workoutTiming,
    recommendations
  };
}

/**
 * Generate meal description based on timing and goal
 */
function generateMealDescription(
  timing: MealTiming,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): string {
  
  if (timing.isPreWorkout) {
    return 'Pre-workout meal: Focus on easily digestible carbs and moderate protein';
  }
  
  if (timing.isPostWorkout) {
    return 'Post-workout meal: High protein and carbs for recovery and muscle growth';
  }
  
  if (timing.name.toLowerCase().includes('breakfast')) {
    return 'Start your day with balanced nutrition to fuel morning activities';
  }
  
  if (timing.name.toLowerCase().includes('dinner')) {
    return 'Evening meal: Focus on protein and vegetables, moderate carbs';
  }
  
  return 'Balanced meal to support your daily nutrition goals';
}

/**
 * Generate recommendations for meal structure
 */
function generateMealStructureRecommendations(
  structureType: 'traditional' | 'intermittent_fasting' | 'frequent_small' | 'athlete' | 'custom',
  preferences: MealStructurePreferences,
  meals: MealStructureItem[],
  snacks: MealStructureItem[]
): string[] {
  
  const recommendations: string[] = [];
  
  if (structureType === 'intermittent_fasting') {
    recommendations.push('Stay hydrated during fasting window with water, black coffee, or tea');
    recommendations.push('Break your fast with a balanced meal, not a large feast');
    recommendations.push('Consider electrolyte supplementation during extended fasts');
  }
  
  if (structureType === 'frequent_small') {
    recommendations.push('Prepare meals in advance to maintain consistency');
    recommendations.push('Use portion control to avoid overeating with frequent meals');
    recommendations.push('Focus on nutrient-dense foods to meet micronutrient needs');
  }
  
  if (structureType === 'athlete') {
    recommendations.push('Time your largest carb intake around training sessions');
    recommendations.push('Consume protein within 30-60 minutes post-workout');
    recommendations.push('Stay hydrated throughout the day, especially during training');
  }
  
  if (preferences.goal === 'fat_loss') {
    recommendations.push('Front-load calories earlier in the day for better satiety');
    recommendations.push('Include high-fiber foods to increase fullness');
    recommendations.push('Stay consistent with meal timing to regulate hunger hormones');
  }
  
  if (preferences.goal === 'muscle_gain') {
    recommendations.push('Ensure adequate protein at each meal (20-40g)');
    recommendations.push('Don\'t skip meals - consistency is key for muscle growth');
    recommendations.push('Consider a pre-bed protein source for overnight recovery');
  }
  
  if (preferences.goal === 'endurance') {
    recommendations.push('Prioritize carbohydrate intake around training sessions');
    recommendations.push('Practice your race-day nutrition strategy during training');
    recommendations.push('Consider carb-loading strategies before long events');
  }
  
  if (meals.some(m => m.timing.isPreWorkout)) {
    recommendations.push('Eat pre-workout meal 1-2 hours before training');
  }
  
  if (meals.some(m => m.timing.isPostWorkout)) {
    recommendations.push('Consume post-workout meal within 30-60 minutes after training');
  }
  
  return recommendations;
}

/**
 * Validate meal structure
 */
export function validateMealStructure(
  structure: MealStructure
): { isValid: boolean; errors: string[]; warnings: string[] } {
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check total calorie percentage
  const totalCaloriePercentage = [
    ...structure.meals,
    ...structure.snacks
  ].reduce((sum, item) => sum + item.caloriePercentage, 0);
  
  if (Math.abs(totalCaloriePercentage - 1.0) > 0.05) {
    errors.push(`Total calorie percentage is ${(totalCaloriePercentage * 100).toFixed(1)}%, should be 100%`);
  }
  
  // Check meal count
  if (structure.meals.length < 2 || structure.meals.length > 6) {
    errors.push('Meal count should be between 2 and 6');
  }
  
  // Check snack count
  if (structure.snacks.length > 3) {
    warnings.push('More than 3 snacks per day may be difficult to maintain');
  }
  
  // Check macro percentages for each meal
  structure.meals.forEach(meal => {
    const macroTotal = meal.macroDistribution.proteinPercentage +
                      meal.macroDistribution.carbPercentage +
                      meal.macroDistribution.fatPercentage;
    
    if (Math.abs(macroTotal - 100) > 1) {
      errors.push(`${meal.name} macro percentages don't add up to 100%`);
    }
  });
  
  // Check IF eating window
  if (structure.structureType === 'intermittent_fasting' && !structure.eatingWindow) {
    warnings.push('Intermittent fasting structure should have an eating window defined');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Apply meal structure to macro targets
 */
export function applyMealStructureToMacros(
  structure: MealStructure,
  dailyMacros: MacroDistribution
): Map<string, MacroDistribution> {
  
  const mealMacros = new Map<string, MacroDistribution>();
  
  [...structure.meals, ...structure.snacks].forEach(item => {
    const calories = dailyMacros.calories * item.caloriePercentage;
    
    const proteinCalories = calories * (item.macroDistribution.proteinPercentage / 100);
    const carbCalories = calories * (item.macroDistribution.carbPercentage / 100);
    const fatCalories = calories * (item.macroDistribution.fatPercentage / 100);
    
    mealMacros.set(item.id, {
      protein: Math.round(proteinCalories / 4),
      carbohydrates: Math.round(carbCalories / 4),
      fats: Math.round(fatCalories / 9),
      fiber: Math.round((calories / 1000) * 14),
      calories: Math.round(calories)
    });
  });
  
  return mealMacros;
}
