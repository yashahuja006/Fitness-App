/**
 * Tests for Client-Side Subscription Validation
 */

import {
  ClientSubscriptionValidator,
  SubscriptionHooks,
  PRO_FEATURES,
  FREE_FEATURES,
} from '../clientSubscriptionValidation';
import { SubscriptionData } from '../../lib/subscriptionValidation';

describe('ClientSubscriptionValidator', () => {
  describe('canAccessProFeature', () => {
    it('should allow Pro user to access Pro features', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = ClientSubscriptionValidator.canAccessProFeature(
        subscription,
        PRO_FEATURES.MACRO_CYCLING
      );

      expect(result.hasAccess).toBe(true);
      expect(result.requiresUpgrade).toBe(false);
    });

    it('should deny free user access to Pro features', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = ClientSubscriptionValidator.canAccessProFeature(
        subscription,
        PRO_FEATURES.MACRO_CYCLING
      );

      expect(result.hasAccess).toBe(false);
      expect(result.requiresUpgrade).toBe(true);
      expect(result.upgradeMessage).toContain('Upgrade to Pro');
    });

    it('should deny expired Pro user access to Pro features', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'expired',
      };

      const result = ClientSubscriptionValidator.canAccessProFeature(
        subscription,
        PRO_FEATURES.GROCERY_OPTIMIZATION
      );

      expect(result.hasAccess).toBe(false);
      expect(result.requiresUpgrade).toBe(true);
    });
  });

  describe('canAccessFeature', () => {
    it('should allow free user to access free features', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = ClientSubscriptionValidator.canAccessFeature(
        subscription,
        FREE_FEATURES.BASIC_MEAL_PLAN
      );

      expect(result.hasAccess).toBe(true);
      expect(result.requiresUpgrade).toBe(false);
    });

    it('should allow Pro user to access free features', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = ClientSubscriptionValidator.canAccessFeature(
        subscription,
        FREE_FEATURES.PROGRESS_TRACKING
      );

      expect(result.hasAccess).toBe(true);
      expect(result.requiresUpgrade).toBe(false);
    });

    it('should deny free user access to Pro features', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = ClientSubscriptionValidator.canAccessFeature(
        subscription,
        PRO_FEATURES.CARB_CYCLING
      );

      expect(result.hasAccess).toBe(false);
      expect(result.requiresUpgrade).toBe(true);
    });
  });

  describe('getAvailableFeatures', () => {
    it('should return only free features for free tier', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const features = ClientSubscriptionValidator.getAvailableFeatures(subscription);

      expect(features).toContain(FREE_FEATURES.BASIC_MEAL_PLAN);
      expect(features).not.toContain(PRO_FEATURES.MACRO_CYCLING);
    });

    it('should return all features for Pro tier', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const features = ClientSubscriptionValidator.getAvailableFeatures(subscription);

      expect(features).toContain(FREE_FEATURES.BASIC_MEAL_PLAN);
      expect(features).toContain(PRO_FEATURES.MACRO_CYCLING);
      expect(features).toContain(PRO_FEATURES.GROCERY_OPTIMIZATION);
    });

    it('should return only free features for expired Pro', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'expired',
      };

      const features = ClientSubscriptionValidator.getAvailableFeatures(subscription);

      expect(features).toContain(FREE_FEATURES.BASIC_MEAL_PLAN);
      expect(features).not.toContain(PRO_FEATURES.MACRO_CYCLING);
    });
  });

  describe('getLockedFeatures', () => {
    it('should return all Pro features for free tier', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const locked = ClientSubscriptionValidator.getLockedFeatures(subscription);

      expect(locked).toContain(PRO_FEATURES.MACRO_CYCLING);
      expect(locked).toContain(PRO_FEATURES.GROCERY_OPTIMIZATION);
      expect(locked.length).toBeGreaterThan(0);
    });

    it('should return empty array for active Pro tier', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const locked = ClientSubscriptionValidator.getLockedFeatures(subscription);

      expect(locked).toEqual([]);
    });
  });

  describe('needsAttention', () => {
    it('should return error for past_due status', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };

      const result = ClientSubscriptionValidator.needsAttention(subscription);

      expect(result.needsAttention).toBe(true);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('Payment failed');
    });

    it('should return warning for cancelled status', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      };

      const result = ClientSubscriptionValidator.needsAttention(subscription);

      expect(result.needsAttention).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('cancelled');
    });

    it('should return info for trial ending soon', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      };

      const result = ClientSubscriptionValidator.needsAttention(subscription);

      expect(result.needsAttention).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.message).toContain('Trial ends');
    });

    it('should not need attention for active subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = ClientSubscriptionValidator.needsAttention(subscription);

      expect(result.needsAttention).toBe(false);
    });

    it('should return error for incomplete status', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'incomplete',
      };

      const result = ClientSubscriptionValidator.needsAttention(subscription);

      expect(result.needsAttention).toBe(true);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('incomplete');
    });
  });

  describe('getStatusBadge', () => {
    it('should return gray badge for free tier', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const badge = ClientSubscriptionValidator.getStatusBadge(subscription);

      expect(badge.label).toBe('Free');
      expect(badge.color).toBe('gray');
    });

    it('should return green badge for active Pro', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const badge = ClientSubscriptionValidator.getStatusBadge(subscription);

      expect(badge.label).toBe('Pro');
      expect(badge.color).toBe('green');
    });

    it('should return blue badge for trial', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const badge = ClientSubscriptionValidator.getStatusBadge(subscription);

      expect(badge.label).toBe('Pro Trial');
      expect(badge.color).toBe('blue');
    });

    it('should return red badge for past_due', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };

      const badge = ClientSubscriptionValidator.getStatusBadge(subscription);

      expect(badge.label).toBe('Payment Due');
      expect(badge.color).toBe('red');
    });

    it('should return yellow badge for cancelled', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      };

      const badge = ClientSubscriptionValidator.getStatusBadge(subscription);

      expect(badge.label).toBe('Cancelled');
      expect(badge.color).toBe('yellow');
    });
  });
});

