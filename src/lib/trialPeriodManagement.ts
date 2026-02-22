/**
 * Trial Period Management System
 * Handles trial period tracking, validation, expiration, and conversion to paid subscriptions
 */

import { SubscriptionData, SubscriptionStatus, SubscriptionTier } from './subscriptionValidation';

export interface TrialPeriodData {
  userId: string;
  trialStartDate: Date;
  trialEndDate: Date;
  trialDurationDays: number;
  isActive: boolean;
  hasExpired: boolean;
  hasConverted: boolean;
  convertedAt?: Date;
  convertedToTier?: SubscriptionTier;
  cancellationDate?: Date;
  cancellationReason?: string;
}

export interface TrialStatusResult {
  isInTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  daysElapsed: number;
  canAccess: boolean;
  message: string;
  shouldPromptUpgrade: boolean;
}

export interface TrialConversionData {
  userId: string;
  fromTrial: boolean;
  toTier: SubscriptionTier;
  convertedAt: Date;
  trialDuration: number;
  conversionReason?: 'manual' | 'auto' | 'upgrade_prompt';
}

export interface TrialConfiguration {
  defaultTrialDays: number;
  warningThresholdDays: number;
  gracePeriodDays: number;
  allowMultipleTrials: boolean;
  requirePaymentMethod: boolean;
}

/**
 * Trial Period Manager
 * Core service for managing trial periods
 */
export class TrialPeriodManager {
  private static readonly DEFAULT_TRIAL_DAYS = 14;
  private static readonly WARNING_THRESHOLD_DAYS = 3;
  private static readonly GRACE_PERIOD_DAYS = 0; // No grace period for trials

  /**
   * Initialize a new trial period for a user
   */
  static initializeTrial(
    userId: string,
    trialDurationDays: number = this.DEFAULT_TRIAL_DAYS
  ): TrialPeriodData {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);

