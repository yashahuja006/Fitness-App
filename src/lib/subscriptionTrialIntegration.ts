/**
 * Subscription and Trial Integration
 * Integrates trial period management with subscription validation system
 */

import {
  SubscriptionData,
  SubscriptionValidator,
  SubscriptionStatusChecker,
} from './subscriptionValidation';
import {
  TrialPeriodData,
  TrialPeriodManager,
  TrialStatusResult,
  isInTrialPeriod,
  getTrialDaysRemaining,
  isTrialExpiringSoon,
} from './trialPeriodManagement';

/**
 * Enhanced subscription data with trial information
 */
export interface SubscriptionWithTrial extends SubscriptionData {
  trialData?: TrialPeriodData;
  trialStatus?: TrialStatusResult;
}

/**
 * Subscription and Trial Validator
 * Validates both subscription and trial status together
 */
export class SubscriptionTrialValidator {
  /**
   * Validate subscription with trial period consideration
   */
  static validateWithTrial(
    subscription: SubscriptionData,
    trialData?: TrialPeriodData
  ): {
    isValid: boolean;
    hasAccess: boolean;
    tier: 'free' | 'pro';
    status: string;
    message: string;
    trialInfo?: {
      isInTrial: boolean;
      daysRemaining: number;
      shouldPromptUpgrade: boolean;
    };
  } {
    // First validate base subscription
    const baseValidation = SubscriptionValidator.validateSubscription(subscription);

    // If subscription is in trial status, check trial data
    if (subscription.status === 'trial' && trialData) {
      const trialStatus = TrialPeriodManager.checkTrialStatus(trialData);

      return {
        isValid: trialStatus.canAccess,
        hasAccess: trialStatus.canAccess,
        tier: 'pro', // Trial users get Pro access
        status: trialStatus.isExpired ? 'expired' : 'trial',
        message: trialStatus.message,
        trialInfo: {
          isInTrial: trialStatus.isInTrial,
          daysRemaining: trialStatus.daysRemaining,
          shouldPromptUpgrade: trialStatus.shouldPromptUpgrade,
        },
      };
    }

    // Return base validation for non-trial subscriptions
    return {
      isValid: baseValidation.isValid,
      hasAccess: baseValidation.hasAccess,
      tier: baseValidation.tier,
      status: baseValidation.status,
      message: SubscriptionValidator.getStatusMessage(baseValidation),
    };
  }

  /**
   * Check if user should be prompted to upgrade
   */
  static shouldPromptUpgrade(
    subscription: SubscriptionData,
    trialData?: TrialPeriodData
  ): {
    shouldPrompt: boolean;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    // Free tier users - low urgency
    if (subscription.tier === 'free') {
      return {
        shouldPrompt: true,
        reason: 'Upgrade to Pro for advanced features',
        urgency: 'low',
      };
    }

    // Trial users - check expiration
    if (subscription.status === 'trial' && trialData) {
      const trialStatus = TrialPeriodManager.checkTrialStatus(trialData);

      if (trialStatus.isExpired) {
        return {
          shouldPrompt: true,
          reason: 'Your trial has ended. Upgrade to continue.',
          urgency: 'high',
        };
      }

      if (trialStatus.shouldPromptUpgrade) {
        return {
          shouldPrompt: true,
          reason: `Trial ending in ${trialStatus.daysRemaining} days`,
          urgency: trialStatus.daysRemaining <= 1 ? 'high' : 'medium',
        };
      }
    }

    // Expired or past due subscriptions
    if (subscription.status === 'expired' || subscription.status === 'past_due') {
      return {
        shouldPrompt: true,
        reason: 'Subscription expired. Renew to continue.',
        urgency: 'high',
      };
    }

    return {
      shouldPrompt: false,
      reason: '',
      urgency: 'low',
    };
  }

  /**
   * Get feature access with trial consideration
   */
  static canAccessFeature(
    subscription: SubscriptionData,
    feature: string,
    trialData?: TrialPeriodData
  ): {
    hasAccess: boolean;
    reason?: string;
  } {
    const validation = this.validateWithTrial(subscription, trialData);

    if (!validation.hasAccess) {
      return {
        hasAccess: false,
        reason: validation.message,
      };
    }

    // Trial users get Pro features
    if (validation.trialInfo?.isInTrial) {
      return {
        hasAccess: true,
      };
    }

    // Check tier-based access
    if (validation.tier === 'free') {
      // Check if feature is available in free tier
      const freeFeatures = [
        'basic_meal_plan',
        'simple_workout',
        'basic_macros',
        'progress_tracking',
      ];

      if (!freeFeatures.includes(feature)) {
        return {
          hasAccess: false,
          reason: 'This feature requires a Pro subscription',
        };
      }
    }

    return {
      hasAccess: true,
    };
  }
}

/**
 * Trial to Subscription Converter
 * Handles conversion workflows
 */
