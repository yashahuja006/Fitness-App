# Meal Variation Algorithms

## Overview

The Meal Variation Algorithms service generates meal plans with appropriate variety based on subscription tier. It ensures Free tier users get a simple 3-day rotation while Pro users enjoy advanced 7+ day variety with ingredient substitutions and seasonal variations.

## Features

### Free Tier
- **3-day meal rotation**: Simple, repeating meal pattern
- **Basic variety**: Limited ingredient selection
- **No substitutions**: Fixed meal components
- **Consistent macros**: Maintains nutritional targets
- **Upgrade prompts**: Clear messaging about Pro benefits

### Pro Tier
- **7-day meal rotation**: Full week of unique meals
- **Advanced variety**: Extensive ingredient selection
- **Ingredient substitutions**: Alternative options for preferences
- **Seasonal variations**: Seasonal ingredient recommendations
- **Macro cycling support**: Training vs rest day variations
- **Enhanced customization**: Cuisine preferences, cooking time filters

## Core Types

### MealVariationConfig
```typescript
interface MealVariationConfig {
  tier: SubscriptionTier;           // 'free' | 'pro'
  dietType: DietType;                // Diet restrictions
  targetMacros: MacroDistribution;   // Nutritional targets
  mealType: MealType;                // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  dayNumber: number;                 // 1-7 for Pro, 1-3 for Free
  season?: Season;                   // Optional seasonal preferences
  excludeIngredients?: string[];     // Ingredients to avoid
  preferredCuisines?: string[];      // Cuisine preferences
}
```

### MealVariation
```typescript
interface MealVariation {
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
```

### MealVariationStrategy
```typescript
interface MealVariationStrategy {
  rotationDays: number;              // 3 for Free, 7 for Pro
  varietyLevel: 'low' | 'medium' | 'high';
  substitutionOptions: boolean;      // Pro only
  seasonalVariations: boolean;       // Pro only
  description: string;
}
```

## Usage

### Basic Usage - Generate Single Meal

```typescript
import { generateMealVariation } from '@/lib/mealVariationAlgorithms';

const config = {
  tier: 'free',
  dietType: 'standard',
  targetMacros: {
    calories: 500,
    protein: 40,
    carbohydrates: 50,
    fats: 15,
    fiber: 10
  },
  mealType: 'lunch',
  dayNumber: 1
};

const meal = generateMealVariation(config);
console.log(meal.name); // "Chicken Breast with Brown Rice"
console.log(meal.ingredients); // Array of ingredients with amounts
console.log(meal.macros); // Actual macro breakdown
```

### Generate Full Rotation

```typescript
import { generateMealRotation } from '@/lib/mealVariationAlgorithms';

// Free tier - generates 3 meals
const freeMeals = generateMealRotation(
  'free',
  'standard',
  targetMacros,
  'dinner'
);

console.log(freeMeals.length); // 3

// Pro tier - generates 7 meals
const proMeals = generateMealRotation(
  'pro',
  'vegetarian',
  targetMacros,
  'lunch',
  'summer' // Optional seasonal preference
);

console.log(proMeals.length); // 7
```

### Get Variation Strategy

```typescript
import { getVariationStrategy } from '@/lib/mealVariationAlgorithms';

const freeStrategy = getVariationStrategy('free');
console.log(freeStrategy.rotationDays); // 3
console.log(freeStrategy.varietyLevel); // 'low'
console.log(freeStrategy.substitutionOptions); // false

const proStrategy = getVariationStrategy('pro');
console.log(proStrategy.rotationDays); // 7
console.log(proStrategy.varietyLevel); // 'high'
console.log(proStrategy.substitutionOptions); // true
```

### Find Ingredient Substitutions (Pro Feature)

```typescript
import { findIngredientSubstitutions } from '@/lib/mealVariationAlgorithms';

// Find alternatives for chicken breast
const substitutes = findIngredientSubstitutions(
  'chicken-breast',
  'standard',
  3 // Max results
);

console.log(substitutes);
// [
//   { id: 'turkey-breast', name: 'Turkey Breast', ... },
//   { id: 'chicken-thigh', name: 'Chicken Thigh', ... },
//   { id: 'tuna', name: 'Tuna', ... }
// ]
```

### Validate Meal Variation

```typescript
import { MealVariationService } from '@/lib/mealVariationAlgorithms';

const validation = MealVariationService.validateMealVariation(
  meal,
  targetMacros,
  0.15 // 15% tolerance
);

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  // ["Protein is over target by 20%"]
}
```

