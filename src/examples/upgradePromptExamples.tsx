/**
 * Upgrade Prompt Usage Examples
 * Demonstrates various ways to implement upgrade prompts and conversion tracking
 */

import React from 'react';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { UpgradeCTA } from '@/components/ui/UpgradeCTA';
import { FeatureGate, FeatureLock, FeatureBadge } from '@/components/ui/FeatureGate';
import { useUpgradePrompt, useFeatureAccess, useUpgradeBenefits } from '@/hooks/useUpgradePrompt';
import { ConversionTrackingService } from '@/lib/conversionTrackingService';

// Example 1: Basic Upgrade Prompt
export function BasicUpgradePromptExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Macro Cycling</h2>
      <UpgradePrompt
        featureId="macro_cycling"
        userId={user.id}
        location="meal-plan-page"
        variant="default"
        onUpgradeClick={() => console.log('Navigate to upgrade page')}
      />
    </div>
  );
}

// Example 2: Upgrade Prompt with Benefits Variant
export function BenefitsVariantExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <UpgradePrompt
      featureId="grocery_optimization"
      userId={user.id}
      location="grocery-list"
      variant="benefits"
      onUpgradeClick={() => console.log('Navigate to upgrade page')}
      onDismiss={() => console.log('User dismissed prompt')}
    />
  );
}

// Example 3: Feature Gate Wrapper
export function FeatureGateExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <FeatureGate
      featureId="macro_cycling"
      userTier={user.subscriptionTier}
      userId={user.id}
      location="settings-page"
      promptVariant="benefits"
    >
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold">Macro Cycling Settings</h3>
        <p>Configure your training day and rest day macros...</p>
        {/* Pro feature content */}
      </div>
    </FeatureGate>
  );
}

// Example 4: Feature Lock with Blur
export function FeatureLockExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <FeatureLock
      featureId="seven_day_variety"
      userTier={user.subscriptionTier}
      userId={user.id}
      location="meal-plan-variety"
      blurContent={true}
    >
      <div className="p-6 bg-white rounded-lg">
        <h3 className="text-xl font-bold mb-4">7-Day Meal Variety</h3>
        <div className="space-y-2">
          <p>Monday: Grilled Chicken with Quinoa</p>
          <p>Tuesday: Salmon with Sweet Potato</p>
          <p>Wednesday: Turkey Meatballs with Pasta</p>
          {/* More meal content */}
        </div>
      </div>
    </FeatureLock>
  );
}

// Example 5: Feature Badge on Card
export function FeatureBadgeExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <div className="relative p-4 bg-white rounded-lg shadow">
      <FeatureBadge
        featureId="progress_projection"
        userTier={user.subscriptionTier}
        position="top-right"
      />
      <h3 className="font-bold">Progress Projection</h3>
      <p>See your predicted results over 8 weeks</p>
    </div>
  );
}

// Example 6: Inline Upgrade CTA
export function InlineUpgradeCTAExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <h3 className="font-bold">Want more features?</h3>
        <p className="text-sm text-gray-600">Unlock all Pro features</p>
      </div>
      <UpgradeCTA
        userId={user.id}
        location="dashboard-cta"
        size="md"
        variant="inline"
        message="Upgrade"
      />
    </div>
  );
}

// Example 7: Banner Upgrade CTA
export function BannerUpgradeCTAExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <UpgradeCTA
      featureId="advanced_progression"
      userId={user.id}
      location="dashboard-banner"
      variant="banner"
    />
  );
}

// Example 8: Badge Upgrade CTA
export function BadgeUpgradeCTAExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow">
      <div className="text-xl font-bold">Fitness App</div>
      <div className="flex items-center gap-4">
        <a href="/dashboard">Dashboard</a>
        <a href="/workouts">Workouts</a>
        <a href="/nutrition">Nutrition</a>
        <UpgradeCTA
          userId={user.id}
          location="navigation"
          variant="badge"
        />
      </div>
    </nav>
  );
}

// Example 9: Using useUpgradePrompt Hook
export function UseUpgradePromptHookExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  const {
    hasAccess,
    requiresUpgrade,
    showPrompt,
    isPromptVisible,
    trackClick,
    upgradeMessage
  } = useUpgradePrompt({
    featureId: 'macro_cycling',
    userTier: user.subscriptionTier,
    userId: user.id,
    location: 'meal-settings',
    variant: 'benefits',
    autoTrackView: true
  });

  if (!hasAccess) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 mb-2">{upgradeMessage}</p>
        <button
          onClick={() => {
            trackClick();
            console.log('Navigate to upgrade');
          }}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-2">Macro Cycling Settings</h3>
      <p>Configure your macro cycling preferences...</p>
    </div>
  );
}

