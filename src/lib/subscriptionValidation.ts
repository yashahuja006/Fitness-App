/**
 * Subscription Status Validation System
 * Validates subscription status, payment status, and tier access
 */

export type SubscriptionStatus = 
  | 'active'      // Valid, paid subscription
  | 'trial'       // Trial period
  | 'expired'     // Subscription ended
  | 'cancelled'   // User cancelled but still in paid period
  | 'past_due'    // Payment failed, in grace period
  | 'incomplete'; // Payment incomplete

export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
  gracePeriodEnd?: Date;
  paymentStatus?: 'paid' | 'pending' | 'failed';
}

export interface SubscriptionValidationResult {
  isValid: boolean;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  hasAccess: boolean;
  reason?: string;
  shouldDowngrade?: boolean;
  gracePeriodRemaining?: number; // days
}

/**
 * Validates subscription status and determines access rights
 */
export class SubscriptionValidator {
  private static readonly GRACE_PERIOD_DAYS = 3;

  /**
   * Validate subscription status and access
   */
  static validateSubscription(
    subscription: SubscriptionData
  ): SubscriptionValidationResult {
    const now = new Date();

    // Free tier always has access to free features
    if (subscription.tier === 'free') {
      return {
        isValid: true,
        status: 'active',
        tier: 'free',
        hasAccess: true,
      };
    }

    // Pro tier validation
    return this.validateProSubscription(subscription, now);
  }

  /**
   * Validate Pro subscription with all status checks
   */
  private static validateProSubscription(
    subscription: SubscriptionData,
    now: Date
  ): SubscriptionValidationResult {
    const { status, currentPeriodEnd, gracePeriodEnd, trialEnd } = subscription;

    // Check trial status
    if (status === 'trial') {
      if (trialEnd && now > trialEnd) {
        return {
          isValid: false,
          status: 'expired',
          tier: 'pro',
          hasAccess: false,
          reason: 'Trial period has ended',
          shouldDowngrade: true,
        };
      }
      return {
        isValid: true,
        status: 'trial',
        tier: 'pro',
        hasAccess: true,
      };
    }

    // Check active status
    if (status === 'active') {
      if (currentPeriodEnd && now > currentPeriodEnd) {
        return {
          isValid: false,
          status: 'expired',
          tier: 'pro',
          hasAccess: false,
          reason: 'Subscription period has ended',
          shouldDowngrade: true,
        };
      }
      return {
        isValid: true,
        status: 'active',
        tier: 'pro',
        hasAccess: true,
      };
    }

    // Check cancelled status (still has access until period end)
    if (status === 'cancelled') {
      if (currentPeriodEnd && now <= currentPeriodEnd) {
        return {
          isValid: true,
          status: 'cancelled',
          tier: 'pro',
          hasAccess: true,
          reason: 'Subscription cancelled but still active until period end',
        };
      }
      return {
        isValid: false,
        status: 'expired',
        tier: 'pro',
        hasAccess: false,
        reason: 'Cancelled subscription period has ended',
        shouldDowngrade: true,
      };
    }

    // Check past_due status (grace period)
    if (status === 'past_due') {
      if (gracePeriodEnd && now <= gracePeriodEnd) {
        const daysRemaining = Math.ceil(
          (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          isValid: true,
          status: 'past_due',
          tier: 'pro',
          hasAccess: true,
          reason: 'Payment failed, in grace period',
          gracePeriodRemaining: daysRemaining,
        };
      }
      return {
        isValid: false,
        status: 'expired',
        tier: 'pro',
        hasAccess: false,
        reason: 'Grace period has ended',
        shouldDowngrade: true,
      };
    }

    // Expired or incomplete status
    if (status === 'expired' || status === 'incomplete') {
      return {
        isValid: false,
        status,
        tier: 'pro',
        hasAccess: false,
        reason: status === 'expired' ? 'Subscription has expired' : 'Payment incomplete',
        shouldDowngrade: true,
      };
    }

    // Default: invalid
    return {
      isValid: false,
      status: 'expired',
      tier: 'pro',
      hasAccess: false,
      reason: 'Unknown subscription status',
      shouldDowngrade: true,
    };
  }

  /**
   * Check if subscription tier matches claimed tier
   */
  static verifyTierMatch(
    claimedTier: SubscriptionTier,
    actualSubscription: SubscriptionData
  ): boolean {
    return claimedTier === actualSubscription.tier;
  }

  /**
   * Check if payment status is current
   */
  static isPaymentCurrent(subscription: SubscriptionData): boolean {
    if (subscription.tier === 'free') {
      return true;
    }

    const paymentStatus = subscription.paymentStatus || 'pending';
    return paymentStatus === 'paid';
  }

  /**
   * Calculate grace period end date from current date
   */
  static calculateGracePeriodEnd(fromDate: Date = new Date()): Date {
    const gracePeriodEnd = new Date(fromDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.GRACE_PERIOD_DAYS);
    return gracePeriodEnd;
  }

  /**
   * Determine if subscription should be downgraded
   */
  static shouldDowngradeToFree(
    validation: SubscriptionValidationResult
  ): boolean {
    return validation.shouldDowngrade === true;
  }

  /**
   * Get user-friendly status message
   */
  static getStatusMessage(validation: SubscriptionValidationResult): string {
    if (validation.hasAccess) {
      if (validation.status === 'past_due') {
        return `Payment failed. You have ${validation.gracePeriodRemaining} days remaining to update payment.`;
      }
      if (validation.status === 'cancelled') {
        return 'Your subscription is cancelled but remains active until the end of the billing period.';
      }
      if (validation.status === 'trial') {
        return 'You are currently on a trial period.';
      }
      return 'Your subscription is active.';
    }

    return validation.reason || 'Subscription is not active.';
  }
}

/**
 * Subscription status checker utility
 */
export class SubscriptionStatusChecker {
  /**
   * Quick check if user has Pro access
   */
  static hasProAccess(subscription: SubscriptionData): boolean {
    const validation = SubscriptionValidator.validateSubscription(subscription);
    return validation.tier === 'pro' && validation.hasAccess;
  }

  /**
   * Quick check if user has any active subscription
   */
  static hasActiveSubscription(subscription: SubscriptionData): boolean {
    const validation = SubscriptionValidator.validateSubscription(subscription);
    return validation.hasAccess;
  }

  /**
   * Check if subscription is in grace period
   */
  static isInGracePeriod(subscription: SubscriptionData): boolean {
    return subscription.status === 'past_due';
  }

  /**
   * Check if subscription is cancelled but still active
   */
  static isCancelledButActive(subscription: SubscriptionData): boolean {
    if (subscription.status !== 'cancelled') {
      return false;
    }
    const validation = SubscriptionValidator.validateSubscription(subscription);
    return validation.hasAccess;
  }

  /**
   * Get days until subscription expires
   */
  static getDaysUntilExpiry(subscription: SubscriptionData): number | null {
    const { currentPeriodEnd, trialEnd, gracePeriodEnd } = subscription;
    const now = new Date();

    let expiryDate: Date | undefined;

    if (subscription.status === 'trial' && trialEnd) {
      expiryDate = trialEnd;
    } else if (subscription.status === 'past_due' && gracePeriodEnd) {
      expiryDate = gracePeriodEnd;
    } else if (currentPeriodEnd) {
      expiryDate = currentPeriodEnd;
    }

    if (!expiryDate) {
      return null;
    }

    const daysRemaining = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysRemaining > 0 ? daysRemaining : 0;
  }
}
