# Diet Type Compliance Service

## Overview

The Diet Compliance Service validates meal plans and ingredients against diet type restrictions to ensure strict adherence to dietary preferences. This service is a critical component of the AI Nutrition Engine that guarantees all generated meal plans comply with user dietary requirements.

## Features

- **Ingredient Validation**: Check individual ingredients against diet restrictions
- **Meal Validation**: Validate complete meals for diet compliance
- **Meal Plan Validation**: Validate entire meal plans across multiple meals
- **Smart Substitutions**: Find diet-compliant alternatives for non-compliant ingredients
- **Detailed Reporting**: Generate comprehensive compliance reports with violations and warnings
- **Diet Information**: Access detailed information about each diet type

## Supported Diet Types

1. **Standard**: No restrictions - all ingredients allowed
2. **Vegetarian**: No meat, poultry, or fish. Eggs and dairy allowed.
3. **Vegan**: No animal products including meat, dairy, eggs, or honey
4. **Keto**: Very low carb (<50g/day), high fat, moderate protein
5. **Paleo**: No grains, legumes, dairy, or processed foods
6. **Mediterranean**: Emphasis on fish, olive oil, vegetables, whole grains
7. **Gluten-Free**: No gluten-containing grains
8. **Dairy-Free**: No dairy products

## Usage Examples

### Validate a Single Ingredient

```typescript
import { validateIngredientCompliance } from '@/lib/dietComplianceService';

// Check if chicken breast is vegetarian-compliant
const result = validateIngredientCompliance('chicken-breast', 'vegetarian');

if (!result.isCompliant) {
  console.log('Violations:', result.violations);
  // Output: Chicken Breast is not compatible with vegetarian diet
}
```

### Validate a Complete Meal

```typescript
import { validateMealCompliance, type Meal } from '@/lib/dietComplianceService';

const meal: Meal = {
  id: 'breakfast',
  name: 'Vegan Breakfast Bowl',
  ingredients: [
    { ingredientId: 'tofu-firm', amount: 150 },
    { ingredientId: 'quinoa', amount: 100 },
    { ingredientId: 'avocado', amount: 50 },
  ],
};

const result = validateMealCompliance(meal, 'vegan');

if (result.isCompliant) {
  console.log('✓ Meal is vegan-compliant');
}

if (result.warnings.length > 0) {
  console.log('Warnings:', result.warnings);
}
```

### Validate a Meal Plan

```typescript
import { validateMealPlanCompliance, type MealPlan } from '@/lib/dietComplianceService';

const mealPlan: MealPlan = {
  dietType: 'vegetarian',
  meals: [
    {
      id: 'breakfast',
      name: 'Breakfast',
      ingredients: [
        { ingredientId: 'eggs-whole', amount: 100 },
        { ingredientId: 'oats', amount: 50 },
      ],
    },
    {
      id: 'lunch',
      name: 'Lunch',
      ingredients: [
        { ingredientId: 'tofu-firm', amount: 150 },
        { ingredientId: 'quinoa', amount: 100 },
      ],
    },
  ],
};

const result = validateMealPlanCompliance(mealPlan);

console.log(`Compliant: ${result.isCompliant}`);
console.log(`Violations: ${result.violations.length}`);
console.log(`Warnings: ${result.warnings.length}`);
```

### Find Diet-Compliant Substitutes

```typescript
import { findDietCompliantSubstitutes } from '@/lib/dietComplianceService';

// Find vegan substitutes for chicken breast
const substitutes = findDietCompliantSubstitutes('chicken-breast', 'vegan', 5);

substitutes.forEach(substitute => {
  console.log(`- ${substitute.name}`);
  console.log(`  Protein: ${substitute.macros.protein}g`);
  console.log(`  Calories: ${substitute.macros.calories}`);
});

// Output might include: Tofu, Tempeh, Lentils, etc.
```

### Generate Compliance Report

