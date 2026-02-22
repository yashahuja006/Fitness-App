# Meal Filtering Service

## Overview

The Meal Filtering Service provides comprehensive filtering capabilities for meal planning based on cooking time preferences and cuisine preferences. It integrates seamlessly with the ingredient database and meal variation algorithms to filter ingredients before meal generation.

## Features

- **Cooking Time Filtering**: Filter ingredients by preparation time (quick, moderate, elaborate)
- **Cuisine Preference Filtering**: Filter by multiple cuisine types
- **Diet Type Filtering**: Filter by dietary restrictions
- **Allergen Filtering**: Exclude ingredients with specific allergens
- **Multi-Filter Support**: Apply multiple filters simultaneously
- **Statistics & Validation**: Get insights about filtered results

## Cooking Time Categories

| Category | Time Range | Description |
|----------|------------|-------------|
| `quick` | ≤15 minutes | Fast meals for busy schedules |
| `moderate` | ≤30 minutes | Balanced prep time |
| `elaborate` | >30 minutes | Complex meals with longer preparation |
| `any` | No limit | All cooking times accepted |

## Supported Cuisines

- American
- Italian
- Mexican
- Asian
- Indian
- Mediterranean
- Middle Eastern
- Latin American
- European
- African

## Usage

### Basic Filtering

```typescript
import { MealFilteringService, MealFilterConfig } from '@/lib/mealFilteringService';

// Filter for quick vegetarian meals with Italian cuisine
const config: MealFilterConfig = {
  dietType: 'vegetarian',
  cookingTimePreference: 'quick',
  cuisinePreferences: ['italian', 'mediterranean']
};

const filteredIngredients = MealFilteringService.getFilteredIngredientsForMealPlanning(config);
```

### Get Detailed Results

```typescript
import { getFilteredIngredients } from '@/lib/mealFilteringService';

const result = getFilteredIngredients({
  dietType: 'keto',
  cookingTimePreference: 'moderate',
  cuisinePreferences: ['american']
});

console.log(`Found ${result.filteredCount} out of ${result.totalAvailable} ingredients`);
console.log('Applied filters:', result.appliedFilters);
```

### Exclude Allergens

```typescript
const config: MealFilterConfig = {
  dietType: 'standard',
  cookingTimePreference: 'quick',
  excludeAllergens: ['dairy', 'eggs', 'nuts']
};

const safeIngredients = filterIngredients(config);
```

### Exclude Specific Ingredients

```typescript
const config: MealFilterConfig = {
  dietType: 'paleo',
  excludeIngredients: ['chicken-breast', 'salmon'], // User doesn't like these
  cuisinePreferences: ['mediterranean']
};

const ingredients = filterIngredients(config);
```

### Validate Configuration

```typescript
import { validateFilterConfig } from '@/lib/mealFilteringService';

const config: MealFilterConfig = {
  cookingTimePreference: 'quick',
  cuisinePreferences: ['italian', 'mexican']
};

const validation = validateFilterConfig(config);

if (!validation.isValid) {
  console.error('Invalid configuration:', validation.errors);
}
```

### Get Recommended Filters

```typescript
const userProfile = {
  availableTime: 20, // minutes per day
  preferredCuisines: ['italian', 'mediterranean'],
  dietType: 'vegetarian'
};

const recommended = MealFilteringService.getRecommendedFilters(userProfile);
// Returns: { cookingTimePreference: 'quick', cuisinePreferences: [...], dietType: 'vegetarian' }
```

### Get Filter Statistics

```typescript
const result = getFilteredIngredients({
  dietType: 'vegan',
  cookingTimePreference: 'quick'
});

const stats = MealFilteringService.getFilterStatistics(result);

console.log('Filter efficiency:', stats.filterEfficiency);
console.log('Ingredients by category:', stats.categoryCounts);
console.log('Ingredients by cuisine:', stats.cuisineCounts);
```

### Get Available Cuisines

```typescript
const filteredIngredients = filterIngredients({
  dietType: 'vegetarian',
  cookingTimePreference: 'moderate'
});

const availableCuisines = MealFilteringService.getAvailableCuisines(filteredIngredients);
console.log('Available cuisines:', availableCuisines);
```

## Integration with Meal Variation Algorithms

The filtering service integrates seamlessly with the meal variation system:

```typescript
import { generateMealVariation, MealVariationConfig } from '@/lib/mealVariationAlgorithms';

const config: MealVariationConfig = {
  tier: 'pro',
  dietType: 'mediterranean',
  targetMacros: {
    calories: 500,
    protein: 30,
    carbohydrates: 50,
    fats: 15,
    fiber: 10
  },
  mealType: 'lunch',
  dayNumber: 1,
  cookingTimePreference: 'quick', // Filters ingredients before meal generation
  cuisinePreferences: ['mediterranean', 'italian']
};

const meal = generateMealVariation(config);
```

## API Reference

### MealFilteringService

#### Static Methods

##### `filterByCookingTime(ingredients, preference)`
Filter ingredients by cooking time preference.

**Parameters:**
- `ingredients: Ingredient[]` - Array of ingredients to filter
- `preference: CookingTimePreference` - Time preference ('quick', 'moderate', 'elaborate', 'any')

**Returns:** `Ingredient[]`

##### `filterByCuisinePreferences(ingredients, cuisinePreferences)`
Filter ingredients by cuisine preferences.

**Parameters:**
- `ingredients: Ingredient[]` - Array of ingredients to filter
- `cuisinePreferences: CuisineType[]` - Array of preferred cuisines

**Returns:** `Ingredient[]`

