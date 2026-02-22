/**
 * Feature Gating Service
 * Controls access to features based on subscription tier (free vs pro)
 * 
 * Free tier limitations:
 * - 3-day rotating meal plan (vs 7-day variety)
 * - Basic workout split (no periodization)
 * - No macro cycling
 * - No grocery optimization
 * - No meal prep batching
 * 
 * Pro tier features:
 * - Full 7-day meal variety
 * - Carb cycling and refeed strategies
 * - Smart grocery list consolidation
 * - Meal prep batching optimization
 * - Progress projection modeling
 * - Advanced plateau prevention
 */

export type SubscriptionTier = 'free' | 'pro';

export type FeatureId =
  // Free tier features
  | 'basic_meal_plan'
  | 'simple_workout'
  | 'basic_macros'
  | 'progress_tracking'
  | 'bmr_tdee_calculation'
  | 'goal_specific_calories'
  | 'protein_targets'
  | 'basic_progression'
  // Pro tier features
  | 'macro_cycling'
  | 'refeed_strategy'
  | 'grocery_optimization'
  | 'meal_prep_batching'
  | 'advanced_progression'
  | 'plateau_prevention'
  | 'progress_projection'
  | 'seven_day_variety'
  | 'carb_cycling'
  | 'periodized_training';

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  tier: SubscriptionTier;
  category: 'nutrition' | 'training' | 'optimization' | 'analytics';
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  feature: Feature;
  requiresUpgrade: boolean;
  upgradeMessage?: string;
}

export interface FeatureSet {
  available: Feature[];
  unavailable: Feature[];
  totalCount: number;
  availableCount: number;
}

/**
 * Feature definitions with tier requirements
 */
const FEATURES: Record<FeatureId, Feature> = {
  // Free tier features
  basic_meal_plan: {
    id: 'basic_meal_plan',
    name: 'Basic Meal Plan',
    description: '3-day rotating meal plan with macro targets',
    tier: 'free',
    category: 'nutrition'
  },
  simple_workout: {
    id: 'simple_workout',
    name: 'Simple Workout Plan',
    description: 'Basic workout split without periodization',
    tier: 'free',
    category: 'training'
  },
  basic_macros: {
    id: 'basic_macros',
    name: 'Basic Macros',
    description: 'Standard macro distribution for your goal',
    tier: 'free',
    category: 'nutrition'
  },
  progress_tracking: {
    id: 'progress_tracking',
    name: 'Progress Tracking',
    description: 'Track weight and measurements over time',
    tier: 'free',
    category: 'analytics'
  },
  bmr_tdee_calculation: {
    id: 'bmr_tdee_calculation',
    name: 'BMR & TDEE Calculation',
    description: 'Calculate your basal metabolic rate and total daily energy expenditure',
    tier: 'free',
    category: 'analytics'
  },
  goal_specific_calories: {
    id: 'goal_specific_calories',
    name: 'Goal-Specific Calories',
    description: 'Calorie targets adjusted for your specific goal',
    tier: 'free',
    category: 'nutrition'
  },
  protein_targets: {
    id: 'protein_targets',
    name: 'Protein Targets',
    description: 'Optimized protein intake for your goal',
    tier: 'free',
    category: 'nutrition'
  },
  basic_progression: {
    id: 'basic_progression',
    name: 'Basic Progression',
    description: 'Simple weekly progression tracking',
    tier: 'free',
    category: 'training'
  },
  
  // Pro tier features
  macro_cycling: {
    id: 'macro_cycling',
    name: 'Macro Cycling',
    description: 'Dynamic macro adjustments based on training schedule',
    tier: 'pro',
    category: 'nutrition'
  },
  refeed_strategy: {
    id: 'refeed_strategy',
    name: 'Refeed Strategy',
    description: 'Strategic high-calorie days to prevent metabolic adaptation',
    tier: 'pro',
    category: 'nutrition'
  },
  grocery_optimization: {
    id: 'grocery_optimization',
    name: 'Grocery Optimization',
    description: 'Smart grocery lists with cost optimization and bulk buying',
    tier: 'pro',
    category: 'optimization'
  },
  meal_prep_batching: {
    id: 'meal_prep_batching',
    name: 'Meal Prep Batching',
    description: 'Batch cooking strategies with storage instructions',
    tier: 'pro',
    category: 'optimization'
  },
  advanced_progression: {
    id: 'advanced_progression',
    name: 'Advanced Progression',
    description: 'Predictive adjustments and plateau prevention',
    tier: 'pro',
    category: 'training'
  },
  plateau_prevention: {
    id: 'plateau_prevention',
    name: 'Plateau Prevention',
    description: 'Automatic detection and prevention of training plateaus',
    tier: 'pro',
    category: 'training'
  },
  progress_projection: {
    id: 'progress_projection',
    name: 'Progress Projection',
    description: '8-week outcome predictions with confidence intervals',
    tier: 'pro',
    category: 'analytics'
  },
  seven_day_variety: {
    id: 'seven_day_variety',
    name: '7-Day Meal Variety',
    description: 'Full weekly meal variation with no repetition',
    tier: 'pro',
    category: 'nutrition'
  },
  carb_cycling: {
    id: 'carb_cycling',
    name: 'Carb Cycling',
    description: 'Higher carbs on training days, lower on rest days',
    tier: 'pro',
    category: 'nutrition'
  },
  periodized_training: {
    id: 'periodized_training',
    name: 'Periodized Training',
    description: 'Advanced training blocks with periodization',
    tier: 'pro',
    category: 'training'
  }
};