describe('SubscriptionHooks', () => {
  describe('shouldShowUpgradePrompt', () => {
    it('should return true for free user accessing Pro feature', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const result = SubscriptionHooks.shouldShowUpgradePrompt(
        subscription,
        PRO_FEATURES.MACRO_CYCLING
      );

      expect(result).toBe(true);
    });

    it('should return false for Pro user accessing Pro feature', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const result = SubscriptionHooks.shouldShowUpgradePrompt(
        subscription,
        PRO_FEATURES.MACRO_CYCLING
      );

      expect(result).toBe(false);
    });
  });

  describe('getFeatureGateProps', () => {
    it('should return locked props for free user', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      const props = SubscriptionHooks.getFeatureGateProps(
        subscription,
        PRO_FEATURES.GROCERY_OPTIMIZATION
      );

      expect(props.isLocked).toBe(true);
      expect(props.canAccess).toBe(false);
      expect(props.upgradeMessage).toContain('Upgrade to Pro');
    });

    it('should return unlocked props for Pro user', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const props = SubscriptionHooks.getFeatureGateProps(
        subscription,
        PRO_FEATURES.GROCERY_OPTIMIZATION
      );

      expect(props.isLocked).toBe(false);
      expect(props.canAccess).toBe(true);
    });
  });

  describe('getSubscriptionAlertProps', () => {
    it('should return null for active subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const props = SubscriptionHooks.getSubscriptionAlertProps(subscription);

      expect(props).toBeNull();
    });

    it('should return alert for past_due subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'past_due',
        gracePeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };

      const props = SubscriptionHooks.getSubscriptionAlertProps(subscription);

      expect(props).not.toBeNull();
      expect(props?.show).toBe(true);
      expect(props?.severity).toBe('error');
      expect(props?.action).toBe('Update Payment');
    });

    it('should return alert for trial ending soon', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      };

      const props = SubscriptionHooks.getSubscriptionAlertProps(subscription);

      expect(props).not.toBeNull();
      expect(props?.show).toBe(true);
      expect(props?.severity).toBe('info');
      expect(props?.action).toBe('Upgrade Now');
    });

    it('should return alert for incomplete subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'incomplete',
      };

      const props = SubscriptionHooks.getSubscriptionAlertProps(subscription);

      expect(props).not.toBeNull();
      expect(props?.show).toBe(true);
      expect(props?.severity).toBe('error');
      expect(props?.action).toBe('Complete Setup');
    });
  });
});
