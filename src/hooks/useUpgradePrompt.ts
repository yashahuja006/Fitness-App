/**
 * useUpgradePrompt Hook
 * Provides easy access to upgrade prompt functionality
 * Handles feature access checking and conversion tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { FeatureId, FeatureGatingService, SubscriptionTier } from '@/lib/featureGatingService';
import { ConversionTrackingService, PromptVariant } from '@/lib/conversionTrackingService';

export interface UseUpgradePromptOptions {
  featureId: FeatureId;
  userTier: SubscriptionTier;
  userId: string;
  location: string;
  variant?: PromptVariant;
  autoTrackView?: boolean;
}

export interface UseUpgradePromptReturn {
  hasAccess: boolean;
  requiresUpgrade: boolean;
  showPrompt: () => void;
  hidePrompt: () => void;
  isPromptVisible: boolean;
  trackView: () => void;
  trackClick: () => void;
  trackDismiss: () => void;
  upgradeMessage: string;
}

/**
 * Hook for managing upgrade prompts and feature access
 */
export function useUpgradePrompt(options: UseUpgradePromptOptions): UseUpgradePromptReturn {
  const {
    featureId,
    userTier,
    userId,
    location,
    variant = 'default',
    autoTrackView = false
  } = options;

  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const hasAccess = FeatureGatingService.hasFeatureAccess(userTier, featureId);
  const requiresUpgrade = !hasAccess;
  const upgradeMessage = FeatureGatingService.getUpgradePrompt(featureId);

  const trackView = useCallback(() => {
    if (!hasTrackedView) {
      ConversionTrackingService.trackPromptView(userId, featureId, location, variant);
      setHasTrackedView(true);
    }
  }, [userId, featureId, location, variant, hasTrackedView]);

  const trackClick = useCallback(() => {
    ConversionTrackingService.trackPromptClick(userId, featureId, location, variant);
  }, [userId, featureId, location, variant]);

  const trackDismiss = useCallback(() => {
    ConversionTrackingService.trackPromptDismiss(userId, featureId, location);
  }, [userId, featureId, location]);

  const showPrompt = useCallback(() => {
    setIsPromptVisible(true);
    trackView();
  }, [trackView]);

  const hidePrompt = useCallback(() => {
    setIsPromptVisible(false);
    trackDismiss();
  }, [trackDismiss]);

  // Auto-track view when prompt becomes visible
  useEffect(() => {
    if (autoTrackView && requiresUpgrade && !hasTrackedView) {
      trackView();
    }
  }, [autoTrackView, requiresUpgrade, hasTrackedView, trackView]);

  return {
    hasAccess,
    requiresUpgrade,
    showPrompt,
    hidePrompt,
    isPromptVisible,
    trackView,
    trackClick,
    trackDismiss,
    upgradeMessage
  };
}

/**
 * Hook for checking multiple feature access
 */
export function useFeatureAccess(
  userTier: SubscriptionTier,
  featureIds: FeatureId[]
): Record<FeatureId, boolean> {
  return featureIds.reduce((acc, featureId) => {
    acc[featureId] = FeatureGatingService.hasFeatureAccess(userTier, featureId);
    return acc;
  }, {} as Record<FeatureId, boolean>);
}

/**
 * Hook for getting upgrade benefits
 */
export function useUpgradeBenefits(userTier: SubscriptionTier) {
  const benefits = FeatureGatingService.getUpgradeBenefits(userTier);
  const hasUpgradeBenefits = benefits.length > 0;

  return {
    benefits,
    hasUpgradeBenefits,
    benefitCount: benefits.length
  };
}
