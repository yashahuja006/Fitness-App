'use client';

/**
 * Feature Gate Component
 * Wraps content that requires Pro access
 * Automatically shows upgrade prompt for free users
 */

import React, { useState } from 'react';
import { FeatureId, FeatureGatingService, SubscriptionTier } from '@/lib/featureGatingService';
import { UpgradePrompt } from './UpgradePrompt';
import { PromptVariant } from '@/lib/conversionTrackingService';

export interface FeatureGateProps {
  featureId: FeatureId;
  userTier: SubscriptionTier;
  userId: string;
  location: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  promptVariant?: PromptVariant;
  onUpgradeClick?: () => void;
  showPrompt?: boolean;
  className?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  userTier,
  userId,
  location,
  children,
  fallback,
  promptVariant = 'default',
  onUpgradeClick,
  showPrompt = true,
  className = ''
}) => {
  const [dismissed, setDismissed] = useState(false);
  const hasAccess = FeatureGatingService.hasFeatureAccess(userTier, featureId);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (dismissed || !showPrompt) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={className}>
      <UpgradePrompt
        featureId={featureId}
        userId={userId}
        location={location}
        variant={promptVariant}
        onUpgradeClick={onUpgradeClick}
        onDismiss={() => setDismissed(true)}
      />
    </div>
  );
};

/**
 * Feature Lock Component
 * Shows locked content with overlay and upgrade prompt
 */
export interface FeatureLockProps {
  featureId: FeatureId;
  userTier: SubscriptionTier;
  userId: string;
  location: string;
  children: React.ReactNode;
  promptVariant?: PromptVariant;
  onUpgradeClick?: () => void;
  blurContent?: boolean;
  className?: string;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  featureId,
  userTier,
  userId,
  location,
  children,
  promptVariant = 'default',
  onUpgradeClick,
  blurContent = true,
  className = ''
}) => {
  const hasAccess = FeatureGatingService.hasFeatureAccess(userTier, featureId);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className={blurContent ? 'filter blur-sm pointer-events-none select-none' : 'opacity-50 pointer-events-none select-none'}>
        {children}
      </div>

      {/* Overlay with upgrade prompt */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="max-w-md w-full p-4">
          <UpgradePrompt
            featureId={featureId}
            userId={userId}
            location={location}
            variant={promptVariant}
            onUpgradeClick={onUpgradeClick}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Feature Badge Component
 * Shows a "Pro" badge on features that require upgrade
 */
export interface FeatureBadgeProps {
  featureId: FeatureId;
  userTier: SubscriptionTier;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  featureId,
  userTier,
  position = 'top-right',
  className = ''
}) => {
  const hasAccess = FeatureGatingService.hasFeatureAccess(userTier, featureId);

  if (hasAccess) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} ${className}`}>
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        PRO
      </span>
    </div>
  );
};
