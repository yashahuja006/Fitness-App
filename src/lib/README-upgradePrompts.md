# Upgrade Prompts & Conversion Tracking

This system provides comprehensive upgrade prompt functionality and conversion tracking for the AI Performance Nutrition & Training Engine. It enables strategic placement of upgrade prompts, A/B testing, and detailed analytics to optimize the free-to-Pro conversion funnel.

## Overview

The upgrade prompt system consists of:

1. **Conversion Tracking Service** - Tracks user interactions and conversion funnel metrics
2. **Upgrade Prompt Components** - UI components for displaying upgrade prompts
3. **Feature Gate Components** - Wrapper components for Pro feature access control
4. **React Hooks** - Easy integration with React components

## Key Features

- ✅ Multiple prompt variants for A/B testing
- ✅ Comprehensive conversion funnel tracking
- ✅ Feature-specific upgrade prompts
- ✅ Non-intrusive CTAs and badges
- ✅ Analytics integration ready
- ✅ Strategic placement throughout the app

## Components

### 1. UpgradePrompt

Full-featured upgrade prompt with multiple variants.

```tsx
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

<UpgradePrompt
  featureId="macro_cycling"
  userId={user.id}
  location="meal-plan-page"
  variant="benefits"
  onUpgradeClick={() => router.push('/upgrade')}
  onDismiss={() => setShowPrompt(false)}
/>
```

**Variants:**
- `default` - Simple locked feature message
- `benefits` - Shows feature-specific benefits
- `urgency` - Limited time messaging
- `social_proof` - Shows user testimonials and stats

### 2. UpgradeCTA

Smaller, non-intrusive call-to-action button.

```tsx
import { UpgradeCTA } from '@/components/ui/UpgradeCTA';

// Inline button
<UpgradeCTA
  userId={user.id}
  location="navigation"
  size="md"
  variant="inline"
  onUpgradeClick={() => router.push('/upgrade')}
/>

// Banner style
<UpgradeCTA
  featureId="progress_projection"
  userId={user.id}
  location="dashboard"
  variant="banner"
/>

// Badge style
<UpgradeCTA
  userId={user.id}
  location="feature-card"
  variant="badge"
/>
```

### 3. FeatureGate

Wraps content that requires Pro access.

```tsx
import { FeatureGate } from '@/components/ui/FeatureGate';

<FeatureGate
  featureId="macro_cycling"
  userTier={user.subscriptionTier}
  userId={user.id}
  location="meal-plan-settings"
  promptVariant="benefits"
  onUpgradeClick={() => router.push('/upgrade')}
>
  {/* Pro feature content */}
  <MacroCyclingSettings />
</FeatureGate>
```

### 4. FeatureLock

Shows locked content with blur overlay.

```tsx
import { FeatureLock } from '@/components/ui/FeatureGate';

<FeatureLock
  featureId="grocery_optimization"
  userTier={user.subscriptionTier}
  userId={user.id}
  location="grocery-list"
  blurContent={true}
>
  <GroceryList items={items} />
</FeatureLock>
```

### 5. FeatureBadge

Shows "Pro" badge on locked features.

```tsx
import { FeatureBadge } from '@/components/ui/FeatureGate';

<div className="relative">
  <FeatureCard feature={feature} />
  <FeatureBadge
    featureId={feature.id}
    userTier={user.subscriptionTier}
    position="top-right"
  />
</div>
```

## React Hooks

### useUpgradePrompt

Main hook for managing upgrade prompts.

```tsx
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt';

function MacroCyclingFeature() {
  const {
    hasAccess,
    requiresUpgrade,
    showPrompt,
    hidePrompt,
    isPromptVisible,
    trackClick,
    upgradeMessage
  } = useUpgradePrompt({
    featureId: 'macro_cycling',
    userTier: user.subscriptionTier,
    userId: user.id,
    location: 'meal-plan-page',
    variant: 'benefits',
    autoTrackView: true
  });

  if (!hasAccess) {
    return (
      <div>
        <p>{upgradeMessage}</p>
        <button onClick={() => {
          trackClick();
          router.push('/upgrade');
        }}>
          Upgrade Now
        </button>
      </div>
    );
  }

  return <MacroCyclingSettings />;
}
```

### useFeatureAccess

Check access to multiple features at once.

```tsx
import { useFeatureAccess } from '@/hooks/useUpgradePrompt';

function Dashboard() {
  const featureAccess = useFeatureAccess(user.subscriptionTier, [
    'macro_cycling',
    'grocery_optimization',
    'progress_projection'
  ]);

  return (
    <div>
      {featureAccess.macro_cycling && <MacroCyclingCard />}
      {featureAccess.grocery_optimization && <GroceryOptimization />}
      {featureAccess.progress_projection && <ProgressProjection />}
    </div>
  );
}
```

