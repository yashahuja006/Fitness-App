# Meal Structure Generator

## Overview

The Meal Structure Generator creates personalized meal structures based on user preferences including meal frequency (3-6 meals per day), meal timing preferences, dietary restrictions, and macro distribution. It supports different meal structures for different goals such as intermittent fasting, traditional 3 meals, frequent small meals for muscle gain, and athlete-optimized structures.

## Features

- **Multiple Structure Types**: Traditional, Intermittent Fasting, Frequent Small Meals, Athlete, Custom
- **Meal Frequency**: Support for 3-6 meals per day
- **Snack Integration**: 0-3 snacks per day with intelligent calorie allocation
- **Workout Optimization**: Pre/post-workout meal timing and macro distribution
- **Goal-Specific Adjustments**: Calorie and macro distribution optimized for fat loss, muscle gain, recomposition, or endurance
- **Diet Type Support**: Standard, Vegetarian, Vegan, Keto, Paleo, Mediterranean
- **Validation**: Built-in validation for meal structure integrity

## Core Types

### MealStructurePreferences
```typescript
interface MealStructurePreferences {
  mealsPerDay: 3 | 4 | 5 | 6;
  snacksPerDay: 0 | 1 | 2 | 3;
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance';
  workoutTime?: 'morning' | 'afternoon' | 'evening';
  workoutDaysPerWeek?: number;
  dietType?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  intermittentFasting?: boolean;
  fastingHours?: number; // e.g., 16 for 16:8 IF
}
```

### MealStructure
```typescript
interface MealStructure {
  id: string;
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
```

### MealStructureItem
```typescript
interface MealStructureItem {
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
  priority: number;
  description: string;
}
```

## Usage

### Basic Usage

```typescript
import { generateMealStructure } from '@/lib/mealStructureGenerator';

const preferences = {
  mealsPerDay: 3,
  snacksPerDay: 1,
  goal: 'fat_loss'
};

const structure = generateMealStructure(preferences);
```

### Intermittent Fasting

```typescript
const preferences = {
  mealsPerDay: 3,
  snacksPerDay: 0,
  goal: 'fat_loss',
  intermittentFasting: true,
  fastingHours: 16
};

const structure = generateMealStructure(preferences);
console.log(structure.eatingWindow); // { start: '12:00 PM', end: '8:00 PM', durationHours: 8 }
```

### Athlete Structure with Workout Optimization

```typescript
const preferences = {
  mealsPerDay: 4,
  snacksPerDay: 2,
  goal: 'muscle_gain',
  workoutTime: 'afternoon',
  workoutDaysPerWeek: 5
};

const structure = generateMealStructure(preferences);

// Find pre/post workout meals
const preWorkoutMeal = structure.meals.find(m => m.timing.isPreWorkout);
const postWorkoutMeal = structure.meals.find(m => m.timing.isPostWorkout);
```

### Apply Structure to Macro Targets

```typescript
import { applyMealStructureToMacros } from '@/lib/mealStructureGenerator';

const dailyMacros = {
  protein: 180,
  carbohydrates: 300,
  fats: 60,
  fiber: 35,
  calories: 2400
};

const mealMacros = applyMealStructureToMacros(structure, dailyMacros);

// Get macros for specific meal
const breakfastMacros = mealMacros.get('meal-1');
console.log(breakfastMacros); // { protein: 54, carbohydrates: 90, fats: 18, ... }
```

### Validate Structure

