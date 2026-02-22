'use client';

/**
 * Upgrade Prompt Component
 * Displays upgrade prompts when users try to access Pro features
 * Supports multiple variants for A/B testing
 */

import React, { useEffect } from 'react';
import { FeatureId, FeatureGatingService } from '@/lib/featureGatingService';
import { ConversionTrackingService, PromptVariant } from '@/lib/conversionTrackingService';

export interface UpgradePromptProps {
  featureId: FeatureId;
  userId: string;
  location: string;
  variant?: PromptVariant;
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  featureId,
  userId,
  location,
  variant = 'default',
  onUpgradeClick,
  onDismiss,
  className = ''
}) => {
  const feature = FeatureGatingService.getFeature(featureId);

  useEffect(() => {
    // Track prompt view when component mounts
    ConversionTrackingService.trackPromptView(userId, featureId, location, variant);
  }, [userId, featureId, location, variant]);

  if (!feature) {
    return null;
  }

  const handleUpgradeClick = () => {
    ConversionTrackingService.trackPromptClick(userId, featureId, location, variant);
    ConversionTrackingService.trackUpgradeInitiation(userId, location);
    onUpgradeClick?.();
  };

  const handleDismiss = () => {
    ConversionTrackingService.trackPromptDismiss(userId, featureId, location);
    onDismiss?.();
  };

  const getPromptContent = () => {
    switch (variant) {
      case 'benefits':
        return {
          title: `Unlock ${feature.name}`,
          description: feature.description,
          benefits: getFeatureBenefits(featureId),
          cta: 'Upgrade to Pro'
        };
      
      case 'urgency':
        return {
          title: `Limited Time: Upgrade to Pro`,
          description: `Get ${feature.name} and all Pro features`,
          benefits: ['7-day meal variety', 'Macro cycling', 'Grocery optimization', 'Progress projections'],
          cta: 'Upgrade Now'
        };
      
      case 'social_proof':
        return {
          title: `Join 10,000+ Pro Users`,
          description: `Unlock ${feature.name} and achieve your goals faster`,
          benefits: ['Used by elite athletes', '4.8/5 average rating', '85% see results in 4 weeks'],
          cta: 'Start Pro Trial'
        };
      
      default:
        return {
          title: `${feature.name} is a Pro Feature`,
          description: feature.description,
          benefits: [],
          cta: 'Upgrade to Pro'
        };
    }
  };

  const content = getPromptContent();

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 shadow-lg ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{content.title}</h3>
            <p className="text-sm text-gray-600">{content.description}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {content.benefits.length > 0 && (
        <ul className="space-y-2 mb-4">
          {content.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleUpgradeClick}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-md"
      >
        {content.cta}
      </button>
    </div>
  );
};

/**
 * Get feature-specific benefits for the benefits variant
 */
function getFeatureBenefits(featureId: FeatureId): string[] {
  const benefitsMap: Record<FeatureId, string[]> = {
    macro_cycling: [
      'Higher carbs on training days',
      'Lower carbs on rest days',
      'Optimize performance and recovery'
    ],
    refeed_strategy: [
      'Strategic high-calorie days',
      'Prevent metabolic adaptation',
      'Maintain energy levels'
    ],
    grocery_optimization: [
      'Smart grocery lists',
      'Cost optimization',
      'Reduce food waste'
    ],
    meal_prep_batching: [
      'Batch cooking strategies',
      'Save time and money',
      'Storage instructions included'
    ],
    advanced_progression: [
      'Predictive adjustments',
      'Plateau prevention',
      'Faster results'
    ],
    plateau_prevention: [
      'Automatic detection',
      'Smart adjustments',
      'Continuous progress'
    ],
    progress_projection: [
      '8-week outcome predictions',
      'Confidence intervals',
      'Track your trajectory'
    ],
    seven_day_variety: [
      'Full weekly meal variation',
      'No repetition',
      'Never get bored'
    ],
    carb_cycling: [
      'Training day optimization',
      'Rest day adjustments',
      'Maximize results'
    ],
    periodized_training: [
      'Advanced training blocks',
      'Periodization strategies',
      'Elite-level programming'
    ],
    // Free tier features (shouldn't show upgrade prompt, but included for completeness)
    basic_meal_plan: [],
    simple_workout: [],
    basic_macros: [],
    progress_tracking: [],
    bmr_tdee_calculation: [],
    goal_specific_calories: [],
    protein_targets: [],
    basic_progression: []
  };

  return benefitsMap[featureId] || [];
}
