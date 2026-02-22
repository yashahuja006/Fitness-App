/**
 * Trial Period Management Tests
 */

import {
  TrialPeriodManager,
  TrialConversionHandler,
  TrialPeriodValidator,
  TrialPeriodData,
  isInTrialPeriod,
  getTrialDaysRemaining,
  isTrialExpiringSoon,
  getTrialProgress,
} from '../trialPeriodManagement';
import { SubscriptionData } from '../subscriptionValidation';

describe('TrialPeriodManager', () => {
  describe('initializeTrial', () => {
    it('should initialize a trial with default duration', () => {
      const userId = 'user-123';
      const trial = TrialPeriodManager.initializeTrial(userId);

      expect(trial.userId).toBe(userId);
      expect(trial.trialDurationDays).toBe(14);
      expect(trial.isActive).toBe(true);
      expect(trial.hasExpired).toBe(false);
      expect(trial.hasConverted).toBe(false);
      expect(trial.trialStartDate).toBeInstanceOf(Date);
      expect(trial.trialEndDate).toBeInstanceOf(Date);
      expect(trial.trialEndDate.getTime()).toBeGreaterThan(
        trial.trialStartDate.getTime()
      );
    });

    it('should initialize a trial with custom duration', () => {
      const userId = 'user-123';
      const customDays = 30;
      const trial = TrialPeriodManager.initializeTrial(userId, customDays);

      expect(trial.trialDurationDays).toBe(customDays);
    });

    it('should set trial end date correctly', () => {
      const userId = 'user-123';
      const days = 7;
      const trial = TrialPeriodManager.initializeTrial(userId, days);

      const expectedEndDate = new Date(trial.trialStartDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + days);

      expect(trial.trialEndDate.toDateString()).toBe(
        expectedEndDate.toDateString()
      );
    });
  });

  describe('checkTrialStatus', () => {
    it('should return active status for ongoing trial', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        trialEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const status = TrialPeriodManager.checkTrialStatus(trialData);

      expect(status.isInTrial).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.canAccess).toBe(true);
      expect(status.daysRemaining).toBeGreaterThan(0);
    });

    it('should return expired status for past trial', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        trialDurationDays: 14,
        isActive: false,
        hasExpired: true,
        hasConverted: false,
      };

      const status = TrialPeriodManager.checkTrialStatus(trialData);

      expect(status.isInTrial).toBe(false);
      expect(status.isExpired).toBe(true);
      expect(status.canAccess).toBe(false);
      expect(status.daysRemaining).toBe(0);
      expect(status.shouldPromptUpgrade).toBe(true);
    });

    it('should prompt upgrade when trial is expiring soon', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const status = TrialPeriodManager.checkTrialStatus(trialData);

      expect(status.isInTrial).toBe(true);
      expect(status.shouldPromptUpgrade).toBe(true);
      expect(status.daysRemaining).toBeLessThanOrEqual(3);
    });

    it('should return converted status for converted trial', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: false,
        hasExpired: false,
        hasConverted: true,
        convertedAt: new Date(),
        convertedToTier: 'pro',
      };

      const status = TrialPeriodManager.checkTrialStatus(trialData);

      expect(status.isInTrial).toBe(false);
      expect(status.canAccess).toBe(true);
      expect(status.message).toContain('converted');
    });
  });

  describe('convertTrialToPaid', () => {
    it('should convert trial to pro tier', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialPeriodManager.convertTrialToPaid(
        trialData,
        'pro',
        'manual'
      );

      expect(result.updatedTrialData.hasConverted).toBe(true);
      expect(result.updatedTrialData.convertedToTier).toBe('pro');
      expect(result.updatedTrialData.isActive).toBe(false);
      expect(result.conversionData.fromTrial).toBe(true);
      expect(result.conversionData.toTier).toBe('pro');
      expect(result.conversionData.conversionReason).toBe('manual');
    });

    it('should convert trial to free tier', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialPeriodManager.convertTrialToPaid(
        trialData,
        'free',
        'auto'
      );

      expect(result.updatedTrialData.convertedToTier).toBe('free');
      expect(result.conversionData.conversionReason).toBe('auto');
    });
  });

  describe('expireTrial', () => {
    it('should mark trial as expired', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const expired = TrialPeriodManager.expireTrial(trialData);

      expect(expired.isActive).toBe(false);
      expect(expired.hasExpired).toBe(true);
    });
  });

  describe('cancelTrial', () => {
    it('should cancel trial with reason', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const reason = 'User requested cancellation';
      const cancelled = TrialPeriodManager.cancelTrial(trialData, reason);

      expect(cancelled.isActive).toBe(false);
      expect(cancelled.cancellationReason).toBe(reason);
      expect(cancelled.cancellationDate).toBeInstanceOf(Date);
    });
  });

  describe('extendTrial', () => {
    it('should extend trial by additional days', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const additionalDays = 7;
      const extended = TrialPeriodManager.extendTrial(trialData, additionalDays);

      expect(extended.trialDurationDays).toBe(21);
      expect(extended.trialEndDate.getTime()).toBeGreaterThan(
        trialData.trialEndDate.getTime()
      );
    });
  });

  describe('isEligibleForTrial', () => {
    it('should allow trial if user has not had one before', () => {
      const eligible = TrialPeriodManager.isEligibleForTrial(false, false);
      expect(eligible).toBe(true);
    });

    it('should not allow trial if user has had one before', () => {
      const eligible = TrialPeriodManager.isEligibleForTrial(true, false);
      expect(eligible).toBe(false);
    });

    it('should allow multiple trials if configured', () => {
      const eligible = TrialPeriodManager.isEligibleForTrial(true, true);
      expect(eligible).toBe(true);
    });
  });

  describe('getTrialWarningMessage', () => {
    it('should return null for trials with many days remaining', () => {
      const message = TrialPeriodManager.getTrialWarningMessage(10);
      expect(message).toBeNull();
    });

    it('should return warning for trials expiring soon', () => {
      const message = TrialPeriodManager.getTrialWarningMessage(2);
      expect(message).toContain('2 days');
    });

    it('should return urgent message for last day', () => {
      const message = TrialPeriodManager.getTrialWarningMessage(1);
      expect(message).toContain('tomorrow');
    });

    it('should return expired message for 0 days', () => {
      const message = TrialPeriodManager.getTrialWarningMessage(0);
      expect(message).toContain('ended');
    });
  });
});