```typescript
import { validateMealStructure } from '@/lib/mealStructureGenerator';

const validation = validateMealStructure(structure);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

## Structure Types

### Traditional (3 meals)
- **Best for**: General population, beginners
- **Meal distribution**: Breakfast 30%, Lunch 35%, Dinner 35%
- **Characteristics**: Simple, easy to follow, socially convenient

### Intermittent Fasting
- **Best for**: Fat loss, metabolic health
- **Eating window**: Typically 8 hours (16:8 protocol)
- **Characteristics**: Compressed eating window, larger meals, enhanced fat burning

### Frequent Small Meals (5-6 meals)
- **Best for**: Muscle gain, athletes, high metabolism
- **Meal distribution**: Even distribution across all meals
- **Characteristics**: Sustained energy, better nutrient absorption, easier to hit high calorie targets

### Athlete
- **Best for**: High training frequency (5+ days/week)
- **Characteristics**: Optimized around workout timing, larger post-workout meals, strategic carb placement

### Custom
- **Best for**: Unique preferences or schedules
- **Characteristics**: Flexible meal timing and distribution

## Meal Timing

### Pre-Workout Meals
- **Timing**: 1-2 hours before training
- **Macro focus**: Higher carbs (55%), moderate protein (25%), lower fat (20%)
- **Purpose**: Fuel training session, easily digestible

### Post-Workout Meals
- **Timing**: Within 30-60 minutes after training
- **Macro focus**: High protein (35%), high carbs (50%), lower fat (15%)
- **Purpose**: Recovery, muscle protein synthesis, glycogen replenishment

### Regular Meals
- **Macro focus**: Balanced distribution based on goal
- **Fat loss**: Higher protein (35%), moderate carbs (35%), moderate fat (30%)
- **Muscle gain**: Moderate protein (30%), higher carbs (45%), moderate fat (25%)
- **Endurance**: Moderate protein (25%), high carbs (55%), lower fat (20%)

## Diet Type Adjustments

### Keto
- **Macros**: 70% fat, 25% protein, 5% carbs
- **Characteristics**: Very low carb, high fat, ketogenic state

### Low Carb
- **Macros**: 45% fat, 30% protein, 25% carbs
- **Characteristics**: Reduced carbs, increased fat

### Mediterranean
- **Macros**: 35% fat (healthy fats), balanced protein and carbs
- **Characteristics**: Emphasis on olive oil, fish, whole grains

### Vegan/Vegetarian
- **Adjustment**: 10% increase in protein to account for plant protein quality
- **Considerations**: Complete protein sources, B12 supplementation

## Goal-Specific Strategies

### Fat Loss
- **Calorie distribution**: Front-loaded (larger breakfast)
- **Protein**: Higher (35%+)
- **Recommendations**: High fiber, consistent timing, satiety focus

### Muscle Gain
- **Calorie distribution**: Larger post-workout meals
- **Protein**: Moderate-high (30-35%)
- **Recommendations**: Don't skip meals, pre-bed protein, consistency

### Recomposition
- **Calorie distribution**: Balanced
- **Protein**: High (35%)
- **Recommendations**: Patient approach, track measurements not just weight

### Endurance
- **Calorie distribution**: Carb-focused around training
- **Carbs**: High (55-65%)
- **Recommendations**: Practice race-day nutrition, carb loading strategies

## Validation Rules

The validator checks for:
- Total calorie percentage equals 100% (±5% tolerance)
- Meal count between 2-6
- Snack count ≤3 (warns if >3)
- Macro percentages sum to 100% for each meal
- IF structures have eating window defined

## Integration with Other Systems

### With Macro Intelligence System
```typescript
import { generateMacroStrategy } from '@/lib/macroIntelligenceSystem';
import { generateMealStructure, applyMealStructureToMacros } from '@/lib/mealStructureGenerator';

// Generate macro strategy
const macroStrategy = generateMacroStrategy(targetCalories, metrics, bodyComposition, goal);

// Generate meal structure
const mealStructure = generateMealStructure(preferences);

// Apply structure to macros
const mealMacros = applyMealStructureToMacros(mealStructure, macroStrategy.baseDistribution);
```

### With Transformation Plan
```typescript
import { generateTransformationPlan } from '@/lib/aiNutritionEngine';

const plan = generateTransformationPlan(input);

// Use plan's macro strategy with meal structure
const preferences = {
  mealsPerDay: input.personalMetrics.meals_per_day,
  snacksPerDay: input.personalMetrics.snacks_per_day,
  goal: input.goal
};

const structure = generateMealStructure(preferences);
const mealMacros = applyMealStructureToMacros(structure, plan.macroStrategy.baseDistribution);
```

## Examples

See `src/examples/mealStructureGeneratorExample.ts` for comprehensive usage examples including:
- Traditional 3 meals for fat loss
- Intermittent fasting 16:8
- Frequent small meals for muscle gain
- Athlete structure with workout optimization
- Applying structure to macro targets
- Validation examples
- Keto diet structure
- Endurance athlete structure

## Testing

Comprehensive test suite available in `src/__tests__/mealStructureGenerator.test.ts`:
- 42 unit tests covering all functions
- Edge case testing
- Validation testing
- Integration testing with macro distribution

Run tests:
```bash
npm test -- mealStructureGenerator.test.ts
```

## Best Practices

1. **Always validate** generated structures before using them
2. **Consider user lifestyle** when selecting meal frequency
3. **Optimize around workouts** for athletes and active individuals
4. **Front-load calories** for fat loss goals
5. **Use IF cautiously** - not suitable for everyone
6. **Adjust for diet types** - especially important for keto and vegan
7. **Provide recommendations** to help users understand their structure
8. **Account for snacks** in total calorie distribution

## Future Enhancements

- Meal prep batching recommendations
- Grocery list generation based on structure
- Recipe suggestions for each meal
- Timing notifications/reminders
- Integration with calendar apps
- Adaptive adjustments based on adherence
- Cultural cuisine preferences
- Budget-conscious meal planning

## Related Documentation

- [Macro Intelligence System](./README-macroIntelligenceSystem.md)
- [Advanced Metabolic Analysis](./README-advancedMetabolicAnalysis.md)
- [Progressive Programming Engine](./README-progressiveProgrammingEngine.md)
- [AI Nutrition Engine](./README-aiNutritionEngine.md)
