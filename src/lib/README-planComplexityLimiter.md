# Plan Complexity Limiter Service

## Overview

The Plan Complexity Limiter Service is responsible for applying tier-based limitations to transformation plans in the AI Performance Nutrition & Training Engine. It ensures that free tier users receive simplified plans while Pro users get full access to advanced features.

## Purpose

This service implements the subscription tier feature gating at the plan level, automatically simplifying transformation plans based on the user's subscription tier. It maintains plan integrity while removing or simplifying pro-only features for free tier users.

## Key Features

### Free Tier Limitations

1. **3-Day Rotating Meal Plan** (vs 7-day variety for Pro)
   - Simplifies meal variety to reduce complexity
   - Maintains nutritional targets
   - Reduces meal preparation instructions

2. **No Macro Cycling**
   - Removes training day vs rest day macro variations
   - Uses consistent macro targets throughout the week

3. **No Grocery Optimization**
   - Removes smart grocery list consolidation
   - Removes cost optimization features
   - Removes bulk buying recommendations

4. **Basic Workout Split** (no periodization)
   - Converts periodized programs to linear progression
   - Simplifies exercise structure descriptions
   - Maintains progressive overload principles

5. **No Refeed Scheduling**
   - Removes strategic high-calorie refeed days
   - Maintains consistent calorie targets

### Pro Tier Features

Pro users receive full plan complexity with all advanced features:
- 7-day meal variety with no repetition
- Macro cycling for training vs rest days
- Smart grocery list optimization
- Meal prep batching strategies
- Periodized training programs
- Refeed day scheduling
- Advanced plateau prevention

## Usage

### Basic Usage

```typescript
import { limitPlanComplexity } from '@/lib/planComplexityLimiter';
import type { TransformationPlan } from '@/types/supabase-transformation-plans';

// Limit a plan based on user's subscription tier
const result = limitPlanComplexity(plan, userTier);

console.log(result.limitationsApplied); // Array of applied limitations
console.log(result.featuresRemoved);    // Array of removed features
console.log(result.plan);               // The limited plan
```

### Check if Plan is Limited

```typescript
import { isPlanLimited } from '@/lib/planComplexityLimiter';

if (isPlanLimited(plan)) {
  console.log('This is a free tier plan with limitations');
}
```

### Get Upgrade Features

```typescript
import { getUpgradeFeatures } from '@/lib/planComplexityLimiter';

const upgradeFeatures = getUpgradeFeatures(plan);
// Returns array of features that would be unlocked by upgrading
```

### Using the Class Directly

```typescript
import { PlanComplexityLimiter } from '@/lib/planComplexityLimiter';

// Limit plan complexity
const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

// Validate plan complexity matches tier
const validation = PlanComplexityLimiter.validatePlanComplexity(plan);
if (!validation.isValid) {
  console.error('Plan complexity violations:', validation.violations);
}

// Get user-friendly limitation message
const message = PlanComplexityLimiter.getLimitationMessage(result);
console.log(message);
```

## API Reference

### `limitPlanComplexity(plan, tier)`

Main function to limit plan complexity based on subscription tier.

**Parameters:**
- `plan: TransformationPlan` - The transformation plan to limit
- `tier: SubscriptionTier` - The user's subscription tier ('free' | 'pro')

**Returns:** `ComplexityLimitationResult`
```typescript
{
  plan: TransformationPlan;           // The limited plan
  limitationsApplied: string[];       // Descriptions of applied limitations
  featuresRemoved: string[];          // IDs of removed features
  tier: SubscriptionTier;             // The tier used for limiting
}
```

### `isPlanLimited(plan)`

Check if a plan has been limited (is free tier).

**Parameters:**
- `plan: TransformationPlan` - The plan to check

**Returns:** `boolean` - True if plan is free tier

### `getUpgradeFeatures(plan)`

Get list of features that would be unlocked by upgrading.

**Parameters:**
- `plan: TransformationPlan` - The plan to check

**Returns:** `string[]` - Array of feature descriptions

### `PlanComplexityLimiter.validatePlanComplexity(plan)`

Validate that a plan's complexity matches its tier.

**Parameters:**
- `plan: TransformationPlan` - The plan to validate

**Returns:**
```typescript
{
  isValid: boolean;      // True if plan complexity matches tier
  violations: string[];  // Array of violation descriptions
}
```

### `PlanComplexityLimiter.getLimitationMessage(result)`

Generate user-friendly message about plan limitations.

**Parameters:**
- `result: ComplexityLimitationResult` - The limitation result

**Returns:** `string` - User-friendly message

## Integration Examples