describe('TrialConversionHandler', () => {
  describe('processConversion', () => {
    it('should successfully convert trial with payment verification', async () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = await TrialConversionHandler.processConversion(
        trialData,
        'pro',
        true
      );

      expect(result.success).toBe(true);
      expect(result.updatedTrialData?.hasConverted).toBe(true);
      expect(result.conversionData?.toTier).toBe('pro');
    });

    it('should fail conversion without payment verification', async () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = await TrialConversionHandler.processConversion(
        trialData,
        'pro',
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment verification required');
    });

    it('should fail if trial already converted', async () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: false,
        hasExpired: false,
        hasConverted: true,
        convertedAt: new Date(),
        convertedToTier: 'pro',
      };

      const result = await TrialConversionHandler.processConversion(
        trialData,
        'pro',
        true
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already been converted');
    });
  });

  describe('handleTrialExpiry', () => {
    it('should convert to free on expiry by default', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialConversionHandler.handleTrialExpiry(trialData, true);

      expect(result.action).toBe('convert_to_free');
      expect(result.updatedTrialData.hasConverted).toBe(true);
      expect(result.conversionData?.toTier).toBe('free');
    });

    it('should just expire without conversion if configured', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialConversionHandler.handleTrialExpiry(trialData, false);

      expect(result.action).toBe('expire');
      expect(result.updatedTrialData.hasExpired).toBe(true);
    });
  });
});

describe('TrialPeriodValidator', () => {
  describe('validateTrialData', () => {
    it('should validate correct trial data', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialPeriodValidator.validateTrialData(trialData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject trial with missing user ID', () => {
      const trialData: TrialPeriodData = {
        userId: '',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialPeriodValidator.validateTrialData(trialData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should reject trial with end date before start date', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialPeriodValidator.validateTrialData(trialData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trial end date must be after start date');
    });

    it('should reject trial with excessive duration', () => {
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
        trialDurationDays: 100,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const result = TrialPeriodValidator.validateTrialData(trialData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trial duration cannot exceed 90 days');
    });
  });
});

describe('Helper Functions', () => {
  describe('isInTrialPeriod', () => {
    it('should return true for trial subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      };

      expect(isInTrialPeriod(subscription)).toBe(true);
    });

    it('should return false for non-trial subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'active',
      };

      expect(isInTrialPeriod(subscription)).toBe(false);
    });
  });

  describe('getTrialDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      };

      const days = getTrialDaysRemaining(subscription);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    it('should return 0 for non-trial subscription', () => {
      const subscription: SubscriptionData = {
        tier: 'free',
        status: 'active',
      };

      expect(getTrialDaysRemaining(subscription)).toBe(0);
    });
  });

  describe('isTrialExpiringSoon', () => {
    it('should return true for trial expiring within threshold', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };

      expect(isTrialExpiringSoon(subscription, 3)).toBe(true);
    });

    it('should return false for trial with many days remaining', () => {
      const subscription: SubscriptionData = {
        tier: 'pro',
        status: 'trial',
        trialEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      };

      expect(isTrialExpiringSoon(subscription, 3)).toBe(false);
    });
  });

  describe('getTrialProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const now = new Date();
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        trialEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        trialDurationDays: 14,
        isActive: true,
        hasExpired: false,
        hasConverted: false,
      };

      const progress = getTrialProgress(trialData);
      expect(progress).toBeGreaterThanOrEqual(45);
      expect(progress).toBeLessThanOrEqual(55);
    });

    it('should not exceed 100%', () => {
      const now = new Date();
      const trialData: TrialPeriodData = {
        userId: 'user-123',
        trialStartDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        trialDurationDays: 14,
        isActive: false,
        hasExpired: true,
        hasConverted: false,
      };

      const progress = getTrialProgress(trialData);
      expect(progress).toBe(100);
    });
  });
});
