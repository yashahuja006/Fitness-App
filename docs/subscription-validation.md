# Subscription Status Validation System

## Overview

The subscription validation system provides comprehensive validation of subscription status, payment status, and tier access control for the AI Nutrition Engine. It includes both server-side and client-side validation with automatic tier downgrade on subscription expiry.

## Architecture

### Core Components

1. **SubscriptionValidator** (`src/lib/subscriptionValidation.ts`)
   - Core validation logic
   - Status checking
   - Grace period management
   - Tier verification

2. **Subscription Middleware** (`src/middleware/subscriptionMiddleware.ts`)
   - API route protection
   - Pro-only endpoint guards
   - Payment status validation
   - Automatic warning headers

3. **Client Validation** (`src/utils/clientSubscriptionValidation.ts`)
   - Frontend feature gating
   - Upgrade prompts
   - Status badges
   - User notifications

## Subscription Statuses

### Status Types

| Status | Description | Has Access | Should Downgrade |
|--------|-------------|------------|------------------|
| `active` | Valid, paid subscription | ✅ Yes | ❌ No |
| `trial` | Trial period | ✅ Yes | ❌ No |
| `expired` | Subscription ended | ❌ No | ✅ Yes |
| `cancelled` | Cancelled but in paid period | ✅ Yes* | ⚠️ After period end |
| `past_due` | Payment failed, in grace period | ✅ Yes* | ⚠️ After grace period |
| `incomplete` | Payment incomplete | ❌ No | ✅ Yes |

*Access continues until period/grace period ends

### Grace Period

- **Duration**: 3 days (configurable)
- **Applies to**: `past_due` status
- **Behavior**: User retains access during grace period
- **After expiry**: Automatic downgrade to free tier

## Usage

### Server-Side (API Routes)

#### Protect Pro-Only Endpoints

```typescript
import { requireProSubscription } from '../middleware/subscriptionMiddleware';

// Protect entire route
router.post('/api/transformation/generate', 
  authenticateToken,
  requireProSubscription,
  generatePlanHandler
);
```

#### Validate Subscription Status

```typescript
import { validateSubscriptionStatus } from '../middleware/subscriptionMiddleware';

router.get('/api/user/plan',
  authenticateToken,
  validateSubscriptionStatus,
  getPlanHandler
);
```

#### Require Current Payment

```typescript
import { requireCurrentPayment } from '../middleware/subscriptionMiddleware';

router.post('/api/subscription/upgrade',
  authenticateToken,
  requireCurrentPayment,
  upgradeHandler
);
```

#### Custom Tier Requirements

```typescript
import { requireTier } from '../middleware/subscriptionMiddleware';

router.get('/api/pro-features',
  authenticateToken,
  requireTier('pro'),
  proFeaturesHandler
);
```

### Client-Side (React Components)

#### Check Feature Access

```typescript
import { ClientSubscriptionValidator, PRO_FEATURES } from '@/utils/clientSubscriptionValidation';

function MacroCyclingFeature({ subscription }) {
  const access = ClientSubscriptionValidator.canAccessProFeature(
    subscription,
    PRO_FEATURES.MACRO_CYCLING
  );

  if (!access.hasAccess) {
    return <UpgradePrompt message={access.upgradeMessage} />;
  }

  return <MacroCyclingComponent />;
}
```

#### Feature Gate Component

```typescript
import { SubscriptionHooks } from '@/utils/clientSubscriptionValidation';

function FeatureGate({ subscription, feature, children }) {
  const props = SubscriptionHooks.getFeatureGateProps(subscription, feature);

  if (props.isLocked) {
    return (
      <LockedFeature 
        message={props.upgradeMessage}
        onUpgrade={() => navigate('/upgrade')}
      />
    );
  }

  return <>{children}</>;
}
```

#### Subscription Alerts

```typescript
import { SubscriptionHooks } from '@/utils/clientSubscriptionValidation';

function SubscriptionAlert({ subscription }) {
  const alert = SubscriptionHooks.getSubscriptionAlertProps(subscription);

  if (!alert) return null;

  return (
    <Alert severity={alert.severity}>
      {alert.message}
      {alert.action && <Button>{alert.action}</Button>}
    </Alert>
  );
}
```

#### Status Badge

```typescript
import { ClientSubscriptionValidator } from '@/utils/clientSubscriptionValidation';

function SubscriptionBadge({ subscription }) {
  const badge = ClientSubscriptionValidator.getStatusBadge(subscription);

  return (
    <Badge color={badge.color}>
      {badge.label}
    </Badge>
  );
}
```

## Integration Points

### 1. Feature Gating Service

The subscription validation integrates with the existing feature gating system:

```typescript
import { SubscriptionValidator } from '@/lib/subscriptionValidation';

function limitPlanComplexity(plan, subscription) {
  const validation = SubscriptionValidator.validateSubscription(subscription);
  
  if (!validation.hasAccess || validation.tier === 'free') {
    // Simplify plan for free tier
    plan.meal_plan = simplifyMealPlan(plan.meal_plan);
    delete plan.grocery_optimization;
    delete plan.meal_prep_strategy;
    plan.macro_strategy.macro_cycling = null;
  }
  
  return plan;
}
```

### 2. Plan Complexity Limiter

Automatically limits plan features based on subscription:

