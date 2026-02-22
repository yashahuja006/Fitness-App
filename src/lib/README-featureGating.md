# Feature Gating Service

## Overview

The Feature Gating Service controls access to features based on subscription tier (free vs pro). It provides a centralized system for managing feature availability, checking access permissions, and generating upgrade prompts.

## Features

### Free Tier
- 3-day rotating meal plan
- Basic workout split (no periodization)
- Standard macro distribution
- Basic progress tracking
- BMR & TDEE calculations
- Goal-specific calorie targets
- Protein optimization

### Pro Tier
All free tier features plus:
- 7-day meal variety with no repetition
- Macro cycling (training vs rest days)
- Carb cycling strategies
- Refeed day scheduling
- Smart grocery list optimization
- Meal prep batching strategies
- Progress projection modeling
- Advanced plateau prevention
- Periodized training programs

## Usage

### Basic Feature Checking

```typescript
import { FeatureGatingService, hasFeature } from '@/lib/featureGatingService';

// Check if user has access to a feature
const userTier = 'free';
const canUseMacroCycling = hasFeature(userTier, 'macro_cycling');
// Returns: false

const canUseBasicMealPlan = hasFeature(userTier, 'basic_meal_plan');
// Returns: true
```

### Get Available Features

```typescript
import { getAvailableFeatures } from '@/lib/featureGatingService';

// Get all available feature IDs for a tier
const freeFeatures = getAvailableFeatures('free');
// Returns: ['basic_meal_plan', 'simple_workout', 'basic_macros', ...]

const proFeatures = getAvailableFeatures('pro');
// Returns: all feature IDs
```

### Detailed Feature Access

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';

// Get detailed access information
const accessInfo = FeatureGatingService.getFeatureAccess('free', 'macro_cycling');
console.log(accessInfo);
// {
//   hasAccess: false,
//   requiresUpgrade: true,
//   upgradeMessage: "Upgrade to Pro to unlock Macro Cycling",
//   feature: { id: 'macro_cycling', name: 'Macro Cycling', ... }
// }
```

### Get Feature Set

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';

// Get complete feature breakdown
const featureSet = FeatureGatingService.getFeatureSet('free');
console.log(featureSet);
// {
//   available: [...],      // Array of available features
//   unavailable: [...],    // Array of unavailable features
//   totalCount: 18,        // Total number of features
//   availableCount: 8      // Number of available features
// }
```

### Filter by Category

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';

// Get features by category
const nutritionFeatures = FeatureGatingService.getFeaturesByCategory('pro', 'nutrition');
const trainingFeatures = FeatureGatingService.getFeaturesByCategory('pro', 'training');
const optimizationFeatures = FeatureGatingService.getFeaturesByCategory('pro', 'optimization');
const analyticsFeatures = FeatureGatingService.getFeaturesByCategory('pro', 'analytics');
```

### Check Multiple Features

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';

// Check if user has ALL specified features
const hasAllFeatures = FeatureGatingService.hasAllFeatures('free', [
  'basic_meal_plan',
  'simple_workout'
]);
// Returns: true

// Check if user has ANY of the specified features
const hasAnyFeature = FeatureGatingService.hasAnyFeature('free', [
  'macro_cycling',
  'basic_meal_plan'
]);
// Returns: true (has basic_meal_plan)
```

### Upgrade Prompts

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';

// Get upgrade benefits for current tier
const benefits = FeatureGatingService.getUpgradeBenefits('free');
// Returns: array of pro features

// Generate upgrade prompt message
const prompt = FeatureGatingService.getUpgradePrompt('macro_cycling');
// Returns: "🔒 Macro Cycling is a Pro feature. Upgrade to unlock dynamic macro adjustments based on training schedule."
```

## Feature Categories

### Nutrition
- `basic_meal_plan` - 3-day rotating meal plan (Free)
- `basic_macros` - Standard macro distribution (Free)
- `goal_specific_calories` - Goal-adjusted calories (Free)
- `protein_targets` - Optimized protein intake (Free)
- `macro_cycling` - Dynamic macro adjustments (Pro)
- `refeed_strategy` - Strategic high-calorie days (Pro)
- `seven_day_variety` - Full weekly meal variation (Pro)
- `carb_cycling` - Training day carb optimization (Pro)

### Training
- `simple_workout` - Basic workout split (Free)
- `basic_progression` - Simple progression tracking (Free)
- `advanced_progression` - Predictive adjustments (Pro)
- `plateau_prevention` - Automatic plateau detection (Pro)
- `periodized_training` - Advanced training blocks (Pro)

### Optimization
- `grocery_optimization` - Smart grocery lists (Pro)
- `meal_prep_batching` - Batch cooking strategies (Pro)

### Analytics
- `progress_tracking` - Basic progress tracking (Free)
- `bmr_tdee_calculation` - Metabolic calculations (Free)
- `progress_projection` - 8-week outcome predictions (Pro)

## React Component Example

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';
import { useUserProfile } from '@/hooks/useUserProfile';

function MacroCyclingSection() {
  const { profile } = useUserProfile();
  const tier = profile?.subscription_tier || 'free';
  
  const accessInfo = FeatureGatingService.getFeatureAccess(tier, 'macro_cycling');
  
  if (!accessInfo.hasAccess) {
    return (
      <div className="locked-feature">
        <p>{accessInfo.upgradeMessage}</p>
        <button onClick={() => navigateToUpgrade()}>
          Upgrade to Pro
        </button>
      </div>
    );
  }
  
  return (
    <div className="macro-cycling-content">
      {/* Macro cycling feature content */}
    </div>
  );
}
```