### Generate Upgrade Prompt

```typescript
import { MealVariationService } from '@/lib/mealVariationAlgorithms';

// For free users on day 4+ (repeating meals)
const prompt = MealVariationService.generateUpgradePrompt(4);
console.log(prompt);
// "🌟 Upgrade to Pro for more variety! You're seeing repeated meals..."
```

## Tier Comparison

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| Rotation Days | 3 | 7+ |
| Variety Level | Low | High |
| Ingredient Substitutions | ❌ | ✅ |
| Seasonal Variations | ❌ | ✅ |
| Cuisine Preferences | ❌ | ✅ |
| Macro Cycling | ❌ | ✅ |
| Custom Exclusions | Limited | Full |

## Meal Generation Algorithm

### 1. Day Normalization
```typescript
// Free tier: Days 1-3 repeat
Day 4 → Day 1
Day 5 → Day 2
Day 6 → Day 3

// Pro tier: Days 1-7 unique
Day 8 → Day 1
Day 9 → Day 2
```

### 2. Ingredient Selection
```typescript
// Free tier: Simple rotation
Day 1: Chicken + Rice + Broccoli
Day 2: Turkey + Quinoa + Spinach
Day 3: Salmon + Sweet Potato + Asparagus
Day 4: Chicken + Rice + Broccoli (repeats)

// Pro tier: Advanced variety
Day 1: Chicken + Rice + Broccoli
Day 2: Turkey + Quinoa + Spinach
Day 3: Salmon + Sweet Potato + Asparagus
Day 4: Tuna + Brown Rice + Bell Pepper
Day 5: Tofu + Lentils + Kale
Day 6: Ground Beef + White Potato + Mushrooms
Day 7: Eggs + Oats + Blueberries
```

### 3. Macro Balancing
The algorithm selects ingredient amounts to match target macros:

```typescript
Target: 40g protein, 50g carbs, 15g fats

1. Select protein source (e.g., chicken breast: 31g protein/100g)
   → Need ~130g chicken for 40g protein

2. Select carb source (e.g., brown rice: 24g carbs/100g)
   → Need ~210g rice for 50g carbs

3. Select vegetable (standard 150g serving)
   → Adds fiber and micronutrients

4. Adjust fats if needed (add olive oil, nuts, etc.)
```

## Diet Type Compliance

The service automatically filters ingredients based on diet type:

```typescript
// Vegan meal - excludes all animal products
const veganMeal = generateMealVariation({
  tier: 'pro',
  dietType: 'vegan',
  targetMacros,
  mealType: 'lunch',
  dayNumber: 1
});
// Result: Tofu + Quinoa + Spinach + Avocado

// Keto meal - very low carb
const ketoMeal = generateMealVariation({
  tier: 'pro',
  dietType: 'keto',
  targetMacros: { calories: 500, protein: 35, carbohydrates: 8, fats: 40, fiber: 5 },
  mealType: 'dinner',
  dayNumber: 1
});
// Result: Salmon + Cauliflower + Olive Oil + Cheese
```

## Integration Examples

### With Transformation Plan

```typescript
import { generateTransformationPlan } from '@/lib/aiNutritionEngine';
import { generateMealRotation } from '@/lib/mealVariationAlgorithms';

// Generate transformation plan
const plan = generateTransformationPlan(userInput);

// Generate meal rotation for training days
const trainingMeals = generateMealRotation(
  plan.subscription_tier,
  userInput.personalMetrics.diet_type,
  plan.macro_strategy.training_day,
  'lunch'
);

// Generate meal rotation for rest days
const restMeals = generateMealRotation(
  plan.subscription_tier,
  userInput.personalMetrics.diet_type,
  plan.macro_strategy.rest_day,
  'lunch'
);
```

### With Meal Structure Generator

```typescript
import { generateMealStructure } from '@/lib/mealStructureGenerator';
import { generateMealVariation } from '@/lib/mealVariationAlgorithms';

// Generate meal structure
const structure = generateMealStructure({
  mealsPerDay: 3,
  snacksPerDay: 1,
  goal: 'fat_loss'
});

// Generate variations for each meal in structure
const mealVariations = structure.meals.map((meal, index) => {
  const mealMacros = calculateMealMacros(meal, dailyMacros);
  
  return generateMealVariation({
    tier: 'pro',
    dietType: 'standard',
    targetMacros: mealMacros,
    mealType: getMealType(meal.name),
    dayNumber: 1
  });
});
```

