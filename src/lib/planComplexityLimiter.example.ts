/**
 * Plan Complexity Limiter - Usage Examples
 * Demonstrates how to integrate the plan complexity limiter in various scenarios
 */

import {
  PlanComplexityLimiter,
  limitPlanComplexity,
  isPlanLimited,
  getUpgradeFeatures
} from './planComplexityLimiter';
import type {
  TransformationPlan,
  UserProfileExtended
} from '@/types/nutrition';

/**
 * Example 1: Basic Plan Generation with Tier Limiting
 * This is the most common use case - generating a plan and applying tier limitations
 */
export async function generatePlanWithTierLimiting(
  userProfile: UserProfileExtended
): Promise<TransformationPlan> {
  // Step 1: Generate a full-featured plan (with all Pro features)
  const fullPlan = await generateFullTransformationPlan(userProfile);
  
  // Step 2: Apply tier-based limitations
  const result = limitPlanComplexity(fullPlan, userProfile.subscription_tier);
  
  // Step 3: Log what was limited (for analytics/debugging)
  if (result.limitationsApplied.length > 0) {
    console.log('Plan limitations applied:', {
      tier: result.tier,
      limitations: result.limitationsApplied,
      featuresRemoved: result.featuresRemoved
    });
  }
  
  // Step 4: Return the appropriately limited plan
  return result.plan;
}

/**
 * Example 2: Plan Validation Before Saving
 * Ensure plan complexity matches the user's subscription tier
 */
export function validateAndSavePlan(plan: TransformationPlan): void {
  // Validate that the plan's complexity matches its tier
  const validation = PlanComplexityLimiter.validatePlanComplexity(plan);
  
  if (!validation.isValid) {
    console.error('Plan validation failed:', validation.violations);
    throw new Error(
      `Invalid plan complexity for ${plan.subscription_tier} tier: ${validation.violations.join(', ')}`
    );
  }
  
  // Plan is valid, proceed with saving
  savePlanToDatabase(plan);
}

/**
 * Example 3: Upgrade Flow - Show What User Would Get
 * Display upgrade benefits to encourage conversion
 */
export function getUpgradeBenefitsForUser(
  currentPlan: TransformationPlan
): {
  isLimited: boolean;
  upgradeFeatures: string[];
  message: string;
} {
  const isLimited = isPlanLimited(currentPlan);
  
  if (!isLimited) {
    return {
      isLimited: false,
      upgradeFeatures: [],
      message: 'You already have access to all Pro features!'
    };
  }
  
  const upgradeFeatures = getUpgradeFeatures(currentPlan);
  
  return {
    isLimited: true,
    upgradeFeatures,
    message: `Upgrade to Pro to unlock ${upgradeFeatures.length} advanced features`
  };
}

/**
 * Example 4: Plan Update After Subscription Upgrade
 * When a user upgrades, regenerate their plan with full features
 */
export async function handleSubscriptionUpgrade(
  userId: string,
  oldTier: 'free',
  newTier: 'pro'
): Promise<TransformationPlan> {
  // Get user profile and update tier
  const userProfile = await getUserProfile(userId);
  userProfile.subscription_tier = newTier;
  
  // Regenerate plan with full Pro features
  const newPlan = await generatePlanWithTierLimiting(userProfile);
  
  console.log('Plan upgraded from free to pro:', {
    userId,
    oldTier,
    newTier,
    newFeatures: [
      'macro_cycling',
      'grocery_optimization',
      'periodized_training',
      'refeed_strategy'
    ]
  });
  
  return newPlan;
}

/**
 * Example 5: Plan Downgrade After Subscription Cancellation
 * When a user downgrades, limit their existing plan
 */
export async function handleSubscriptionDowngrade(
  userId: string,
  oldTier: 'pro',
  newTier: 'free'
): Promise<TransformationPlan> {
  // Apply free tier limitations to the user's current plan
  const result = limitPlanComplexity(await getPlanForUser(userId), newTier);
  
  console.log('Plan downgraded from pro to free:', {
    userId,
    oldTier,
    newTier,
    limitationsApplied: result.limitationsApplied,
    featuresRemoved: result.featuresRemoved
  });
  
  // Save the limited plan
  await savePlanToDatabase(result.plan);
  
  return result.plan;
}

/**
 * Example 6: Display Plan with Upgrade Prompts
 * Show the plan with contextual upgrade prompts for limited features
 */
export function getPlanDisplayData(plan: TransformationPlan): {
  plan: TransformationPlan;
  showUpgradePrompt: boolean;
  upgradeFeatures: string[];
  limitationMessage: string;
} {
  const isLimited = isPlanLimited(plan);
  const upgradeFeatures = getUpgradeFeatures(plan);
  
  // Generate limitation result for message
  const result = limitPlanComplexity(plan, plan.subscription_tier);
  const limitationMessage = PlanComplexityLimiter.getLimitationMessage(result);
  
  return {
    plan,
    showUpgradePrompt: isLimited,
    upgradeFeatures,
    limitationMessage
  };
}