    return {
      userId,
      trialStartDate: now,
      trialEndDate,
      trialDurationDays,
      isActive: true,
      hasExpired: false,
      hasConverted: false,
    };
  }

  /**
   * Check trial status and determine access rights
   */
  static checkTrialStatus(trialData: TrialPeriodData): TrialStatusResult {
    const now = new Date();
    const { trialStartDate, trialEndDate, hasExpired, hasConverted } = trialData;

    // If already converted, no longer in trial
    if (hasConverted) {
      return {
        isInTrial: false,
        isExpired: false,
        daysRemaining: 0,
        daysElapsed: this.calculateDaysElapsed(trialStartDate, now),
        canAccess: true,
        message: 'Trial converted to paid subscription',
        shouldPromptUpgrade: false,
      };
    }

    // Calculate days remaining
    const daysRemaining = this.calculateDaysRemaining(now, trialEndDate);
    const daysElapsed = this.calculateDaysElapsed(trialStartDate, now);

    // Check if trial has expired
    if (now > trialEndDate || hasExpired) {
      return {
        isInTrial: false,
        isExpired: true,
        daysRemaining: 0,
        daysElapsed,
        canAccess: false,
        message: 'Trial period has ended. Please upgrade to continue.',
        shouldPromptUpgrade: true,
      };
    }

    // Trial is active
    const shouldPromptUpgrade = daysRemaining <= this.WARNING_THRESHOLD_DAYS;
    const message = shouldPromptUpgrade
      ? `Trial ending soon! ${daysRemaining} days remaining.`
      : `Trial active. ${daysRemaining} days remaining.`;

    return {
      isInTrial: true,
      isExpired: false,
      daysRemaining,
      daysElapsed,
      canAccess: true,
      message,
      shouldPromptUpgrade,
    };
  }

  /**
   * Handle trial expiration
   */
  static expireTrial(trialData: TrialPeriodData): TrialPeriodData {
    return {
      ...trialData,
      isActive: false,
      hasExpired: true,
    };
  }

  /**
   * Convert trial to paid subscription
   */
  static convertTrialToPaid(
    trialData: TrialPeriodData,
    targetTier: SubscriptionTier = 'pro',
    conversionReason?: TrialConversionData['conversionReason']
  ): {
    updatedTrialData: TrialPeriodData;
    conversionData: TrialConversionData;
  } {
    const now = new Date();

    const updatedTrialData: TrialPeriodData = {
      ...trialData,
      isActive: false,
      hasConverted: true,
      convertedAt: now,
      convertedToTier: targetTier,
    };

    const conversionData: TrialConversionData = {
      userId: trialData.userId,
      fromTrial: true,
      toTier: targetTier,
      convertedAt: now,
      trialDuration: this.calculateDaysElapsed(trialData.trialStartDate, now),
      conversionReason,
    };

    return {
      updatedTrialData,
      conversionData,
    };
  }

  /**
   * Cancel trial period
   */
  static cancelTrial(
    trialData: TrialPeriodData,
    reason?: string
  ): TrialPeriodData {
    return {
      ...trialData,
      isActive: false,
      cancellationDate: new Date(),
      cancellationReason: reason,
    };
  }

  /**
   * Extend trial period
   */
  static extendTrial(
    trialData: TrialPeriodData,
    additionalDays: number
  ): TrialPeriodData {
    const newEndDate = new Date(trialData.trialEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    return {
      ...trialData,
      trialEndDate: newEndDate,
      trialDurationDays: trialData.trialDurationDays + additionalDays,
    };
  }

  /**
   * Calculate days remaining in trial
   */
  private static calculateDaysRemaining(now: Date, endDate: Date): number {
    const msRemaining = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  /**
   * Calculate days elapsed since trial start
   */
  private static calculateDaysElapsed(startDate: Date, now: Date): number {
    const msElapsed = now.getTime() - startDate.getTime();
    return Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if user is eligible for trial
   */
  static isEligibleForTrial(
    hasHadTrialBefore: boolean,
    allowMultipleTrials: boolean = false
  ): boolean {
    if (allowMultipleTrials) {
      return true;
    }
    return !hasHadTrialBefore;
  }

  /**
   * Get trial warning message based on days remaining
   */
  static getTrialWarningMessage(daysRemaining: number): string | null {
    if (daysRemaining <= 0) {
      return 'Your trial has ended. Upgrade now to continue accessing Pro features.';
    }
    if (daysRemaining === 1) {
      return 'Your trial ends tomorrow! Upgrade now to keep your Pro features.';
    }
    if (daysRemaining <= this.WARNING_THRESHOLD_DAYS) {
      return `Your trial ends in ${daysRemaining} days. Upgrade now to avoid losing access.`;
    }
    return null;
  }

  /**
   * Create subscription data from trial data
   */
  static createSubscriptionFromTrial(
    trialData: TrialPeriodData
  ): SubscriptionData {
    const status = this.checkTrialStatus(trialData);

    return {
      tier: 'pro',
      status: status.isExpired ? 'expired' : 'trial',
      trialEnd: trialData.trialEndDate,
      currentPeriodStart: trialData.trialStartDate,
      currentPeriodEnd: trialData.trialEndDate,
    };
  }
}

/**
 * Trial to Paid Conversion Handler
 * Manages the workflow of converting from trial to paid subscription
 */
export class TrialConversionHandler {
  /**
   * Process trial to paid conversion
   */
  static async processConversion(
    trialData: TrialPeriodData,
    targetTier: SubscriptionTier,
    paymentVerified: boolean = false
  ): Promise<{
    success: boolean;
    updatedTrialData?: TrialPeriodData;
    conversionData?: TrialConversionData;
    error?: string;
  }> {
    // Verify trial is active or recently expired
    const status = TrialPeriodManager.checkTrialStatus(trialData);

    if (trialData.hasConverted) {
      return {
        success: false,
        error: 'Trial has already been converted',
      };
    }

    // For paid tiers, verify payment
    if (targetTier === 'pro' && !paymentVerified) {
      return {
        success: false,
        error: 'Payment verification required for Pro tier',
      };
    }

    // Convert trial
    const { updatedTrialData, conversionData } =
      TrialPeriodManager.convertTrialToPaid(trialData, targetTier, 'manual');

    return {
      success: true,
      updatedTrialData,
      conversionData,
    };
  }

  /**
   * Handle automatic conversion on trial expiry
   */
  static handleTrialExpiry(
    trialData: TrialPeriodData,
    autoConvertToFree: boolean = true
  ): {
    action: 'expire' | 'convert_to_free';
    updatedTrialData: TrialPeriodData;
    conversionData?: TrialConversionData;
  } {
    if (autoConvertToFree) {
      const { updatedTrialData, conversionData } =
        TrialPeriodManager.convertTrialToPaid(trialData, 'free', 'auto');

      return {
        action: 'convert_to_free',
        updatedTrialData,
        conversionData,
      };
    }

    return {
      action: 'expire',
      updatedTrialData: TrialPeriodManager.expireTrial(trialData),
    };
  }

  /**
   * Calculate conversion metrics
   */
  static calculateConversionMetrics(conversions: TrialConversionData[]): {
    totalConversions: number;
    conversionRate: number;
    averageTrialDuration: number;
    conversionsByReason: Record<string, number>;
  } {
    const totalConversions = conversions.length;
    const totalTrialDuration = conversions.reduce(
      (sum, c) => sum + c.trialDuration,
      0
    );
    const averageTrialDuration =
      totalConversions > 0 ? totalTrialDuration / totalConversions : 0;

    const conversionsByReason = conversions.reduce(
      (acc, c) => {
        const reason = c.conversionReason || 'unknown';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalConversions,
      conversionRate: 0, // Would need total trials to calculate
      averageTrialDuration,
      conversionsByReason,
    };
  }
}

/**
 * Trial Period Validator
 * Validates trial data and integrates with subscription validation
 */
export class TrialPeriodValidator {
  /**
   * Validate trial period data
   */
  static validateTrialData(trialData: TrialPeriodData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!trialData.userId) {
      errors.push('User ID is required');
    }

    if (!trialData.trialStartDate) {
      errors.push('Trial start date is required');
    }

    if (!trialData.trialEndDate) {
      errors.push('Trial end date is required');
    }

    if (
      trialData.trialStartDate &&
      trialData.trialEndDate &&
      trialData.trialEndDate <= trialData.trialStartDate
    ) {
      errors.push('Trial end date must be after start date');
    }

    if (trialData.trialDurationDays <= 0) {
      errors.push('Trial duration must be positive');
    }

    if (trialData.trialDurationDays > 90) {
      errors.push('Trial duration cannot exceed 90 days');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate trial conversion
   */
  static validateConversion(
    trialData: TrialPeriodData,
    targetTier: SubscriptionTier
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (trialData.hasConverted) {
      errors.push('Trial has already been converted');
    }

    if (!['free', 'pro'].includes(targetTier)) {
      errors.push('Invalid target tier');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Helper functions for trial period management
 */

/**
 * Check if subscription is in trial period
 */
export function isInTrialPeriod(subscription: SubscriptionData): boolean {
  return subscription.status === 'trial';
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: SubscriptionData): number {
  if (!subscription.trialEnd || subscription.status !== 'trial') {
    return 0;
  }

  const now = new Date();
  const msRemaining = subscription.trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
}

/**
 * Check if trial is expiring soon
 */
export function isTrialExpiringSoon(
  subscription: SubscriptionData,
  thresholdDays: number = 3
): boolean {
  if (subscription.status !== 'trial') {
    return false;
  }

  const daysRemaining = getTrialDaysRemaining(subscription);
  return daysRemaining > 0 && daysRemaining <= thresholdDays;
}

/**
 * Get trial progress percentage
 */
export function getTrialProgress(trialData: TrialPeriodData): number {
  const now = new Date();
  const totalDuration =
    trialData.trialEndDate.getTime() - trialData.trialStartDate.getTime();
  const elapsed = now.getTime() - trialData.trialStartDate.getTime();

  const progress = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, progress));
}