export class TrialToSubscriptionConverter {
  /**
   * Convert trial to paid subscription
   */
  static convertToPaid(
    trialData: TrialPeriodData,
    paymentVerified: boolean = false
  ): {
    success: boolean;
    newSubscription?: SubscriptionData;
    error?: string;
  } {
    if (!paymentVerified) {
      return {
        success: false,
        error: 'Payment verification required',
      };
    }

    const { updatedTrialData } = TrialPeriodManager.convertTrialToPaid(
      trialData,
      'pro',
      'manual'
    );

    // Create new subscription data
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    const newSubscription: SubscriptionData = {
      tier: 'pro',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentStatus: 'paid',
    };

    return {
      success: true,
      newSubscription,
    };
  }

  /**
   * Convert trial to free tier (on expiration)
   */
  static convertToFree(trialData: TrialPeriodData): {
    success: boolean;
    newSubscription: SubscriptionData;
  } {
    const { updatedTrialData } = TrialPeriodManager.convertTrialToPaid(
      trialData,
      'free',
      'auto'
    );

    const newSubscription: SubscriptionData = {
      tier: 'free',
      status: 'active',
    };

    return {
      success: true,
      newSubscription,
    };
  }
}

/**
 * Subscription Status Helper with Trial Support
 */
export class SubscriptionStatusHelper {
  /**
   * Get comprehensive status message
   */
  static getStatusMessage(
    subscription: SubscriptionData,
    trialData?: TrialPeriodData
  ): string {
    if (subscription.status === 'trial' && trialData) {
      const trialStatus = TrialPeriodManager.checkTrialStatus(trialData);
      return trialStatus.message;
    }

    return SubscriptionValidator.getStatusMessage(
      SubscriptionValidator.validateSubscription(subscription)
    );
  }

  /**
   * Get status badge info
   */
  static getStatusBadge(
    subscription: SubscriptionData,
    trialData?: TrialPeriodData
  ): {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
    icon?: string;
  } {
    if (subscription.status === 'trial' && trialData) {
      const trialStatus = TrialPeriodManager.checkTrialStatus(trialData);

      if (trialStatus.isExpired) {
        return { text: 'Trial Expired', color: 'red', icon: '⏰' };
      }

      if (trialStatus.shouldPromptUpgrade) {
        return {
          text: `Trial: ${trialStatus.daysRemaining}d left`,
          color: 'yellow',
          icon: '⚠️',
        };
      }

      return {
        text: `Trial: ${trialStatus.daysRemaining}d left`,
        color: 'blue',
        icon: '🎁',
      };
    }

    if (subscription.tier === 'pro' && subscription.status === 'active') {
      return { text: 'Pro', color: 'green', icon: '⭐' };
    }

    if (subscription.status === 'past_due') {
      return { text: 'Payment Due', color: 'red', icon: '⚠️' };
    }

    if (subscription.status === 'cancelled') {
      return { text: 'Cancelled', color: 'yellow', icon: '⏸️' };
    }

    if (subscription.status === 'expired') {
      return { text: 'Expired', color: 'red', icon: '❌' };
    }

    return { text: 'Free', color: 'blue', icon: '👤' };
  }

  /**
   * Check if user needs attention (payment, expiration, etc.)
   */
  static needsAttention(
    subscription: SubscriptionData,
    trialData?: TrialPeriodData
  ): {
    needsAttention: boolean;
    reason?: string;
    action?: string;
  } {
    // Trial expiring soon
    if (subscription.status === 'trial' && trialData) {
      const trialStatus = TrialPeriodManager.checkTrialStatus(trialData);

      if (trialStatus.isExpired) {
        return {
          needsAttention: true,
          reason: 'Trial has expired',
          action: 'Upgrade to Pro',
        };
      }

      if (trialStatus.shouldPromptUpgrade) {
        return {
          needsAttention: true,
          reason: `Trial ending in ${trialStatus.daysRemaining} days`,
          action: 'Upgrade now',
        };
      }
    }

    // Payment issues
    if (subscription.status === 'past_due') {
      return {
        needsAttention: true,
        reason: 'Payment failed',
        action: 'Update payment method',
      };
    }

    // Expired subscription
    if (subscription.status === 'expired') {
      return {
        needsAttention: true,
        reason: 'Subscription expired',
        action: 'Renew subscription',
      };
    }

    return {
      needsAttention: false,
    };
  }
}

/**
 * Helper function to create subscription data from trial
 */
export function createSubscriptionFromTrial(
  trialData: TrialPeriodData
): SubscriptionData {
  return TrialPeriodManager.createSubscriptionFromTrial(trialData);
}

/**
 * Helper function to check trial eligibility
 */
export function checkTrialEligibility(
  hasHadTrialBefore: boolean,
  allowMultipleTrials: boolean = false
): {
  eligible: boolean;
  reason?: string;
} {
  const eligible = TrialPeriodManager.isEligibleForTrial(
    hasHadTrialBefore,
    allowMultipleTrials
  );

  if (!eligible) {
    return {
      eligible: false,
      reason: 'You have already used your trial period',
    };
  }

  return {
    eligible: true,
  };
}