## API Integration Example

```typescript
import { FeatureGatingService } from '@/lib/featureGatingService';

// In your API route or service
export async function generateMealPlan(userId: string, userProfile: UserProfileExtended) {
  const tier = userProfile.subscription_tier;
  
  // Check if user can access macro cycling
  if (FeatureGatingService.hasFeatureAccess(tier, 'macro_cycling')) {
    // Generate meal plan with macro cycling
    return generateAdvancedMealPlan(userProfile);
  } else {
    // Generate basic meal plan
    return generateBasicMealPlan(userProfile);
  }
}
```

## Type Definitions

```typescript
type SubscriptionTier = 'free' | 'pro';

type FeatureId = 
  | 'basic_meal_plan'
  | 'simple_workout'
  | 'basic_macros'
  | 'progress_tracking'
  | 'macro_cycling'
  | 'refeed_strategy'
  | 'grocery_optimization'
  | 'meal_prep_batching'
  | 'advanced_progression'
  | 'plateau_prevention'
  | 'progress_projection'
  | 'seven_day_variety'
  | 'carb_cycling'
  | 'periodized_training'
  // ... and more

interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  tier: SubscriptionTier;
  category: 'nutrition' | 'training' | 'optimization' | 'analytics';
}

interface FeatureAccessResult {
  hasAccess: boolean;
  feature: Feature;
  requiresUpgrade: boolean;
  upgradeMessage?: string;
}

interface FeatureSet {
  available: Feature[];
  unavailable: Feature[];
  totalCount: number;
  availableCount: number;
}
```

## Testing

The service includes comprehensive unit tests covering:
- Feature access control for both tiers
- Feature listing and filtering
- Category-based queries
- Multiple feature checks
- Upgrade benefit calculations
- Validation and error handling

Run tests:
```bash
npm test -- src/lib/__tests__/featureGatingService.test.ts
```

## Best Practices

1. **Always check feature access before rendering premium features**
   ```typescript
   if (hasFeature(tier, 'macro_cycling')) {
     // Render feature
   }
   ```

2. **Use detailed access info for better UX**
   ```typescript
   const accessInfo = FeatureGatingService.getFeatureAccess(tier, featureId);
   if (!accessInfo.hasAccess) {
     showUpgradePrompt(accessInfo.upgradeMessage);
   }
   ```

3. **Cache tier information at component/page level**
   ```typescript
   const tier = useMemo(() => profile?.subscription_tier || 'free', [profile]);
   ```

4. **Validate tier before API calls**
   ```typescript
   if (!FeatureGatingService.isValidTier(tier)) {
     throw new Error('Invalid subscription tier');
   }
   ```

5. **Use category filtering for feature discovery**
   ```typescript
   const nutritionFeatures = FeatureGatingService.getFeaturesByCategory(tier, 'nutrition');
   ```

## Integration with Subscription System

The feature gating service integrates with the subscription management system:

1. User profile includes `subscription_tier` field
2. Feature access is checked based on this tier
3. Upgrade flows use `getUpgradeBenefits()` to show value
4. Payment success updates tier and unlocks features

## Future Enhancements

Potential additions:
- Feature usage analytics
- A/B testing for feature access
- Temporary feature unlocks (trials)
- Custom feature bundles
- Enterprise tier support
- Feature deprecation handling

## Related Files

- `src/types/nutrition.ts` - UserProfileExtended interface
- `src/lib/__tests__/featureGatingService.test.ts` - Test suite
- `.kiro/specs/ai-nutrition-engine/design.md` - Feature specifications
- `.kiro/specs/ai-nutrition-engine/requirements.md` - User stories
