'use client';

/**
 * Upgrade CTA Component
 * Non-intrusive upgrade call-to-action for strategic placement
 * Smaller and less prominent than UpgradePrompt
 */

import React from 'react';
import { FeatureId, FeatureGatingService } from '@/lib/featureGatingService';
import { ConversionTrackingService } from '@/lib/conversionTrackingService';

export interface UpgradeCTAProps {
  featureId?: FeatureId;
  userId: string;
  location: string;
  message?: string;
  onUpgradeClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'banner' | 'badge';
  className?: string;
}

export const UpgradeCTA: React.FC<UpgradeCTAProps> = ({
  featureId,
  userId,
  location,
  message,
  onUpgradeClick,
  size = 'md',
  variant = 'inline',
  className = ''
}) => {
  const handleClick = () => {
    if (featureId) {
      ConversionTrackingService.trackPromptClick(userId, featureId, location);
    }
    ConversionTrackingService.trackUpgradeInitiation(userId, location);
    onUpgradeClick?.();
  };

  const feature = featureId ? FeatureGatingService.getFeature(featureId) : null;
  const displayMessage = message || (feature ? `Unlock ${feature.name}` : 'Upgrade to Pro');

  if (variant === 'badge') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all ${className}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        PRO
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-md ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{displayMessage}</p>
              <p className="text-sm text-white/80">Get access to all Pro features</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="bg-white text-purple-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  // Inline variant (default)
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      {displayMessage}
    </button>
  );
};