```typescript
import { generateComplianceReport } from '@/lib/dietComplianceService';

const report = generateComplianceReport(mealPlan);

console.log(report.summary);
// "✓ Meal plan is fully compliant with Vegetarian diet"

console.log('Diet Info:', report.dietInfo);
// { name: 'Vegetarian', description: '...', restrictions: [...], benefits: [...] }

if (report.substitutionSuggestions.length > 0) {
  console.log('Suggested Substitutions:');
  report.substitutionSuggestions.forEach(suggestion => {
    console.log(`Replace ${suggestion.originalIngredient} with:`);
    suggestion.substitutes.forEach(sub => console.log(`  - ${sub.name}`));
  });
}
```

### Check Ingredient Compatibility

```typescript
import { isIngredientCompatible } from '@/lib/dietComplianceService';
import { getIngredientById } from '@/data/ingredientDatabase';

const ingredient = getIngredientById('salmon');

if (ingredient) {
  const isVeganCompatible = isIngredientCompatible(ingredient, 'vegan');
  const isKetoCompatible = isIngredientCompatible(ingredient, 'keto');
  
  console.log(`Salmon - Vegan: ${isVeganCompatible}, Keto: ${isKetoCompatible}`);
  // Output: Salmon - Vegan: false, Keto: true
}
```

### Get Compatible Ingredients

```typescript
import { getCompatibleIngredients } from '@/lib/dietComplianceService';

// Get all vegan-compatible ingredients
const veganIngredients = getCompatibleIngredients('vegan');

console.log(`Found ${veganIngredients.length} vegan ingredients`);

// Filter by category
const veganProteins = veganIngredients.filter(ing => ing.category === 'protein');
console.log(`Vegan protein sources: ${veganProteins.length}`);
```

### Get Diet Type Information

```typescript
import { getDietTypeInfo } from '@/lib/dietComplianceService';

const ketoInfo = getDietTypeInfo('keto');

console.log(`Diet: ${ketoInfo.name}`);
console.log(`Description: ${ketoInfo.description}`);
console.log('Restrictions:', ketoInfo.restrictions);
console.log('Benefits:', ketoInfo.benefits);
```

### Compare Diet Restrictiveness

```typescript
import { isDietMoreRestrictive } from '@/lib/dietComplianceService';

const isVeganMoreRestrictive = isDietMoreRestrictive('vegan', 'vegetarian');
console.log(`Vegan more restrictive than vegetarian: ${isVeganMoreRestrictive}`);
// Output: true
```

## API Reference

### Core Validation Functions

#### `validateIngredientCompliance(ingredientId: string, dietType: DietType): DietComplianceResult`

Validates a single ingredient against diet restrictions.

**Returns:**
- `isCompliant`: boolean indicating if ingredient is compliant
- `violations`: array of specific violations
- `warnings`: array of warning messages

#### `validateMealCompliance(meal: Meal, dietType: DietType): DietComplianceResult`

Validates all ingredients in a meal against diet restrictions.

#### `validateMealPlanCompliance(mealPlan: MealPlan): DietComplianceResult`

Validates an entire meal plan including all meals.

### Helper Functions

#### `isIngredientCompatible(ingredient: Ingredient, dietType: DietType): boolean`

Quick check if an ingredient is compatible with a diet type.

#### `getCompatibleIngredients(dietType: DietType): Ingredient[]`

Returns all ingredients compatible with a specific diet type.

#### `findDietCompliantSubstitutes(ingredientId: string, dietType: DietType, maxResults?: number): Ingredient[]`

Finds suitable substitutes for a non-compliant ingredient.

#### `getDietTypeInfo(dietType: DietType): DietInfo`

Returns detailed information about a diet type.

#### `isDietMoreRestrictive(dietType1: DietType, dietType2: DietType): boolean`

Compares the restrictiveness of two diet types.

#### `generateComplianceReport(mealPlan: MealPlan): ComplianceReport`

Generates a comprehensive compliance report with substitution suggestions.

## Types

### `DietComplianceResult`

