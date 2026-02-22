/**
 * Client-Side Subscription Validation
 * For validating Pro features on the frontend
 */

import {
  SubscriptionData,
  SubscriptionValidator,
  SubscriptionStatusChecker,
  SubscriptionTier,
} from '../lib/subscriptionValidation';

/**
 * Feature access result
 */
export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiresUpgrade: boolean;
  upgradeMessage?: string;
}

/**
 * Pro feature list
 */
export const PRO_FEATURES = {
  MACRO_CYCLING: 'macro_cycling',
  REFEED_STRATEGY: 'refeed_strategy',
  GROCERY_OPTIMIZATION: 'grocery_optimization',
  MEAL_PREP_BATCHING: 'meal_prep_batching',
  ADVANCED_PROGRESSION: 'advanced_progression',
  PLATEAU_PREVENTION: 'plateau_prevention',
  PROGRESS_PROJECTION: 'progress_projection',
  FULL_MEAL_VARIETY: 'full_meal_variety',
  CARB_CYCLING: 'carb_cycling',
} as const;

export type ProFeature = typeof PRO_FEATURES[keyof typeof PRO_FEATURES];

/**
 * Free tier feature list
 */
export const FREE_FEATURES = {
  BASIC_MEAL_PLAN: 'basic_meal_plan',
  SIMPLE_WORKOUT: 'simple_workout',
  BASIC_MACROS: 'basic_macros',
  PROGRESS_TRACKING: 'progress_tracking',
} as const;

export type FreeFeature = typeof FREE_FEATURES[keyof typeof FREE_FEATURES];

/**
 * Client-side subscription validator
 */
export class ClientSubscriptionValidator {
  /**
   * Check if user has access to a Pro feature
   */
  static canAccessProFeature(
    subscription: SubscriptionData,
    feature: ProFeature
  ): FeatureAccessResult {
    const validation = SubscriptionValidator.validateSubscription(subscription);

    if (validation.tier === 'pro' && validation.hasAccess) {
      return {
        hasAccess: true,
        requiresUpgrade: false,
      };
    }

    return {
      hasAccess: false,
      reason: 'Pro subscription required',
      requiresUpgrade: true,
      upgradeMessage: this.getUpgradeMessage(feature),
    };
  }

  /**
   * Check if user can access any feature
   */
  static canAccessFeature(
    subscription: SubscriptionData,
    feature: ProFeature | FreeFeature
  ): FeatureAccessResult {
    // Check if it's a free feature
    if (Object.values(FREE_FEATURES).includes(feature as FreeFeature)) {
      const validation = SubscriptionValidator.validateSubscription(subscription);
      return {
        hasAccess: validation.hasAccess,
        requiresUpgrade: false,
        reason: validation.hasAccess ? undefined : validation.reason,
      };
    }

    // It's a Pro feature
    return this.canAccessProFeature(subscription, feature as ProFeature);
  }

  /**
   * Get upgrade message for a specific feature
   */
  private static getUpgradeMessage(feature: ProFeature): string {
    const messages: Record<ProFeature, string> = {
      [PRO_FEATURES.MACRO_CYCLING]: 'Upgrade to Pro for advanced macro cycling based on training days',
      [PRO_FEATURES.REFEED_STRATEGY]: 'Upgrade to Pro for strategic refeed days to boost metabolism',
      [PRO_FEATURES.GROCERY_OPTIMIZATION]: 'Upgrade to Pro for smart grocery list consolidation',
      [PRO_FEATURES.MEAL_PREP_BATCHING]: 'Upgrade to Pro for meal prep optimization and time-saving strategies',
      [PRO_FEATURES.ADVANCED_PROGRESSION]: 'Upgrade to Pro for advanced progression algorithms',
      [PRO_FEATURES.PLATEAU_PREVENTION]: 'Upgrade to Pro for automatic plateau prevention',
      [PRO_FEATURES.PROGRESS_PROJECTION]: 'Upgrade to Pro for 8-week progress predictions',
      [PRO_FEATURES.FULL_MEAL_VARIETY]: 'Upgrade to Pro for full 7-day meal variety',
      [PRO_FEATURES.CARB_CYCLING]: 'Upgrade to Pro for carb cycling strategies',
    };

    return messages[feature] || 'Upgrade to Pro to access this feature';
  }

