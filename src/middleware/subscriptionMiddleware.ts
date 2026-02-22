/**
 * Subscription Middleware for API Route Protection
 * Protects Pro-only endpoints and validates subscription status
 */

import { Request, Response, NextFunction } from 'express';
import {
  SubscriptionValidator,
  SubscriptionStatusChecker,
  SubscriptionData,
  SubscriptionTier,
} from '../lib/subscriptionValidation';

export interface SubscriptionRequest extends Request {
  subscription?: SubscriptionData;
  subscriptionValidation?: ReturnType<typeof SubscriptionValidator.validateSubscription>;
}

/**
 * Error response for subscription issues
 */
class SubscriptionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'SUBSCRIPTION_ERROR'
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

/**
 * Middleware to validate subscription status
 * Attaches subscription data and validation to request
 */
export const validateSubscriptionStatus = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get subscription data from request (should be attached by auth middleware)
    const subscription = req.subscription;

    if (!subscription) {
      throw new SubscriptionError(
        'Subscription data not found',
        401,
        'SUBSCRIPTION_NOT_FOUND'
      );
    }

    // Validate subscription
    const validation = SubscriptionValidator.validateSubscription(subscription);

    // Attach validation to request
    req.subscriptionValidation = validation;

    // Check if subscription is valid
    if (!validation.hasAccess) {
      throw new SubscriptionError(
        validation.reason || 'Subscription is not active',
        403,
        'SUBSCRIPTION_INACTIVE'
      );
    }

    next();
  } catch (error) {
    if (error instanceof SubscriptionError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to require Pro subscription
 * Use this to protect Pro-only endpoints
 */
export const requireProSubscription = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = req.subscription;

    if (!subscription) {
      throw new SubscriptionError(
        'Subscription data not found',
        401,
        'SUBSCRIPTION_NOT_FOUND'
      );
    }

    // Validate subscription
    const validation = SubscriptionValidator.validateSubscription(subscription);

    // Attach validation to request
    req.subscriptionValidation = validation;

    // Check if user has Pro access
    if (validation.tier !== 'pro' || !validation.hasAccess) {
      throw new SubscriptionError(
        'Pro subscription required to access this feature',
        403,
        'PRO_SUBSCRIPTION_REQUIRED'
      );
    }

    // Warn if in grace period
    if (validation.status === 'past_due') {
      res.setHeader(
        'X-Subscription-Warning',
        `Payment failed. ${validation.gracePeriodRemaining} days remaining.`
      );
    }

    next();
  } catch (error) {
    if (error instanceof SubscriptionError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
        upgrade: {
          required: true,
          tier: 'pro',
          message: 'Upgrade to Pro to access this feature',
        },
      });
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to require specific subscription tier
 */
export const requireTier = (requiredTier: SubscriptionTier) => {
  return async (
    req: SubscriptionRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subscription = req.subscription;

      if (!subscription) {
        throw new SubscriptionError(
          'Subscription data not found',
          401,
          'SUBSCRIPTION_NOT_FOUND'
        );
      }

      // Validate subscription
      const validation = SubscriptionValidator.validateSubscription(subscription);

      // Attach validation to request
      req.subscriptionValidation = validation;

      // Check tier match
      if (validation.tier !== requiredTier || !validation.hasAccess) {
        throw new SubscriptionError(
          `${requiredTier} subscription required`,
          403,
          'TIER_REQUIRED'
        );
      }

      next();
    } catch (error) {
      if (error instanceof SubscriptionError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        });
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware to check payment status
 */
export const requireCurrentPayment = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = req.subscription;

    if (!subscription) {
      throw new SubscriptionError(
        'Subscription data not found',
        401,
        'SUBSCRIPTION_NOT_FOUND'
      );
    }

    // Check payment status
    const isPaymentCurrent = SubscriptionValidator.isPaymentCurrent(subscription);

    if (!isPaymentCurrent) {
      throw new SubscriptionError(
        'Payment is not current. Please update your payment method.',
        402,
        'PAYMENT_REQUIRED'
      );
    }

    next();
  } catch (error) {
    if (error instanceof SubscriptionError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to attach subscription warnings to response
 */
export const attachSubscriptionWarnings = (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
): void => {
  const validation = req.subscriptionValidation;

  if (!validation) {
    next();
    return;
  }

  // Add warnings for various states
  if (validation.status === 'past_due') {
    res.setHeader(
      'X-Subscription-Warning',
      `Payment failed. ${validation.gracePeriodRemaining} days remaining.`
    );
  }

  if (validation.status === 'cancelled') {
    res.setHeader(
      'X-Subscription-Warning',
      'Subscription cancelled. Access will end at period end.'
    );
  }

  if (validation.status === 'trial') {
    const subscription = req.subscription;
    if (subscription?.trialEnd) {
      const daysRemaining = SubscriptionStatusChecker.getDaysUntilExpiry(subscription);
      if (daysRemaining !== null && daysRemaining <= 7) {
        res.setHeader(
          'X-Subscription-Warning',
          `Trial ends in ${daysRemaining} days.`
        );
      }
    }
  }

  next();
};

/**
 * Helper to get subscription from user data
 * This should be customized based on your user data structure
 */
export const extractSubscriptionFromUser = (userData: any): SubscriptionData => {
  // Default implementation - customize based on your data structure
  return {
    tier: userData.subscription_tier || 'free',
    status: userData.subscription_status || 'active',
    currentPeriodStart: userData.subscription_period_start
      ? new Date(userData.subscription_period_start)
      : undefined,
    currentPeriodEnd: userData.subscription_period_end
      ? new Date(userData.subscription_period_end)
      : undefined,
    cancelAtPeriodEnd: userData.cancel_at_period_end || false,
    trialEnd: userData.trial_end ? new Date(userData.trial_end) : undefined,
    gracePeriodEnd: userData.grace_period_end
      ? new Date(userData.grace_period_end)
      : undefined,
    paymentStatus: userData.payment_status || 'paid',
  };
};