// Example 10: Using useFeatureAccess Hook
export function UseFeatureAccessHookExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  const featureAccess = useFeatureAccess(user.subscriptionTier, [
    'macro_cycling',
    'grocery_optimization',
    'progress_projection',
    'seven_day_variety'
  ]);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className={`p-4 rounded-lg ${featureAccess.macro_cycling ? 'bg-green-50' : 'bg-gray-50'}`}>
        <h3 className="font-bold">Macro Cycling</h3>
        <p className="text-sm">{featureAccess.macro_cycling ? 'Available' : 'Pro Only'}</p>
      </div>
      <div className={`p-4 rounded-lg ${featureAccess.grocery_optimization ? 'bg-green-50' : 'bg-gray-50'}`}>
        <h3 className="font-bold">Grocery Optimization</h3>
        <p className="text-sm">{featureAccess.grocery_optimization ? 'Available' : 'Pro Only'}</p>
      </div>
      <div className={`p-4 rounded-lg ${featureAccess.progress_projection ? 'bg-green-50' : 'bg-gray-50'}`}>
        <h3 className="font-bold">Progress Projection</h3>
        <p className="text-sm">{featureAccess.progress_projection ? 'Available' : 'Pro Only'}</p>
      </div>
      <div className={`p-4 rounded-lg ${featureAccess.seven_day_variety ? 'bg-green-50' : 'bg-gray-50'}`}>
        <h3 className="font-bold">7-Day Variety</h3>
        <p className="text-sm">{featureAccess.seven_day_variety ? 'Available' : 'Pro Only'}</p>
      </div>
    </div>
  );
}

// Example 11: Using useUpgradeBenefits Hook
export function UseUpgradeBenefitsHookExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  const { benefits, benefitCount } = useUpgradeBenefits(user.subscriptionTier);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
      <p className="text-gray-600 mb-6">Unlock {benefitCount} powerful features</p>
      <div className="space-y-4">
        {benefits.map(benefit => (
          <div key={benefit.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{benefit.name}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 12: Manual Conversion Tracking
export function ManualConversionTrackingExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  const handleFeatureClick = () => {
    // Track when user tries to access a Pro feature
    ConversionTrackingService.trackPromptView(
      user.id,
      'macro_cycling',
      'meal-plan-button'
    );
  };

  const handleUpgradeClick = () => {
    // Track when user clicks upgrade
    ConversionTrackingService.trackPromptClick(
      user.id,
      'macro_cycling',
      'meal-plan-button'
    );
    ConversionTrackingService.trackUpgradeInitiation(user.id, 'meal-plan-button');
    
    // Navigate to upgrade page
    console.log('Navigate to /upgrade');
  };

  return (
    <div className="p-4">
      <button
        onClick={handleFeatureClick}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Enable Macro Cycling
      </button>
      <button
        onClick={handleUpgradeClick}
        className="ml-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

// Example 13: A/B Testing Implementation
export function ABTestingExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  // Assign variant based on user ID
  const getVariant = (userId: string) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variants = ['default', 'benefits', 'urgency', 'social_proof'] as const;
    return variants[hash % variants.length];
  };

  const variant = getVariant(user.id);

  return (
    <div className="p-4">
      <p className="mb-4 text-sm text-gray-600">Testing variant: {variant}</p>
      <UpgradePrompt
        featureId="macro_cycling"
        userId={user.id}
        location="ab-test-page"
        variant={variant}
        onUpgradeClick={() => console.log('Upgrade clicked')}
      />
    </div>
  );
}

// Example 14: Analytics Dashboard
export function AnalyticsDashboardExample() {
  const overallMetrics = ConversionTrackingService.getOverallFunnelMetrics();
  const featureMetrics = ConversionTrackingService.getFeatureInterestMetrics();
  const promptMetrics = ConversionTrackingService.getPromptPerformanceMetrics();

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Conversion Funnel</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Prompt Views</p>
            <p className="text-2xl font-bold">{overallMetrics.promptViews}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Clicks</p>
            <p className="text-2xl font-bold">{overallMetrics.promptClicks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Conversions</p>
            <p className="text-2xl font-bold">{overallMetrics.paymentCompletions}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">Overall Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {(overallMetrics.overallConversionRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Feature Interest</h2>
        <div className="space-y-2">
          {featureMetrics.map(metric => (
            <div key={metric.featureId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{metric.featureId}</span>
              <span className="text-sm text-gray-600">
                {metric.viewCount} views, {(metric.conversionRate * 100).toFixed(1)}% conversion
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Prompt Performance</h2>
        <div className="space-y-2">
          {promptMetrics.map(metric => (
            <div key={metric.variant} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium capitalize">{metric.variant}</span>
              <span className="text-sm text-gray-600">
                CTR: {(metric.clickThroughRate * 100).toFixed(1)}%, 
                Conv: {(metric.conversionRate * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Example 15: Complete Payment Flow with Tracking
export function PaymentFlowExample() {
  const user = { id: 'user123', subscriptionTier: 'free' as const };

  const handleUpgrade = async (plan: string) => {
    // Track upgrade initiation
    ConversionTrackingService.trackUpgradeInitiation(user.id, 'upgrade-page');
    
    // Track payment start
    ConversionTrackingService.trackPaymentStart(user.id, plan);
    
    try {
      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        // Track successful payment
        ConversionTrackingService.trackPaymentComplete(user.id, plan, 29.99);
        console.log('Payment successful! Welcome to Pro');
      } else {
        // Track payment failure
        ConversionTrackingService.trackPaymentFailure(user.id, 'card_declined');
        console.log('Payment failed. Please try again.');
      }
    } catch (error) {
      ConversionTrackingService.trackPaymentFailure(user.id, 'processing_error');
      console.error('Payment error:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-md">
      <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
      <div className="space-y-4">
        <div className="p-4 border-2 border-purple-600 rounded-lg">
          <h3 className="font-bold text-lg">Pro Monthly</h3>
          <p className="text-3xl font-bold text-purple-600">$29.99<span className="text-sm text-gray-600">/month</span></p>
          <button
            onClick={() => handleUpgrade('pro-monthly')}
            className="w-full mt-4 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}