```typescript
interface DietComplianceResult {
  isCompliant: boolean;
  violations: DietViolation[];
  warnings: string[];
}
```

### `DietViolation`

```typescript
interface DietViolation {
  ingredientId: string;
  ingredientName: string;
  dietType: DietType;
  reason: string;
  severity: 'error' | 'warning';
}
```

### `Meal`

```typescript
interface Meal {
  id: string;
  name: string;
  ingredients: MealIngredient[];
}
```

### `MealPlan`

```typescript
interface MealPlan {
  meals: Meal[];
  dietType: DietType;
}
```

## Diet Restriction Rules

### Vegetarian
- **Excluded**: All meat, poultry, and fish
- **Allowed**: Eggs, dairy, plant-based foods
- **Use Case**: Users who avoid meat but consume animal products

### Vegan
- **Excluded**: All animal products (meat, dairy, eggs, honey)
- **Allowed**: Only plant-based foods
- **Use Case**: Users following strict plant-based diet

### Keto
- **Restriction**: Very low carb (<50g/day)
- **Focus**: High fat, moderate protein
- **Warnings**: Triggers warnings for high-carb ingredients
- **Use Case**: Users seeking ketosis for fat loss

### Paleo
- **Excluded**: Grains, legumes, dairy, processed foods
- **Allowed**: Meat, fish, vegetables, fruits, nuts, seeds
- **Use Case**: Users following ancestral eating patterns

### Mediterranean
- **Emphasis**: Fish, olive oil, vegetables, whole grains
- **Limited**: Red meat
- **Use Case**: Users seeking heart-healthy eating pattern

### Gluten-Free
- **Excluded**: Wheat, barley, rye, and gluten-containing grains
- **Use Case**: Users with celiac disease or gluten sensitivity

### Dairy-Free
- **Excluded**: All dairy products (milk, cheese, yogurt)
- **Use Case**: Users with lactose intolerance or dairy allergies

## Integration with Meal Planning

The Diet Compliance Service integrates seamlessly with the meal planning system:

1. **Pre-Generation Filtering**: Filter ingredient database before generating meals
2. **Post-Generation Validation**: Validate generated meal plans for compliance
3. **Automatic Substitution**: Replace non-compliant ingredients with suitable alternatives
4. **User Feedback**: Provide clear error messages and warnings to users

## Error Handling

The service handles various error scenarios:

- **Missing Ingredients**: Returns error violation for non-existent ingredient IDs
- **Empty Meals**: Treats empty meals as compliant
- **Multiple Violations**: Reports all violations in a single validation
- **Macro Warnings**: Provides warnings for borderline cases (e.g., high carbs on keto)

## Performance Considerations

- **Efficient Filtering**: Uses indexed lookups for ingredient compatibility
- **Batch Validation**: Validates entire meal plans in single pass
- **Cached Results**: Diet type information is statically defined
- **Minimal Computation**: Macro calculations only when needed

## Testing

Comprehensive test suite covers:
- All diet types
- Individual ingredient validation
- Meal and meal plan validation
- Substitution finding
- Edge cases (empty meals, multiple violations)
- Diet information retrieval

Run tests:
```bash
npm test -- dietComplianceService.test.ts
```

## Future Enhancements

Potential improvements:
- Custom diet type definitions
- Allergen-specific validation
- Nutritional adequacy checks
- Macro balance validation
- Micronutrient compliance
- Religious dietary restrictions (Halal, Kosher)

## Related Services

- **Ingredient Database**: Source of ingredient data and compatibility
- **Meal Structure Generator**: Uses compliance service for ingredient selection
- **Macro Intelligence System**: Coordinates with compliance for macro targets
- **AI Nutrition Engine**: Main consumer of compliance validation

## Support

For issues or questions about the Diet Compliance Service, refer to:
- Design document: `.kiro/specs/ai-nutrition-engine/design.md`
- Requirements: `.kiro/specs/ai-nutrition-engine/requirements.md`
- Test suite: `src/__tests__/dietComplianceService.test.ts`