/**
 * Example 7: A/B Testing Different Limitation Strategies
 * Test different approaches to limiting plans for conversion optimization
 */
export async function generatePlanWithABTest(
  userProfile: UserProfileExtended,
  testVariant: 'control' | 'variant_a' | 'variant_b'
): Promise<TransformationPlan> {
  const fullPlan = await generateFullTransformationPlan(userProfile);
  
  if (userProfile.subscription_tier === 'pro') {
    return fullPlan; // No limiting for pro users
  }
  
  switch (testVariant) {
    case 'control': {
      // Standard limiting
      return limitPlanComplexity(fullPlan, 'free').plan;
    }
      
    case 'variant_a': {
      // More generous - show some pro features as preview
      const resultA = limitPlanComplexity(fullPlan, 'free');
      // Keep macro cycling as a preview (but mark as limited)
      resultA.plan.macro_strategy.macro_cycling = fullPlan.macro_strategy.macro_cycling;
      return resultA.plan;
    }
      
    case 'variant_b': {
      // More restrictive - emphasize upgrade value
      const resultB = limitPlanComplexity(fullPlan, 'free');
      // Additional simplification for emphasis
      return resultB.plan;
    }
      
    default:
      return limitPlanComplexity(fullPlan, 'free').plan;
  }
}

/**
 * Example 8: Analytics Tracking for Limitations
 * Track which limitations are applied most often for product insights
 */
export function trackPlanLimitations(
  userId: string,
  plan: TransformationPlan
): void {
  const result = limitPlanComplexity(plan, plan.subscription_tier);
  
  if (result.limitationsApplied.length > 0) {
    // Track analytics event
    trackAnalyticsEvent('plan_limitations_applied', {
      userId,
      tier: result.tier,
      limitationsCount: result.limitationsApplied.length,
      limitations: result.limitationsApplied,
      featuresRemoved: result.featuresRemoved,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Example 9: Batch Plan Processing
 * Process multiple plans with tier limiting (e.g., for migration)
 */
export async function batchLimitPlans(
  plans: TransformationPlan[]
): Promise<Array<{
  planId: string;
  success: boolean;
  result?: TransformationPlan;
  error?: string;
}>> {
  return Promise.all(
    plans.map(async (plan) => {
      try {
        const result = limitPlanComplexity(plan, plan.subscription_tier);
        
        // Validate the limited plan
        const validation = PlanComplexityLimiter.validatePlanComplexity(result.plan);
        
        if (!validation.isValid) {
          return {
            planId: plan.id,
            success: false,
            error: `Validation failed: ${validation.violations.join(', ')}`
          };
        }
        
        return {
          planId: plan.id,
          success: true,
          result: result.plan
        };
      } catch (error) {
        return {
          planId: plan.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );
}

/**
 * Example 10: Feature Flag Integration
 * Combine with feature flags for gradual rollout
 */
export function limitPlanWithFeatureFlags(
  plan: TransformationPlan,
  tier: 'free' | 'pro',
  featureFlags: {
    enableMacroCycling: boolean;
    enableGroceryOptimization: boolean;
    enablePeriodization: boolean;
  }
): TransformationPlan {
  // Apply standard tier limiting
  const result = limitPlanComplexity(plan, tier);
  const limitedPlan = result.plan;
  
  // Override with feature flags (for gradual rollout or testing)
  if (tier === 'free') {
    if (featureFlags.enableMacroCycling) {
      // Re-enable macro cycling for free users (feature flag override)
      limitedPlan.macro_strategy.macro_cycling = plan.macro_strategy.macro_cycling;
    }
    
    if (featureFlags.enableGroceryOptimization) {
      // Re-enable grocery optimization for free users
      limitedPlan.grocery_optimization = plan.grocery_optimization;
    }
    
    if (featureFlags.enablePeriodization) {
      // Re-enable periodization for free users
      limitedPlan.workout_plan.progression_scheme = plan.workout_plan.progression_scheme;
    }
  }
  
  return limitedPlan;
}

// Mock helper functions (these would be implemented elsewhere)
async function generateFullTransformationPlan(
  profile: UserProfileExtended
): Promise<TransformationPlan> {
  // This would call the actual plan generation service
  throw new Error('Not implemented - use actual plan generation service');
}

async function getPlanForUser(userId: string): Promise<TransformationPlan> {
  // This would fetch from database
  throw new Error('Not implemented - use actual database service');
}

async function getUserProfile(userId: string): Promise<UserProfileExtended> {
  // This would fetch from database
  throw new Error('Not implemented - use actual database service');
}

async function savePlanToDatabase(plan: TransformationPlan): Promise<void> {
  // This would save to database
  throw new Error('Not implemented - use actual database service');
}

function trackAnalyticsEvent(eventName: string, data: unknown): void {
  // This would send to analytics service
  console.log('Analytics event:', eventName, data);
}