##### `filterByDietType(ingredients, dietType)`
Filter ingredients by diet type.

**Parameters:**
- `ingredients: Ingredient[]` - Array of ingredients to filter
- `dietType: DietType` - Diet type to filter by

**Returns:** `Ingredient[]`

##### `applyFilters(config, sourceIngredients?)`
Apply all filters based on configuration.

**Parameters:**
- `config: MealFilterConfig` - Filter configuration
- `sourceIngredients?: Ingredient[]` - Optional source ingredients (defaults to full database)

**Returns:** `FilteredIngredientsResult`

##### `getFilteredIngredientsForMealPlanning(config)`
Get filtered ingredients for meal planning.

**Parameters:**
- `config: MealFilterConfig` - Filter configuration

**Returns:** `Ingredient[]`

##### `validateFilterConfig(config)`
Validate filter configuration.

**Parameters:**
- `config: MealFilterConfig` - Configuration to validate

**Returns:** `{ isValid: boolean; errors: string[] }`

##### `getRecommendedFilters(userProfile)`
Get recommended filters based on user profile.

**Parameters:**
- `userProfile: { availableTime?: number; preferredCuisines?: CuisineType[]; dietType?: DietType }`

**Returns:** `MealFilterConfig`

##### `getCookingTimeDescription(preference)`
Get human-readable description of cooking time preference.

**Parameters:**
- `preference: CookingTimePreference`

**Returns:** `string`

##### `getAvailableCuisines(ingredients)`
Get list of available cuisines from ingredients.

**Parameters:**
- `ingredients: Ingredient[]`

**Returns:** `CuisineType[]`

##### `getFilterStatistics(result)`
Get statistics about filtered ingredients.

**Parameters:**
- `result: FilteredIngredientsResult`

**Returns:** Statistics object with counts and efficiency metrics

### Convenience Functions

#### `filterIngredients(config, sourceIngredients?)`
Shorthand for `MealFilteringService.getFilteredIngredientsForMealPlanning()`

#### `getFilteredIngredients(config, sourceIngredients?)`
Shorthand for `MealFilteringService.applyFilters()`

#### `validateFilterConfig(config)`
Shorthand for `MealFilteringService.validateFilterConfig()`

## Types

### MealFilterConfig

```typescript
interface MealFilterConfig {
  dietType?: DietType;
  cookingTimePreference?: CookingTimePreference;
  cuisinePreferences?: CuisineType[];
  excludeAllergens?: string[];
  excludeIngredients?: string[];
}
```

### FilteredIngredientsResult

```typescript
interface FilteredIngredientsResult {
  ingredients: Ingredient[];
  appliedFilters: {
    cookingTime?: CookingTimePreference;
    cuisines?: CuisineType[];
    dietType?: DietType;
  };
  totalAvailable: number;
  filteredCount: number;
}
```

### CookingTimePreference

```typescript
type CookingTimePreference = 'quick' | 'moderate' | 'elaborate' | 'any';
```

## Examples

### Example 1: Quick Keto Meals

```typescript
const ketoQuickMeals = filterIngredients({
  dietType: 'keto',
  cookingTimePreference: 'quick'
});

console.log(`Found ${ketoQuickMeals.length} quick keto ingredients`);
```

### Example 2: Mediterranean Cuisine with No Dairy

```typescript
const mediterraneanNoDairy = filterIngredients({
  dietType: 'mediterranean',
  cookingTimePreference: 'moderate',
  cuisinePreferences: ['mediterranean', 'italian'],
  excludeAllergens: ['dairy']
});
```

### Example 3: Vegan Asian Cuisine

```typescript
const veganAsian = getFilteredIngredients({
  dietType: 'vegan',
  cuisinePreferences: ['asian', 'indian'],
  cookingTimePreference: 'any'
});

console.log('Filter statistics:', MealFilteringService.getFilterStatistics(veganAsian));
```

### Example 4: User Preference-Based Filtering

```typescript
// User has 25 minutes available and likes Italian food
const userConfig = MealFilteringService.getRecommendedFilters({
  availableTime: 25,
  preferredCuisines: ['italian'],
  dietType: 'vegetarian'
});

const ingredients = filterIngredients(userConfig);
```

## Best Practices

1. **Always validate configuration** before applying filters to catch errors early
2. **Use recommended filters** for user profiles to provide smart defaults
3. **Check filter statistics** to ensure sufficient ingredients remain after filtering
4. **Combine with meal variation algorithms** for complete meal planning
5. **Handle empty results** gracefully when filters are too restrictive

## Performance Considerations

- Filtering is performed in-memory and is very fast
- Multiple filters are applied sequentially for clarity
- Consider caching filtered results for frequently used configurations
- The ingredient database is small enough that performance is not a concern

## Testing

Comprehensive tests are available in `src/__tests__/mealFilteringService.test.ts`:

```bash
npm test -- mealFilteringService.test.ts
```

Tests cover:
- Individual filter functions
- Combined filter application
- Edge cases and error handling
- Integration with all diet types
- Validation logic
- Statistics and metadata

## Related Documentation

- [Ingredient Database](./README-ingredientDatabase.md)
- [Meal Variation Algorithms](./README-mealVariationAlgorithms.md)
- [Diet Compliance Service](./README-dietCompliance.md)

## Future Enhancements

Potential improvements for future versions:

1. **Seasonal filtering** - Filter by seasonal availability
2. **Cost-based filtering** - Filter by budget constraints
3. **Nutritional filtering** - Filter by specific macro/micro nutrient targets
4. **Popularity scoring** - Rank ingredients by user preferences
5. **Smart substitutions** - Suggest alternatives when filters are too restrictive