  /**
   * Get list of available features for subscription
   */
  static getAvailableFeatures(subscription: SubscriptionData): string[] {
    const validation = SubscriptionValidator.validateSubscription(subscription);

    const freeFeatures = Object.values(FREE_FEATURES);

    if (validation.tier === 'pro' && validation.hasAccess) {
      return [...freeFeatures, ...Object.values(PRO_FEATURES)];
    }

    return freeFeatures;
  }

  /**
   * Get list of locked features for subscription
   */
  static getLockedFeatures(subscription: SubscriptionData): ProFeature[] {
    const validation = SubscriptionValidator.validateSubscription(subscription);

    if (validation.tier === 'pro' && validation.hasAccess) {
      return [];
    }

    return Object.values(PRO_FEATURES);
  }

  /**
   * Check if subscription needs attention (grace period, cancelled, etc.)
   */
  static needsAttention(subscription: SubscriptionData): {
    needsAttention: boolean;
    message?: string;
    severity: 'info' | 'warning' | 'error';
  } {
    const validation = SubscriptionValidator.validateSubscription(subscription);

    if (validation.status === 'past_due') {
      return {
        needsAttention: true,
        message: `Payment failed. ${validation.gracePeriodRemaining} days remaining to update payment.`,
        severity: 'error',
      };
    }

    if (validation.status === 'cancelled') {
      const daysRemaining = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);
      return {
        needsAttention: true,
        message: `Subscription cancelled. Access ends in ${daysRemaining} days.`,
        severity: 'warning',
      };
    }

    if (validation.status === 'trial') {
      const daysRemaining = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);
      if (daysRemaining !== null && daysRemaining <= 7) {
        return {
          needsAttention: true,
          message: `Trial ends in ${daysRemaining} days.`,
          severity: 'info',
        };
      }
    }

    if (validation.status === 'incomplete') {
      return {
        needsAttention: true,
        message: 'Payment incomplete. Please complete your subscription setup.',
        severity: 'error',
      };
    }

    return {
      needsAttention: false,
      severity: 'info',
    };
  }

  /**
   * Get subscription status badge info
   */
  static getStatusBadge(subscription: SubscriptionData): {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  } {
    const validation = SubscriptionValidator.validateSubscription(subscription);

    if (validation.tier === 'free') {
      return { label: 'Free', color: 'gray' };
    }

    switch (validation.status) {
      case 'active':
        return { label: 'Pro', color: 'green' };
      case 'trial':
        return { label: 'Pro Trial', color: 'blue' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'yellow' };
      case 'past_due':
        return { label: 'Payment Due', color: 'red' };
      case 'expired':
        return { label: 'Expired', color: 'red' };
      case 'incomplete':
        return { label: 'Incomplete', color: 'red' };
      default:
        return { label: 'Unknown', color: 'gray' };
    }
  }
}

/**
 * React hook-friendly subscription utilities
 */
export class SubscriptionHooks {
  /**
   * Check if feature should be shown with upgrade prompt
   */
  static shouldShowUpgradePrompt(
    subscription: SubscriptionData,
    feature: ProFeature
  ): boolean {
    const access = ClientSubscriptionValidator.canAccessProFeature(subscription, feature);
    return !access.hasAccess && access.requiresUpgrade;
  }

  /**
   * Get feature gate component props
   */
  static getFeatureGateProps(
    subscription: SubscriptionData,
    feature: ProFeature
  ): {
    isLocked: boolean;
    upgradeMessage: string;
    canAccess: boolean;
  } {
    const access = ClientSubscriptionValidator.canAccessProFeature(subscription, feature);

    return {
      isLocked: !access.hasAccess,
      upgradeMessage: access.upgradeMessage || '',
      canAccess: access.hasAccess,
    };
  }

  /**
   * Get subscription alert props
   */
  static getSubscriptionAlertProps(subscription: SubscriptionData): {
    show: boolean;
    message: string;
    severity: 'info' | 'warning' | 'error';
    action?: string;
  } | null {
    const attention = ClientSubscriptionValidator.needsAttention(subscription);

    if (!attention.needsAttention) {
      return null;
    }

    let action: string | undefined;

    if (subscription.status === 'past_due') {
      action = 'Update Payment';
    } else if (subscription.status === 'trial') {
      action = 'Upgrade Now';
    } else if (subscription.status === 'incomplete') {
      action = 'Complete Setup';
    }

    return {
      show: true,
      message: attention.message || '',
      severity: attention.severity,
      action,
    };
  }
}