### In Plan Generation API

```typescript
import { limitPlanComplexity } from '@/lib/planComplexityLimiter';

export async function generateTransformationPlan(
  userProfile: UserProfileExtended
): Promise<TransformationPlan> {
  // Generate full plan with all features
  const fullPlan = await generateFullPlan(userProfile);
  
  // Apply tier-based limitations
  const result = limitPlanComplexity(
    fullPlan,
    userProfile.subscription_tier
  );
  
  // Log limitations for analytics
  if (result.limitationsApplied.length > 0) {
    console.log('Applied limitations:', result.limitationsApplied);
  }
  
  return result.plan;
}
```

### In Plan Display Component

```typescript
import { isPlanLimited, getUpgradeFeatures } from '@/lib/planComplexityLimiter';

function PlanDisplay({ plan }: { plan: TransformationPlan }) {
  const isLimited = isPlanLimited(plan);
  const upgradeFeatures = getUpgradeFeatures(plan);
  
  return (
    <div>
      <h2>Your Transformation Plan</h2>
      
      {isLimited && (
        <div className="upgrade-prompt">
          <h3>Upgrade to Pro to unlock:</h3>
          <ul>
            {upgradeFeatures.map(feature => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <button>Upgrade Now</button>
        </div>
      )}
      
      {/* Plan content */}
    </div>
  );
}
```

### In Plan Validation

```typescript
import { PlanComplexityLimiter } from '@/lib/planComplexityLimiter';

export function validatePlanBeforeSave(plan: TransformationPlan): void {
  const validation = PlanComplexityLimiter.validatePlanComplexity(plan);
  
  if (!validation.isValid) {
    throw new Error(
      `Plan complexity violations: ${validation.violations.join(', ')}`
    );
  }
}
```

## Implementation Details

### Meal Plan Simplification

The service simplifies meal plans by:
1. Maintaining the same meal structure (training day / rest day)
2. Reducing preparation instruction complexity
3. Indicating the plan is a 3-day rotation (actual meal generation would create only 3 unique days)

### Workout Plan Simplification

The service simplifies workout plans by:
1. Converting periodized progression to linear progression
2. Simplifying exercise structure descriptions
3. Removing advanced periodization terminology
4. Maintaining the core workout structure and exercises

### Macro Strategy Simplification

The service simplifies macro strategy by:
1. Removing macro cycling (training day vs rest day variations)
2. Maintaining base macro targets (protein, carbs, fats)
3. Keeping the plan nutritionally sound

### Weekly Progression Simplification

The service simplifies weekly progression by:
1. Removing refeed day scheduling
2. Maintaining calorie progression logic
3. Keeping plateau prevention flags

## Testing

The service includes comprehensive unit tests covering:
- ✅ Pro tier plans remain unchanged
- ✅ Free tier limitations are applied correctly
- ✅ Macro cycling removal
- ✅ Grocery optimization removal
- ✅ Meal plan simplification
- ✅ Workout plan simplification
- ✅ Refeed scheduling removal
- ✅ Plan validation
- ✅ Edge cases (missing fields, empty arrays)
- ✅ Plan integrity maintenance

Run tests with:
```bash
npm test -- planComplexityLimiter.test.ts
```

## Design Principles

1. **Non-Destructive**: Original plans are not mutated; a new limited plan is returned
2. **Transparent**: All limitations are tracked and reported
3. **Validated**: Plans can be validated to ensure they match their tier
4. **User-Friendly**: Clear messages explain limitations and upgrade benefits
5. **Maintainable**: Clear separation of concerns with focused methods

## Related Services

- **FeatureGatingService** (`src/lib/featureGatingService.ts`) - Controls feature access at the UI level
- **MetabolicAnalysis** (`src/lib/advancedMetabolicAnalysis.ts`) - Calculates metabolic targets
- **MacroIntelligence** (`src/lib/macroIntelligenceSystem.ts`) - Calculates macro distributions
- **ProgressiveProgramming** (`src/lib/progressiveProgrammingEngine.ts`) - Generates weekly progressions

## Future Enhancements

Potential improvements for future versions:
1. Configurable limitation levels (e.g., basic, standard, premium tiers)
2. A/B testing different limitation strategies
3. Analytics tracking for upgrade conversion
4. Gradual feature unlocking for trial users
5. Custom limitation rules per feature

## Support

For questions or issues related to plan complexity limiting:
1. Check the unit tests for usage examples
2. Review the design document in `.kiro/specs/ai-nutrition-engine/design.md`
3. See the requirements in `.kiro/specs/ai-nutrition-engine/requirements.md`
