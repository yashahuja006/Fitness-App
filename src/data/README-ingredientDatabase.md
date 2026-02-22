# Ingredient Database

## Overview

The ingredient database is a comprehensive collection of food items with detailed macro and micronutrient profiles. It supports the AI Nutrition Engine's meal planning functionality by providing accurate nutritional data for ingredients across all major diet types.

## Features

- **50+ ingredients** covering all major food categories
- **Comprehensive macro profiles** (calories, protein, carbs, fiber, fats)
- **Micronutrient data** (vitamins and minerals)
- **Diet type compatibility** (standard, vegetarian, vegan, keto, paleo, mediterranean)
- **Allergen information** for safe meal planning
- **Cuisine type tags** for cultural preferences
- **Cooking time and prep information**
- **Cost level indicators** for budget-conscious planning
- **Helper functions** for efficient filtering and searching

## Database Structure

Each ingredient contains:

```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Display name
  category: IngredientCategory;  // protein, carbohydrate, vegetable, etc.
  servingSize: ServingSize;      // Amount and unit
  macros: MacroProfile;          // Nutritional values per serving
  micronutrients?: Micronutrients; // Vitamins and minerals
  dietTypes: DietType[];         // Compatible diets
  allergens: Allergen[];         // Allergen warnings
  cuisineTypes?: CuisineType[];  // Cuisine compatibility
  costLevel: 'low' | 'medium' | 'high';
  availability: 'common' | 'specialty' | 'rare';
  cookingRequired: boolean;
  prepTime?: number;             // Minutes
  shelfLife?: number;            // Days
  tags?: string[];               // Searchable tags
  alternatives?: string[];       // Alternative ingredient IDs
}
```

## Categories

The database includes ingredients from these categories:

- **Protein**: Animal and plant-based protein sources
- **Carbohydrate**: Starchy vegetables and complex carbs
- **Vegetable**: Low-calorie, nutrient-dense vegetables
- **Fruit**: Natural sugars and vitamins
- **Fat**: Healthy fats and oils
- **Dairy**: Milk products and alternatives
- **Grain**: Whole grains and refined grains
- **Legume**: Beans, lentils, and pulses
- **Nut/Seed**: Nuts, seeds, and nut butters

## Diet Type Support

All major diet types are supported:

- **Standard**: No restrictions
- **Vegetarian**: No meat or fish
- **Vegan**: No animal products
- **Keto**: Low-carb, high-fat
- **Paleo**: Whole foods, no grains/dairy
- **Mediterranean**: Heart-healthy, olive oil-based
- **Gluten-Free**: No wheat, barley, rye
- **Dairy-Free**: No milk products

## Helper Functions

### Filter by Diet Type
```typescript
const veganIngredients = getIngredientsByDietType('vegan');
```

### Filter by Category
```typescript
const proteins = getIngredientsByCategory('protein');
```

### Exclude Allergens
```typescript
const noDairy = getIngredientsWithoutAllergens(['dairy', 'eggs']);
```

### Filter by Prep Time
```typescript
const quickMeals = getIngredientsByPrepTime(15); // ≤15 minutes
```

### Filter by Cuisine
```typescript
const mediterranean = getIngredientsByCuisine('mediterranean');
```

### Macro-Based Filtering
```typescript
const highProtein = getHighProteinIngredients(20); // ≥20g protein
const lowCarb = getLowCarbIngredients(10); // ≤10g carbs
```

### Search Functions
```typescript
const chicken = getIngredientById('chicken-breast');
const results = searchIngredientsByName('chicken');
```

## Usage Examples

### Example 1: Find Keto-Friendly Proteins
```typescript
const ketoProteins = ingredientDatabase.filter(
  i => i.category === 'protein' && 
       i.dietTypes.includes('keto') &&
       i.macros.carbohydrates <= 5
);
```

### Example 2: Quick Vegan Meals
```typescript
const quickVegan = ingredientDatabase.filter(
  i => i.dietTypes.includes('vegan') &&
       (!i.prepTime || i.prepTime <= 15) &&
       i.costLevel === 'low'
);
```

### Example 3: High-Protein Vegetarian Options
```typescript
const vegProtein = ingredientDatabase.filter(
  i => i.dietTypes.includes('vegetarian') &&
       i.macros.protein >= 15 &&
       !i.allergens.includes('dairy')
);
```

### Example 4: Mediterranean Diet Ingredients
```typescript
const mediterranean = getIngredientsByDietType('mediterranean')
  .filter(i => i.cuisineTypes?.includes('mediterranean'));
```

## Nutritional Data Standards

All nutritional values are:
- **Per 100g serving** (standardized for easy comparison)
- **Based on USDA FoodData Central** and other reliable sources
- **Rounded to 1 decimal place** for macros
- **Validated** for caloric accuracy (protein×4 + carbs×4 + fats×9)

## Integration with Meal Planning

The ingredient database integrates with:

1. **MealPlanGenerator** - Selects ingredients based on macro targets
2. **Diet Type Compliance** - Ensures meals match user restrictions
3. **Cuisine Preferences** - Filters by cultural food preferences
4. **Cooking Time Constraints** - Matches user availability
5. **Budget Optimization** - Considers cost levels
6. **Allergen Safety** - Excludes dangerous ingredients

## Extending the Database

To add new ingredients:

1. Follow the `Ingredient` interface structure
2. Ensure all required fields are populated
3. Use accurate nutritional data from reliable sources
4. Add appropriate diet type tags
5. Include allergen information
6. Add cuisine types and tags for searchability
7. Run tests to validate data integrity

## Testing

Comprehensive test suite validates:
- Database structure and completeness
- Diet type filtering accuracy
- Category organization
- Allergen exclusion
- Macro-based filtering
- Search functionality
- Nutritional accuracy
- Coverage across all diet types

Run tests:
```bash
npm test -- ingredientDatabase.test.ts
```

## Future Enhancements

Planned improvements:
- [ ] Seasonal ingredient availability
- [ ] Regional ingredient variations
- [ ] Organic vs conventional options
- [ ] Sustainability ratings
- [ ] Carbon footprint data
- [ ] Glycemic index values
- [ ] More micronutrient data
- [ ] Recipe integration
- [ ] User-submitted ingredients

## Related Files

- `src/types/ingredient.ts` - TypeScript type definitions
- `src/__tests__/ingredientDatabase.test.ts` - Test suite
- `src/lib/mealStructureGenerator.ts` - Uses ingredient database
- `.kiro/specs/ai-nutrition-engine/design.md` - System design

## License

This ingredient database is part of the Fitness App project and follows the same license terms.
