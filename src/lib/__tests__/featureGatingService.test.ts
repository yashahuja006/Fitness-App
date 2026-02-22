/**
 * Feature Gating Service Tests
 * Tests for subscription tier-based feature access control
 */

import { describe, it, expect } from '@jest/globals';
import {
  FeatureGatingService,
  hasFeature,
  getAvailableFeatures,
  type FeatureId,
  type SubscriptionTier
} from '../featureGatingService';

describe('FeatureGatingService', () => {
  describe('getAvailableFeatures', () => {
    it('should return only free features for free tier', () => {
      const features = FeatureGatingService.getAvailableFeatures('free');
      
      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.tier === 'free')).toBe(true);
      
      // Verify specific free features are included
      const featureIds = features.map(f => f.id);
      expect(featureIds).toContain('basic_meal_plan');
      expect(featureIds).toContain('simple_workout');
      expect(featureIds).toContain('basic_macros');
      expect(featureIds).toContain('progress_tracking');
    });

    it('should return all features for pro tier', () => {
      const freeFeatures = FeatureGatingService.getAvailableFeatures('free');
      const proFeatures = FeatureGatingService.getAvailableFeatures('pro');
      
      expect(proFeatures.length).toBeGreaterThan(freeFeatures.length);
      
      // Verify pro features are included
      const featureIds = proFeatures.map(f => f.id);
      expect(featureIds).toContain('macro_cycling');
      expect(featureIds).toContain('refeed_strategy');
      expect(featureIds).toContain('grocery_optimization');
      expect(featureIds).toContain('meal_prep_batching');
      expect(featureIds).toContain('progress_projection');
    });

    it('should include all free features in pro tier', () => {
      const freeFeatures = FeatureGatingService.getAvailableFeatures('free');
      const proFeatures = FeatureGatingService.getAvailableFeatures('pro');
      
      const freeIds = freeFeatures.map(f => f.id);
      const proIds = proFeatures.map(f => f.id);
      
      // All free features should be in pro
      freeIds.forEach(id => {
        expect(proIds).toContain(id);
      });
    });
  });

  describe('getAvailableFeatureIds', () => {
    it('should return feature IDs for free tier', () => {
      const ids = FeatureGatingService.getAvailableFeatureIds('free');
      
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids).toContain('basic_meal_plan');
    });

    it('should return all feature IDs for pro tier', () => {
      const freeIds = FeatureGatingService.getAvailableFeatureIds('free');
      const proIds = FeatureGatingService.getAvailableFeatureIds('pro');
      
      expect(proIds.length).toBeGreaterThan(freeIds.length);
      expect(proIds).toContain('macro_cycling');
    });
  });

  describe('getUnavailableFeatures', () => {
    it('should return pro features for free tier', () => {
      const unavailable = FeatureGatingService.getUnavailableFeatures('free');
      
      expect(unavailable.length).toBeGreaterThan(0);
      expect(unavailable.every(f => f.tier === 'pro')).toBe(true);
      
      const featureIds = unavailable.map(f => f.id);
      expect(featureIds).toContain('macro_cycling');
      expect(featureIds).toContain('grocery_optimization');
    });

    it('should return empty array for pro tier', () => {
      const unavailable = FeatureGatingService.getUnavailableFeatures('pro');
      
      expect(unavailable).toEqual([]);
    });
  });

  describe('hasFeatureAccess', () => {
    it('should grant access to free features for free tier', () => {
      expect(FeatureGatingService.hasFeatureAccess('free', 'basic_meal_plan')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('free', 'simple_workout')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('free', 'basic_macros')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('free', 'progress_tracking')).toBe(true);
    });

    it('should deny access to pro features for free tier', () => {
      expect(FeatureGatingService.hasFeatureAccess('free', 'macro_cycling')).toBe(false);
      expect(FeatureGatingService.hasFeatureAccess('free', 'refeed_strategy')).toBe(false);
      expect(FeatureGatingService.hasFeatureAccess('free', 'grocery_optimization')).toBe(false);
      expect(FeatureGatingService.hasFeatureAccess('free', 'meal_prep_batching')).toBe(false);
      expect(FeatureGatingService.hasFeatureAccess('free', 'progress_projection')).toBe(false);
    });

    it('should grant access to all features for pro tier', () => {
      // Free features
      expect(FeatureGatingService.hasFeatureAccess('pro', 'basic_meal_plan')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('pro', 'simple_workout')).toBe(true);
      
      // Pro features
      expect(FeatureGatingService.hasFeatureAccess('pro', 'macro_cycling')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('pro', 'refeed_strategy')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('pro', 'grocery_optimization')).toBe(true);
      expect(FeatureGatingService.hasFeatureAccess('pro', 'progress_projection')).toBe(true);
    });

    it('should return false for unknown features', () => {
      expect(FeatureGatingService.hasFeatureAccess('free', 'unknown_feature' as FeatureId)).toBe(false);
      expect(FeatureGatingService.hasFeatureAccess('pro', 'unknown_feature' as FeatureId)).toBe(false);
    });
  });

  describe('getFeatureAccess', () => {
    it('should return access granted for free features on free tier', () => {
      const result = FeatureGatingService.getFeatureAccess('free', 'basic_meal_plan');
      
      expect(result.hasAccess).toBe(true);
      expect(result.requiresUpgrade).toBe(false);
      expect(result.upgradeMessage).toBeUndefined();
      expect(result.feature.id).toBe('basic_meal_plan');
    });

    it('should return access denied with upgrade message for pro features on free tier', () => {
      const result = FeatureGatingService.getFeatureAccess('free', 'macro_cycling');
      
      expect(result.hasAccess).toBe(false);
      expect(result.requiresUpgrade).toBe(true);
      expect(result.upgradeMessage).toBeDefined();
      expect(result.upgradeMessage).toContain('Upgrade to Pro');
      expect(result.feature.id).toBe('macro_cycling');
    });

    it('should return access granted for all features on pro tier', () => {
      const freeResult = FeatureGatingService.getFeatureAccess('pro', 'basic_meal_plan');
      const proResult = FeatureGatingService.getFeatureAccess('pro', 'macro_cycling');
      
      expect(freeResult.hasAccess).toBe(true);
      expect(freeResult.requiresUpgrade).toBe(false);
      
      expect(proResult.hasAccess).toBe(true);
      expect(proResult.requiresUpgrade).toBe(false);
    });

    it('should throw error for unknown features', () => {
      expect(() => {
        FeatureGatingService.getFeatureAccess('free', 'unknown_feature' as FeatureId);
      }).toThrow('Unknown feature');
    });
  });

  describe('getFeatureSet', () => {
    it('should return complete feature set for free tier', () => {
      const featureSet = FeatureGatingService.getFeatureSet('free');
      
      expect(featureSet.available.length).toBeGreaterThan(0);
      expect(featureSet.unavailable.length).toBeGreaterThan(0);
      expect(featureSet.totalCount).toBe(featureSet.available.length + featureSet.unavailable.length);
      expect(featureSet.availableCount).toBe(featureSet.available.length);
    });

    it('should return complete feature set for pro tier', () => {
      const featureSet = FeatureGatingService.getFeatureSet('pro');
      
      expect(featureSet.available.length).toBe(featureSet.totalCount);
      expect(featureSet.unavailable.length).toBe(0);
      expect(featureSet.availableCount).toBe(featureSet.totalCount);
    });
  });

  describe('getFeaturesByCategory', () => {
    it('should return nutrition features for free tier', () => {
      const features = FeatureGatingService.getFeaturesByCategory('free', 'nutrition');
      
      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.category === 'nutrition')).toBe(true);
      expect(features.every(f => f.tier === 'free')).toBe(true);
    });

    it('should return all nutrition features for pro tier', () => {
      const freeNutrition = FeatureGatingService.getFeaturesByCategory('free', 'nutrition');
      const proNutrition = FeatureGatingService.getFeaturesByCategory('pro', 'nutrition');
      
      expect(proNutrition.length).toBeGreaterThan(freeNutrition.length);
      expect(proNutrition.every(f => f.category === 'nutrition')).toBe(true);
    });

    it('should return training features', () => {
      const features = FeatureGatingService.getFeaturesByCategory('pro', 'training');
      
      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.category === 'training')).toBe(true);
    });

    it('should return optimization features', () => {
      const features = FeatureGatingService.getFeaturesByCategory('pro', 'optimization');
      
      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.category === 'optimization')).toBe(true);
    });

    it('should return analytics features', () => {
      const features = FeatureGatingService.getFeaturesByCategory('pro', 'analytics');
      
      expect(features.length).toBeGreaterThan(0);
      expect(features.every(f => f.category === 'analytics')).toBe(true);
    });
  });

  describe('getAllFeatures', () => {
    it('should return all feature definitions', () => {
      const allFeatures = FeatureGatingService.getAllFeatures();
      
      expect(allFeatures.length).toBeGreaterThan(0);
      expect(allFeatures.some(f => f.tier === 'free')).toBe(true);
      expect(allFeatures.some(f => f.tier === 'pro')).toBe(true);
    });
  });

  describe('getFeature', () => {
    it('should return feature definition for valid feature ID', () => {
      const feature = FeatureGatingService.getFeature('basic_meal_plan');
      
      expect(feature).toBeDefined();
      expect(feature?.id).toBe('basic_meal_plan');
      expect(feature?.name).toBeDefined();
      expect(feature?.description).toBeDefined();
      expect(feature?.tier).toBe('free');
    });

    it('should return undefined for unknown feature ID', () => {
      const feature = FeatureGatingService.getFeature('unknown_feature' as FeatureId);
      
      expect(feature).toBeUndefined();
    });
  });

  describe('hasAllFeatures', () => {
    it('should return true when all features are available', () => {
      const result = FeatureGatingService.hasAllFeatures('free', [
        'basic_meal_plan',
        'simple_workout',
        'basic_macros'
      ]);
      
      expect(result).toBe(true);
    });

    it('should return false when any feature is unavailable', () => {
      const result = FeatureGatingService.hasAllFeatures('free', [
        'basic_meal_plan',
        'macro_cycling' // Pro feature
      ]);
      
      expect(result).toBe(false);
    });

    it('should return true for pro tier with mixed features', () => {
      const result = FeatureGatingService.hasAllFeatures('pro', [
        'basic_meal_plan',
        'macro_cycling',
        'grocery_optimization'
      ]);
      
      expect(result).toBe(true);
    });
  });

  describe('hasAnyFeature', () => {
    it('should return true when at least one feature is available', () => {
      const result = FeatureGatingService.hasAnyFeature('free', [
        'basic_meal_plan',
        'macro_cycling' // Pro feature
      ]);
      
      expect(result).toBe(true);
    });

    it('should return false when no features are available', () => {
      const result = FeatureGatingService.hasAnyFeature('free', [
        'macro_cycling',
        'grocery_optimization',
        'progress_projection'
      ]);
      
      expect(result).toBe(false);
    });

    it('should return true for pro tier with any features', () => {
      const result = FeatureGatingService.hasAnyFeature('pro', [
        'macro_cycling',
        'grocery_optimization'
      ]);
      
      expect(result).toBe(true);
    });
  });

  describe('getUpgradeBenefits', () => {
    it('should return pro features for free tier', () => {
      const benefits = FeatureGatingService.getUpgradeBenefits('free');
      
      expect(benefits.length).toBeGreaterThan(0);
      expect(benefits.every(f => f.tier === 'pro')).toBe(true);
      
      const benefitIds = benefits.map(f => f.id);
      expect(benefitIds).toContain('macro_cycling');
      expect(benefitIds).toContain('grocery_optimization');
      expect(benefitIds).toContain('progress_projection');
    });

    it('should return empty array for pro tier', () => {
      const benefits = FeatureGatingService.getUpgradeBenefits('pro');
      
      expect(benefits).toEqual([]);
    });
  });

  describe('getUpgradePrompt', () => {
    it('should return upgrade prompt for pro features', () => {
      const prompt = FeatureGatingService.getUpgradePrompt('macro_cycling');
      
      expect(prompt).toContain('🔒');
      expect(prompt).toContain('Macro Cycling');
      expect(prompt).toContain('Pro feature');
      expect(prompt).toContain('Upgrade');
    });

    it('should return upgrade prompt for free features', () => {
      const prompt = FeatureGatingService.getUpgradePrompt('basic_meal_plan');
      
      expect(prompt).toContain('Basic Meal Plan');
    });

    it('should return generic message for unknown features', () => {
      const prompt = FeatureGatingService.getUpgradePrompt('unknown_feature' as FeatureId);
      
      expect(prompt).toContain('Upgrade to Pro');
    });
  });

  describe('isValidTier', () => {
    it('should return true for valid tiers', () => {
      expect(FeatureGatingService.isValidTier('free')).toBe(true);
      expect(FeatureGatingService.isValidTier('pro')).toBe(true);
    });

    it('should return false for invalid tiers', () => {
      expect(FeatureGatingService.isValidTier('premium')).toBe(false);
      expect(FeatureGatingService.isValidTier('basic')).toBe(false);
      expect(FeatureGatingService.isValidTier('')).toBe(false);
    });
  });

  describe('Helper functions', () => {
    describe('hasFeature', () => {
      it('should work as convenience wrapper', () => {
        expect(hasFeature('free', 'basic_meal_plan')).toBe(true);
        expect(hasFeature('free', 'macro_cycling')).toBe(false);
        expect(hasFeature('pro', 'macro_cycling')).toBe(true);
      });
    });

    describe('getAvailableFeatures', () => {
      it('should work as convenience wrapper', () => {
        const freeFeatures = getAvailableFeatures('free');
        const proFeatures = getAvailableFeatures('pro');
        
        expect(Array.isArray(freeFeatures)).toBe(true);
        expect(Array.isArray(proFeatures)).toBe(true);
        expect(proFeatures.length).toBeGreaterThan(freeFeatures.length);
      });
    });
  });

  describe('Feature requirements from spec', () => {
    it('should enforce free tier limitations', () => {
      const freeTier: SubscriptionTier = 'free';
      
      // Free tier should NOT have these features
      expect(hasFeature(freeTier, 'macro_cycling')).toBe(false);
      expect(hasFeature(freeTier, 'grocery_optimization')).toBe(false);
      expect(hasFeature(freeTier, 'meal_prep_batching')).toBe(false);
      expect(hasFeature(freeTier, 'seven_day_variety')).toBe(false);
      expect(hasFeature(freeTier, 'periodized_training')).toBe(false);
    });

    it('should provide pro tier advanced features', () => {
      const proTier: SubscriptionTier = 'pro';
      
      // Pro tier should have all these features
      expect(hasFeature(proTier, 'seven_day_variety')).toBe(true);
      expect(hasFeature(proTier, 'carb_cycling')).toBe(true);
      expect(hasFeature(proTier, 'refeed_strategy')).toBe(true);
      expect(hasFeature(proTier, 'grocery_optimization')).toBe(true);
      expect(hasFeature(proTier, 'meal_prep_batching')).toBe(true);
      expect(hasFeature(proTier, 'progress_projection')).toBe(true);
      expect(hasFeature(proTier, 'plateau_prevention')).toBe(true);
    });
  });
});