/**
 * Feature Gating Service
 * Provides methods to check feature access and manage subscription tiers
 */
export class FeatureGatingService {
  /**
   * Get all features available for a subscription tier
   */
  static getAvailableFeatures(tier: SubscriptionTier): Feature[] {
    return Object.values(FEATURES).filter(feature => {
      if (tier === 'pro') {
        return true; // Pro users get all features
      }
      return feature.tier === 'free'; // Free users only get free features
    });
  }

  /**
   * Get all feature IDs available for a subscription tier
   */
  static getAvailableFeatureIds(tier: SubscriptionTier): FeatureId[] {
    return this.getAvailableFeatures(tier).map(f => f.id);
  }

  /**
   * Get features unavailable for a subscription tier
   */
  static getUnavailableFeatures(tier: SubscriptionTier): Feature[] {
    if (tier === 'pro') {
      return []; // Pro users have access to all features
    }
    return Object.values(FEATURES).filter(feature => feature.tier === 'pro');
  }

  /**
   * Check if a specific feature is available for a user's subscription tier
   */
  static hasFeatureAccess(tier: SubscriptionTier, featureId: FeatureId): boolean {
    const feature = FEATURES[featureId];
    if (!feature) {
      return false;
    }
    
    if (tier === 'pro') {
      return true; // Pro users have access to all features
    }
    
    return feature.tier === 'free';
  }

  /**
   * Get detailed feature access information
   */
  static getFeatureAccess(tier: SubscriptionTier, featureId: FeatureId): FeatureAccessResult {
    const feature = FEATURES[featureId];
    
    if (!feature) {
      throw new Error(`Unknown feature: ${featureId}`);
    }
    
    const hasAccess = this.hasFeatureAccess(tier, featureId);
    const requiresUpgrade = !hasAccess && feature.tier === 'pro';
    
    return {
      hasAccess,
      feature,
      requiresUpgrade,
      upgradeMessage: requiresUpgrade 
        ? `Upgrade to Pro to unlock ${feature.name}` 
        : undefined
    };
  }

  /**
   * Get a complete feature set for a subscription tier
   */
  static getFeatureSet(tier: SubscriptionTier): FeatureSet {
    const available = this.getAvailableFeatures(tier);
    const unavailable = this.getUnavailableFeatures(tier);
    
    return {
      available,
      unavailable,
      totalCount: Object.keys(FEATURES).length,
      availableCount: available.length
    };
  }

  /**
   * Get features by category for a subscription tier
   */
  static getFeaturesByCategory(
    tier: SubscriptionTier, 
    category: Feature['category']
  ): Feature[] {
    return this.getAvailableFeatures(tier).filter(f => f.category === category);
  }

  /**
   * Get all feature definitions (for admin/display purposes)
   */
  static getAllFeatures(): Feature[] {
    return Object.values(FEATURES);
  }

  /**
   * Get a specific feature definition
   */
  static getFeature(featureId: FeatureId): Feature | undefined {
    return FEATURES[featureId];
  }

  /**
   * Check if multiple features are available
   */
  static hasAllFeatures(tier: SubscriptionTier, featureIds: FeatureId[]): boolean {
    return featureIds.every(id => this.hasFeatureAccess(tier, id));
  }

  /**
   * Check if any of the specified features are available
   */
  static hasAnyFeature(tier: SubscriptionTier, featureIds: FeatureId[]): boolean {
    return featureIds.some(id => this.hasFeatureAccess(tier, id));
  }

  /**
   * Get upgrade benefits (features that would be unlocked by upgrading)
   */
  static getUpgradeBenefits(currentTier: SubscriptionTier): Feature[] {
    if (currentTier === 'pro') {
      return []; // Already at highest tier
    }
    return this.getUnavailableFeatures(currentTier);
  }

  /**
   * Generate upgrade prompt message
   */
  static getUpgradePrompt(featureId: FeatureId): string {
    const feature = FEATURES[featureId];
    if (!feature) {
      return 'Upgrade to Pro for advanced features';
    }
    
    return `🔒 ${feature.name} is a Pro feature. Upgrade to unlock ${feature.description.toLowerCase()}.`;
  }

  /**
   * Validate subscription tier
   */
  static isValidTier(tier: string): tier is SubscriptionTier {
    return tier === 'free' || tier === 'pro';
  }
}

/**
 * Helper function to check feature access (convenience wrapper)
 */
export function hasFeature(tier: SubscriptionTier, featureId: FeatureId): boolean {
  return FeatureGatingService.hasFeatureAccess(tier, featureId);
}

/**
 * Helper function to get available features (convenience wrapper)
 */
export function getAvailableFeatures(tier: SubscriptionTier): FeatureId[] {
  return FeatureGatingService.getAvailableFeatureIds(tier);
}