### useUpgradeBenefits

Get list of features that would be unlocked.

```tsx
import { useUpgradeBenefits } from '@/hooks/useUpgradePrompt';

function UpgradePage() {
  const { benefits, benefitCount } = useUpgradeBenefits(user.subscriptionTier);

  return (
    <div>
      <h2>Unlock {benefitCount} Pro Features</h2>
      <ul>
        {benefits.map(benefit => (
          <li key={benefit.id}>
            <strong>{benefit.name}</strong>
            <p>{benefit.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Conversion Tracking Service

### Tracking Events

```tsx
import { ConversionTrackingService } from '@/lib/conversionTrackingService';

// Track prompt view (automatic with components)
ConversionTrackingService.trackPromptView(
  userId,
  'macro_cycling',
  'meal-plan-page'
);

// Track prompt click
ConversionTrackingService.trackPromptClick(
  userId,
  'macro_cycling',
  'meal-plan-page'
);

// Track upgrade initiation
ConversionTrackingService.trackUpgradeInitiation(userId, 'dashboard');

// Track payment events
ConversionTrackingService.trackPaymentStart(userId, 'pro-monthly');
ConversionTrackingService.trackPaymentComplete(userId, 'pro-monthly', 29.99);
ConversionTrackingService.trackPaymentFailure(userId, 'card_declined');
```

### Analytics & Metrics

```tsx
import { ConversionTrackingService } from '@/lib/conversionTrackingService';

// Get user-specific funnel metrics
const userMetrics = ConversionTrackingService.getUserFunnelMetrics(userId);
console.log('Conversion rate:', userMetrics.overallConversionRate);

// Get overall funnel metrics
const overallMetrics = ConversionTrackingService.getOverallFunnelMetrics();
console.log('Total conversions:', overallMetrics.paymentCompletions);

// Get feature interest metrics (which features drive conversions)
const featureMetrics = ConversionTrackingService.getFeatureInterestMetrics();
featureMetrics.forEach(metric => {
  console.log(`${metric.featureId}: ${metric.conversionRate * 100}% conversion`);
});

// Get A/B test performance
const promptMetrics = ConversionTrackingService.getPromptPerformanceMetrics();
promptMetrics.forEach(metric => {
  console.log(`${metric.variant}: ${metric.clickThroughRate * 100}% CTR`);
});
```

## A/B Testing

### Setting Prompt Variants

```tsx
import { ConversionTrackingService } from '@/lib/conversionTrackingService';

// Set variant for A/B testing
// This affects all subsequent prompts until changed
ConversionTrackingService.setPromptVariant('benefits');

// Get current variant
const currentVariant = ConversionTrackingService.getCurrentVariant();
```

### Implementing A/B Tests

```tsx
function getPromptVariant(userId: string): PromptVariant {
  // Simple hash-based assignment
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants: PromptVariant[] = ['default', 'benefits', 'urgency', 'social_proof'];
  return variants[hash % variants.length];
}

function MyComponent() {
  const variant = getPromptVariant(user.id);
  
  return (
    <UpgradePrompt
      featureId="macro_cycling"
      userId={user.id}
      location="meal-plan"
      variant={variant}
    />
  );
}
```

## Strategic Placement Examples

### 1. Navigation Bar

```tsx
// Persistent upgrade CTA in navigation
<nav>
  <Logo />
  <NavLinks />
  {user.subscriptionTier === 'free' && (
    <UpgradeCTA
      userId={user.id}
      location="navigation"
      size="sm"
      variant="badge"
    />
  )}
</nav>
```

### 2. Feature Cards

```tsx
// Show Pro badge on locked features
<div className="grid grid-cols-3 gap-4">
  {features.map(feature => (
    <div key={feature.id} className="relative">
      <FeatureCard feature={feature} />
      <FeatureBadge
        featureId={feature.id}
        userTier={user.subscriptionTier}
        position="top-right"
      />
    </div>
  ))}
</div>
```

### 3. Settings Page

```tsx
// Gate Pro settings with upgrade prompt
<FeatureGate
  featureId="macro_cycling"
  userTier={user.subscriptionTier}
  userId={user.id}
  location="settings-macro-cycling"
  promptVariant="benefits"
>
  <MacroCyclingSettings />
</FeatureGate>
```

### 4. Dashboard Banner

```tsx
// Non-intrusive banner on dashboard
{user.subscriptionTier === 'free' && (
  <UpgradeCTA
    userId={user.id}
    location="dashboard-banner"
    variant="banner"
    message="Unlock advanced features to accelerate your progress"
  />
)}
```

### 5. Meal Plan Page

```tsx
// Lock advanced meal features
<FeatureLock
  featureId="seven_day_variety"
  userTier={user.subscriptionTier}
  userId={user.id}
  location="meal-plan-variety"
  blurContent={true}