```typescript
import { SubscriptionStatusChecker } from '@/lib/subscriptionValidation';

function generatePlan(userProfile, subscription) {
  const hasProAccess = SubscriptionStatusChecker.hasProAccess(subscription);
  
  const plan = {
    ...basePlan,
    macroCycling: hasProAccess ? generateMacroCycling() : null,
    groceryOptimization: hasProAccess ? generateGroceryList() : null,
    mealVariety: hasProAccess ? 7 : 3, // 7-day vs 3-day rotation
  };
  
  return plan;
}
```

### 3. API Endpoints

All Pro-only endpoints are protected:

```typescript
// Pro-only endpoints
POST   /api/transformation/generate     (requireProSubscription)
POST   /api/meal-prep/optimize          (requireProSubscription)
GET    /api/grocery/consolidated        (requireProSubscription)
POST   /api/progress/projection         (requireProSubscription)

// Free tier endpoints
GET    /api/user/profile                (validateSubscriptionStatus)
GET    /api/transformation/:id          (validateSubscriptionStatus)
POST   /api/progress/track              (validateSubscriptionStatus)
```

### 4. Database Queries

Subscription data is stored in user profile:

```typescript
interface UserSubscription {
  tier: 'free' | 'pro';
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
  gracePeriodEnd?: Date;
  paymentStatus?: 'paid' | 'pending' | 'failed';
}
```

## Automatic Tier Downgrade

### When Downgrade Occurs

1. Subscription expires (`currentPeriodEnd` passed)
2. Trial period ends (`trialEnd` passed)
3. Grace period ends (`gracePeriodEnd` passed)
4. Payment incomplete and not resolved

### Downgrade Process

```typescript
import { SubscriptionValidator } from '@/lib/subscriptionValidation';

async function checkAndDowngrade(userId, subscription) {
  const validation = SubscriptionValidator.validateSubscription(subscription);
  
  if (validation.shouldDowngrade) {
    await db.users.update(userId, {
      subscription_tier: 'free',
      subscription_status: 'expired',
      downgraded_at: new Date(),
      previous_tier: subscription.tier,
    });
    
    // Notify user
    await sendDowngradeNotification(userId);
    
    // Limit active plans
    await limitUserPlans(userId);
  }
}
```

## Error Handling

### API Error Responses

```typescript
// Subscription not found
{
  success: false,
  error: {
    message: "Subscription data not found",
    code: "SUBSCRIPTION_NOT_FOUND"
  }
}

// Pro subscription required
{
  success: false,
  error: {
    message: "Pro subscription required to access this feature",
    code: "PRO_SUBSCRIPTION_REQUIRED"
  },
  upgrade: {
    required: true,
    tier: "pro",
    message: "Upgrade to Pro to access this feature"
  }
}

// Payment required
{
  success: false,
  error: {
    message: "Payment is not current. Please update your payment method.",
    code: "PAYMENT_REQUIRED"
  }
}
```

### Warning Headers

The middleware automatically adds warning headers:

```
X-Subscription-Warning: Payment failed. 2 days remaining.
X-Subscription-Warning: Subscription cancelled. Access will end at period end.
X-Subscription-Warning: Trial ends in 5 days.
```

## Testing

### Unit Tests

```bash
npm test src/lib/__tests__/subscriptionValidation.test.ts
npm test src/utils/__tests__/clientSubscriptionValidation.test.ts
```

### Test Coverage

- ✅ Free tier validation
- ✅ Active Pro subscription
- ✅ Expired subscription
- ✅ Trial period validation
- ✅ Cancelled subscription (in/out of period)
- ✅ Grace period validation
- ✅ Payment status checking
- ✅ Tier matching
- ✅ Feature access control
- ✅ Status messages
- ✅ Badge generation
- ✅ Alert generation

### Example Test

```typescript
it('should validate past_due subscription in grace period', () => {
  const subscription: SubscriptionData = {
    tier: 'pro',
    status: 'past_due',
    gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    paymentStatus: 'failed',
  };

  const result = SubscriptionValidator.validateSubscription(subscription);

  expect(result.isValid).toBe(true);
  expect(result.hasAccess).toBe(true);
  expect(result.gracePeriodRemaining).toBe(2);
});
```

## Configuration

### Grace Period Duration

Modify in `src/lib/subscriptionValidation.ts`:

```typescript
class SubscriptionValidator {
  private static readonly GRACE_PERIOD_DAYS = 3; // Change this value
}
```

### Feature Lists

Modify in `src/utils/clientSubscriptionValidation.ts`:

```typescript
export const PRO_FEATURES = {
  MACRO_CYCLING: 'macro_cycling',
  // Add new Pro features here
} as const;

export const FREE_FEATURES = {
  BASIC_MEAL_PLAN: 'basic_meal_plan',
  // Add new free features here
} as const;
```

## Best Practices

1. **Always validate on server-side**: Client-side validation is for UX only
2. **Use middleware consistently**: Apply to all protected routes
3. **Handle grace periods gracefully**: Show clear warnings to users
4. **Test edge cases**: Especially around date boundaries
5. **Log downgrade events**: For analytics and support
6. **Notify users proactively**: Before subscription expires
7. **Provide clear upgrade paths**: Make it easy to upgrade

## Future Enhancements

- [ ] Webhook integration for real-time status updates
- [ ] Automatic retry for failed payments
- [ ] Prorated upgrades/downgrades
- [ ] Usage-based billing integration
- [ ] Multi-tier subscription support
- [ ] Family/team plans
- [ ] Subscription pause functionality
- [ ] Loyalty rewards for long-term subscribers

## Support

For issues or questions:
- Check test files for usage examples
- Review middleware implementation
- Consult API documentation
- Contact development team