### With Plan Complexity Limiter

```typescript
import { limitPlanComplexity } from '@/lib/planComplexityLimiter';
import { getVariationStrategy } from '@/lib/mealVariationAlgorithms';

// Limit plan based on tier
const limitedPlan = limitPlanComplexity(plan, 'free');

// Get appropriate variation strategy
const strategy = getVariationStrategy(limitedPlan.subscription_tier);

// Generate meals according to tier limitations
const meals = generateMealRotation(
  limitedPlan.subscription_tier,
  dietType,
  macros,
  'dinner'
);

console.log(meals.length); // 3 for free, 7 for pro
```

## Advanced Features (Pro Only)

### Seasonal Variations

```typescript
import { MealVariationService } from '@/lib/mealVariationAlgorithms';

// Get seasonal ingredients
const summerIngredients = MealVariationService.getSeasonalIngredients(
  'summer',
  'mediterranean'
);

// Generate meal with seasonal preference
const summerMeal = generateMealVariation({
  tier: 'pro',
  dietType: 'mediterranean',
  targetMacros,
  mealType: 'lunch',
  dayNumber: 1,
  season: 'summer'
});
```

### Ingredient Substitutions

```typescript
// Find substitutions for dietary preferences
const substitutes = findIngredientSubstitutions(
  'chicken-breast',
  'standard',
  5
);

// Apply substitution to meal
const originalMeal = generateMealVariation(config);
const substitutedMeal = {
  ...originalMeal,
  ingredients: originalMeal.ingredients.map(ing => {
    if (ing.ingredientId === 'chicken-breast') {
      return {
        ...ing,
        ingredientId: substitutes[0].id,
        ingredientName: substitutes[0].name
      };
    }
    return ing;
  })
};
```

### Macro Cycling

```typescript
// Training day - higher carbs
const trainingDayMeal = generateMealVariation({
  tier: 'pro',
  dietType: 'standard',
  targetMacros: {
    calories: 600,
    protein: 45,
    carbohydrates: 80,
    fats: 12,
    fiber: 12
  },
  mealType: 'lunch',
  dayNumber: 1
});

// Rest day - lower carbs
const restDayMeal = generateMealVariation({
  tier: 'pro',
  dietType: 'standard',
  targetMacros: {
    calories: 400,
    protein: 45,
    carbohydrates: 20,
    fats: 20,
    fiber: 8
  },
  mealType: 'lunch',
  dayNumber: 1
});
```

## Testing

Comprehensive test suite available in `src/lib/__tests__/mealVariationAlgorithms.test.ts`:

```bash
npm test -- mealVariationAlgorithms.test.ts
```

Test coverage includes:
- ✅ Free vs Pro tier rotation days
- ✅ Variety level differences
- ✅ Day normalization
- ✅ Diet type compliance
- ✅ Ingredient exclusions
- ✅ Macro target accuracy
- ✅ Substitution finding
- ✅ Validation logic
- ✅ Upgrade prompts
- ✅ Edge cases (keto, high protein, etc.)

## Best Practices

1. **Always validate tier**: Check subscription tier before generating meals
2. **Respect diet restrictions**: Use diet type filtering for all meal generation
3. **Provide upgrade prompts**: Show Pro benefits to Free users at appropriate times
4. **Maintain macro targets**: Validate generated meals against targets
5. **Handle edge cases**: Account for very high/low macro requirements
6. **Use substitutions wisely**: Only offer substitutions to Pro users
7. **Consider seasonality**: Use seasonal ingredients when available (Pro)
8. **Track variety**: Monitor ingredient repetition across rotation

## Future Enhancements

- AI-powered meal name generation
- User preference learning
- Ingredient cost optimization
- Allergen-aware substitutions
- Recipe complexity scoring
- Meal prep batching suggestions
- Leftover utilization
- Cultural cuisine authenticity scoring

## Related Documentation

- [Meal Structure Generator](./README-mealStructureGenerator.md)
- [Diet Compliance Service](./README-dietCompliance.md)
- [Plan Complexity Limiter](./README-planComplexityLimiter.md)
- [Macro Intelligence System](./README-macroIntelligenceSystem.md)
- [Ingredient Database](../data/README-ingredientDatabase.md)