>
  <SevenDayMealPlan />
</FeatureLock>
```

## Integration with Payment Flow

```tsx
import { ConversionTrackingService } from '@/lib/conversionTrackingService';
import { useRouter } from 'next/navigation';

function UpgradeFlow() {
  const router = useRouter();

  const handleUpgrade = async (plan: string) => {
    // Track upgrade initiation
    ConversionTrackingService.trackUpgradeInitiation(user.id, 'upgrade-page');
    
    // Track payment start
    ConversionTrackingService.trackPaymentStart(user.id, plan);
    
    try {
      // Process payment
      const result = await processPayment(plan);
      
      if (result.success) {
        // Track successful payment
        ConversionTrackingService.trackPaymentComplete(
          user.id,
          plan,
          result.amount
        );
        router.push('/welcome-pro');
      } else {
        // Track payment failure
        ConversionTrackingService.trackPaymentFailure(
          user.id,
          result.error
        );
      }
    } catch (error) {
      ConversionTrackingService.trackPaymentFailure(
        user.id,
        error.message
      );
    }
  };

  return (
    <div>
      <h1>Upgrade to Pro</h1>
      <button onClick={() => handleUpgrade('pro-monthly')}>
        Subscribe Monthly
      </button>
    </div>
  );
}
```

## Analytics Integration

The conversion tracking service is ready for integration with analytics platforms:

```tsx
// In conversionTrackingService.ts, the sendToAnalytics method
// can be extended to support:

// Google Analytics
if (window.gtag) {
  window.gtag('event', event.eventType, {
    event_category: 'conversion',
    event_label: event.featureId,
    value: event.promptVariant
  });
}

// Mixpanel
if (window.mixpanel) {
  window.mixpanel.track(event.eventType, {
    featureId: event.featureId,
    location: event.promptLocation,
    variant: event.promptVariant
  });
}

// Custom backend
fetch('/api/analytics/conversion', {
  method: 'POST',
  body: JSON.stringify(event)
});
```

## Best Practices

1. **Strategic Placement**: Place upgrade prompts where users naturally encounter Pro features
2. **Non-Intrusive**: Use badges and inline CTAs for persistent visibility without annoyance
3. **Context-Aware**: Show feature-specific benefits when users try to access locked features
4. **A/B Testing**: Test different variants to optimize conversion rates
5. **Track Everything**: Monitor the full funnel from view to payment completion
6. **Analyze Data**: Use metrics to identify which features drive conversions
7. **Iterate**: Continuously improve prompts based on performance data

## Success Metrics

Target metrics from requirements:
- **>15% free to Pro conversion rate**
- **>80% plan completion rate**
- **>70% monthly retention for Pro users**

Monitor these metrics using:
```tsx
const metrics = ConversionTrackingService.getOverallFunnelMetrics();
const conversionRate = metrics.overallConversionRate * 100;

if (conversionRate > 15) {
  console.log('✅ Meeting conversion target!');
}
```

## Testing

```tsx
import { ConversionTrackingService } from '@/lib/conversionTrackingService';

// Clear events before tests
beforeEach(() => {
  ConversionTrackingService.clearEvents();
});

test('tracks conversion funnel', () => {
  const userId = 'test-user';
  
  // Simulate user journey
  ConversionTrackingService.trackPromptView(userId, 'macro_cycling', 'dashboard');
  ConversionTrackingService.trackPromptClick(userId, 'macro_cycling', 'dashboard');
  ConversionTrackingService.trackUpgradeInitiation(userId, 'dashboard');
  ConversionTrackingService.trackPaymentStart(userId, 'pro-monthly');
  ConversionTrackingService.trackPaymentComplete(userId, 'pro-monthly', 29.99);
  
  const metrics = ConversionTrackingService.getUserFunnelMetrics(userId);
  
  expect(metrics.promptViews).toBe(1);
  expect(metrics.paymentCompletions).toBe(1);
  expect(metrics.overallConversionRate).toBe(1);
});
```

## Summary

This upgrade prompt and conversion tracking system provides:

✅ **Complete UI Components** - Ready-to-use React components for all scenarios
✅ **Comprehensive Tracking** - Full conversion funnel analytics
✅ **A/B Testing Support** - Multiple variants with performance metrics
✅ **Easy Integration** - Simple hooks and components for quick implementation
✅ **Analytics Ready** - Prepared for integration with analytics platforms
✅ **Best Practices** - Strategic placement and non-intrusive design

The system is designed to achieve the >15% conversion rate target while maintaining a positive user experience.
