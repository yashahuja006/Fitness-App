/**
 * Tests for Subscription Validation System
 */

import {
  SubscriptionValidator,
  SubscriptionStatusChecker,
  SubscriptionData,
  SubscriptionStatus,
} from '../subscriptionValidation';

describe('SubscriptionValidator', () => {
  describe('validateSubscription', () => {
    it('should validate free tier as always active', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('active');
      expect(result.tier).toBe('free');
      expect(result.hasAccess).toBe(true);
    });

    it('should validate active Pro subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentStatus: 'paid',
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('active');
      expect(result.tier).toBe('pro');
      expect(result.hasAccess).toBe(true);
    });

    it('should invalidate expired Pro subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        paymentStatus: 'paid',
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.hasAccess).toBe(false);
      expect(result.shouldDowngrade).toBe(true);
      expect(result.reason).toContain('ended');
    });

    it('should validate trial subscription within trial period', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('trial');
      expect(result.hasAccess).toBe(true);
    });

    it('should invalidate expired trial subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.hasAccess).toBe(false);
      expect(result.shouldDowngrade).toBe(true);
    });

    it('should validate cancelled subscription still in paid period', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        cancelAtPeriodEnd: true,
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('cancelled');
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toContain('cancelled');
    });

    it('should invalidate cancelled subscription after period end', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        cancelAtPeriodEnd: true,
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.hasAccess).toBe(false);
      expect(result.shouldDowngrade).toBe(true);
    });

    it('should validate past_due subscription in grace period', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        paymentStatus: 'failed',
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(true);
      expect(result.status).toBe('past_due');
      expect(result.hasAccess).toBe(true);
      expect(result.gracePeriodRemaining).toBe(2);
      expect(result.reason).toContain('grace period');
    });

    it('should invalidate past_due subscription after grace period', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        paymentStatus: 'failed',
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.hasAccess).toBe(false);
      expect(result.shouldDowngrade).toBe(true);
    });

    it('should invalidate incomplete subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'incomplete',
        paymentStatus: 'pending',
      };

      const result = SubscriptionValidator.validateSubscription(subscription);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe('incomplete');
      expect(result.hasAccess).toBe(false);
      expect(result.shouldDowngrade).toBe(true);
    });
  });

  describe('verifyTierMatch', () => {
    it('should return true when tiers match', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
      };

      const result = SubscriptionValidator.verifyTierMatch('pro', subscription);

      expect(result).toBe(true);
    });

    it('should return false when tiers do not match', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionValidator.verifyTierMatch('pro', subscription);

      expect(result).toBe(false);
    });
  });

  describe('isPaymentCurrent', () => {
    it('should return true for free tier', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionValidator.isPaymentCurrent(subscription);

      expect(result).toBe(true);
    });

    it('should return true for paid Pro subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        paymentStatus: 'paid',
      };

      const result = SubscriptionValidator.isPaymentCurrent(subscription);

      expect(result).toBe(true);
    });

    it('should return false for failed payment', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        paymentStatus: 'failed',
      };

      const result = SubscriptionValidator.isPaymentCurrent(subscription);

      expect(result).toBe(false);
    });

    it('should return false for pending payment', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'incomplete',
        paymentStatus: 'pending',
      };

      const result = SubscriptionValidator.isPaymentCurrent(subscription);

      expect(result).toBe(false);
    });
  });

  describe('calculateGracePeriodEnd', () => {
    it('should calculate grace period end 3 days from now', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const result = SubscriptionValidator.calculateGracePeriodEnd(now);

      const expected = new Date('2024-01-04T00:00:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('getStatusMessage', () => {
    it('should return active message for active subscription', () => {
      const validation = {
        isValid: true,
        status: 'active' as SubscriptionStatus,
        tier: 'pro' as const,
        hasAccess: true,
      };

      const message = SubscriptionValidator.getStatusMessage(validation);

      expect(message).toContain('active');
    });

    it('should return grace period message for past_due', () => {
      const validation = {
        isValid: true,
        status: 'past_due' as SubscriptionStatus,
        tier: 'pro' as const,
        hasAccess: true,
        gracePeriodRemaining: 2,
      };

      const message = SubscriptionValidator.getStatusMessage(validation);

      expect(message).toContain('Payment failed');
      expect(message).toContain('2 days');
    });

    it('should return cancelled message', () => {
      const validation = {
        isValid: true,
        status: 'cancelled' as SubscriptionStatus,
        tier: 'pro' as const,
        hasAccess: true,
      };

      const message = SubscriptionValidator.getStatusMessage(validation);

      expect(message).toContain('cancelled');
    });
  });
});

describe('SubscriptionStatusChecker', () => {
  describe('hasProAccess', () => {
    it('should return true for active Pro subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = SubscriptionStatusChecker.hasProAccess(subscription);

      expect(result).toBe(true);
    });

    it('should return false for free tier', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionStatusChecker.hasProAccess(subscription);

      expect(result).toBe(false);
    });

    it('should return false for expired Pro subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'expired',
      };

      const result = SubscriptionStatusChecker.hasProAccess(subscription);

      expect(result).toBe(false);
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true for free tier', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionStatusChecker.hasActiveSubscription(subscription);

      expect(result).toBe(true);
    });

    it('should return true for active Pro', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = SubscriptionStatusChecker.hasActiveSubscription(subscription);

      expect(result).toBe(true);
    });

    it('should return false for expired subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'expired',
      };

      const result = SubscriptionStatusChecker.hasActiveSubscription(subscription);

      expect(result).toBe(false);
    });
  });

  describe('isInGracePeriod', () => {
    it('should return true for past_due status', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };

      const result = SubscriptionStatusChecker.isInGracePeriod(subscription);

      expect(result).toBe(true);
    });

    it('should return false for active status', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
      };

      const result = SubscriptionStatusChecker.isInGracePeriod(subscription);

      expect(result).toBe(false);
    });
  });

  describe('isCancelledButActive', () => {
    it('should return true for cancelled subscription in paid period', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      };

      const result = SubscriptionStatusChecker.isCancelledButActive(subscription);

      expect(result).toBe(true);
    });

    it('should return false for cancelled subscription after period end', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      };

      const result = SubscriptionStatusChecker.isCancelledButActive(subscription);

      expect(result).toBe(false);
    });

    it('should return false for active subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
      };

      const result = SubscriptionStatusChecker.isCancelledButActive(subscription);

      expect(result).toBe(false);
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return days until period end for active subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      };

      const result = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);

      expect(result).toBe(10);
    });

    it('should return days until trial end for trial subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      };

      const result = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);

      expect(result).toBe(5);
    });

    it('should return days until grace period end for past_due', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      };

      const result = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);

      expect(result).toBe(2);
    });

    it('should return null when no expiry date available', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);

      expect(result).toBeNull();
    });

    it('should return 0 for expired subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      };

      const result = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);

      expect(result).toBe(0);
    });
  });
});
