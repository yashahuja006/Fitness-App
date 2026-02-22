/**
 * Plan Complexity Limiter Service
 * Simplifies transformation plans based on subscription tier
 * 
 * Free tier limitations:
 * - 3-day rotating meal plan (vs 7-day variety)
 * - No macro cycling
 * - No grocery optimization or meal prep strategies
 * - Basic workout split without periodization
 * 
 * Pro tier: Full complexity with all features
 */

import type {
  TransformationPlan,
  SubscriptionTier,
  MealPlan,
  DayMealPlan,
  WorkoutPlan,
  MacroStrategy
} from '@/types/supabase-transformation-plans';

/**
 * Complexity limitation result with details about what was limited
 */
export interface ComplexityLimitationResult {
  plan: TransformationPlan;
  limitationsApplied: string[];
  featuresRemoved: string[];
  tier: SubscriptionTier;
}

/**
 * Plan Complexity Limiter Service
 * Applies tier-based limitations to transformation plans
 */
export class PlanComplexityLimiter {
  /**
   * Main method to limit plan complexity based on subscription tier
   * Returns the modified plan with details about applied limitations
   */
  static limitPlanComplexity(
    plan: TransformationPlan,
    tier: SubscriptionTier
  ): ComplexityLimitationResult {
    // Pro users get full complexity - no limitations
    if (tier === 'pro') {
      return {
        plan,
        limitationsApplied: [],
        featuresRemoved: [],
        tier
      };
    }

    // Track what limitations were applied
    const limitationsApplied: string[] = [];
    const featuresRemoved: string[] = [];

    // Create a copy to avoid mutating the original
    const limitedPlan = { ...plan };

    // 1. Simplify meal plan to 3-day rotation
    const mealPlanResult = this.simplifyMealPlan(limitedPlan.meal_plan);
    limitedPlan.meal_plan = mealPlanResult.mealPlan;
    if (mealPlanResult.wasSimplified) {
      limitationsApplied.push('Meal plan simplified to 3-day rotation');
    }

    // 2. Remove macro cycling
    if (limitedPlan.macro_strategy.macro_cycling !== null) {
      limitedPlan.macro_strategy = {
        ...limitedPlan.macro_strategy,
        macro_cycling: null
      };
      limitationsApplied.push('Macro cycling removed');
      featuresRemoved.push('macro_cycling');
    }

    // 3. Remove grocery optimization
    if (limitedPlan.grocery_optimization) {
      delete limitedPlan.grocery_optimization;
      limitationsApplied.push('Grocery optimization removed');
      featuresRemoved.push('grocery_optimization');
    }

    // 4. Simplify workout plan (remove periodization)
    const workoutResult = this.simplifyWorkoutPlan(limitedPlan.workout_plan);
    limitedPlan.workout_plan = workoutResult.workoutPlan;
    if (workoutResult.wasSimplified) {
      limitationsApplied.push('Workout plan simplified - periodization removed');
      featuresRemoved.push('periodized_training');
    }

    // 5. Remove refeed scheduling from weekly progression
    const progressionResult = this.simplifyProgression(limitedPlan.weekly_progression);
    limitedPlan.weekly_progression = progressionResult.progression;
    if (progressionResult.wasSimplified) {
      limitationsApplied.push('Refeed scheduling removed from progression');
      featuresRemoved.push('refeed_strategy');
    }

    // Update subscription tier in the plan
    limitedPlan.subscription_tier = tier;

    return {
      plan: limitedPlan,
      limitationsApplied,
      featuresRemoved,
      tier
    };
  }

  /**
   * Simplify meal plan to 3-day rotation for free tier
   * Reduces variety while maintaining macro targets
   */
  private static simplifyMealPlan(mealPlan: MealPlan): {
    mealPlan: MealPlan;
    wasSimplified: boolean;
  } {
    // For free tier, we use the same meal structure but indicate it's a 3-day rotation
    // The actual meal generation would create only 3 unique days that rotate
    // This method ensures the structure is correct for a simplified plan
    
    const simplifiedPlan: MealPlan = {
      training_day: this.simplifyDayMealPlan(mealPlan.training_day),
      rest_day: this.simplifyDayMealPlan(mealPlan.rest_day)
    };

    return {
      mealPlan: simplifiedPlan,
      wasSimplified: true
    };
  }

  /**
   * Simplify a single day's meal plan
   * Reduces complexity while maintaining nutritional targets
   */
  private static simplifyDayMealPlan(dayPlan: DayMealPlan): DayMealPlan {
    // Keep the same structure but limit to simpler meals
    // In practice, the meal generation AI would create simpler, more repetitive meals
    return {
      ...dayPlan,
      meals: dayPlan.meals.map(meal => ({
        ...meal,
        // Simplify preparation instructions
        preparation: meal.preparation 
          ? this.simplifyPreparation(meal.preparation)
          : undefined
      }))
    };
  }

  /**
   * Simplify meal preparation instructions
   */
  private static simplifyPreparation(preparation: string): string {
    // Keep preparation simple and concise for free tier
    const sentences = preparation.split('.').filter(s => s.trim());
    // Keep only the first 2-3 most important steps
    return sentences.slice(0, 3).join('. ') + '.';
  }

  /**
   * Simplify workout plan by removing periodization
   * Converts advanced periodized plans to basic progressive overload
   */
  private static simplifyWorkoutPlan(workoutPlan: WorkoutPlan): {
    workoutPlan: WorkoutPlan;
    wasSimplified: boolean;
  } {
    let wasSimplified = false;

    // Check if plan has periodization
    const hasPeriodization = workoutPlan.progression_scheme.toLowerCase().includes('periodiz');

    if (hasPeriodization) {
      wasSimplified = true;
    }

    const simplifiedPlan: WorkoutPlan = {
      ...workoutPlan,
      // Convert to linear progression for free tier
      progression_scheme: hasPeriodization ? 'linear' : workoutPlan.progression_scheme,
      // Simplify exercise structure description
      exercise_structure: this.simplifyExerciseStructure(workoutPlan.exercise_structure)
    };

    return {
      workoutPlan: simplifiedPlan,
      wasSimplified
    };
  }

  /**
   * Simplify exercise structure description
   */
  private static simplifyExerciseStructure(structure: string): string {
    // Remove advanced terminology and keep it simple
    return structure
      .replace(/periodized?/gi, 'progressive')
      .replace(/undulating/gi, 'varied')
      .replace(/mesocycle|microcycle/gi, 'training block');
  }

  /**
   * Simplify weekly progression by removing refeed days
   */
  private static simplifyProgression(progression: Array<{
    week: number;
    target_calories: number;
    adjustment_reason: string;
    plateau_prevention: boolean;
    refeed_scheduled?: boolean;
    expected_weight_change?: number;
  }>): {
    progression: typeof progression;
    wasSimplified: boolean;
  } {
    let wasSimplified = false;

    const simplifiedProgression = progression.map(week => {
      const weekCopy = { ...week };
      
      // Remove refeed scheduling for free tier
      if (weekCopy.refeed_scheduled) {
        delete weekCopy.refeed_scheduled;
        wasSimplified = true;
      }

      return weekCopy;
    });

    return {
      progression: simplifiedProgression,
      wasSimplified
    };
  }

  /**
   * Check if a plan has been limited (is free tier)
   */
  static isPlanLimited(plan: TransformationPlan): boolean {
    return plan.subscription_tier === 'free';
  }

  /**
   * Get a list of features that would be unlocked by upgrading
   */
  static getUpgradeFeatures(plan: TransformationPlan): string[] {
    if (plan.subscription_tier === 'pro') {
      return [];
    }

    const features: string[] = [
      '7-day meal variety (vs 3-day rotation)',
      'Macro cycling for training vs rest days',
      'Smart grocery list optimization',
      'Meal prep batching strategies',
      'Periodized training programs',
      'Refeed day scheduling',
      'Advanced plateau prevention'
    ];

    return features;
  }

  /**
   * Generate user-friendly message about plan limitations
   */
  static getLimitationMessage(result: ComplexityLimitationResult): string {
    if (result.tier === 'pro') {
      return 'You have access to all Pro features with full plan complexity.';
    }

    if (result.limitationsApplied.length === 0) {
      return 'Your free tier plan includes all basic features.';
    }

    const limitationsList = result.limitationsApplied
      .map(l => `• ${l}`)
      .join('\n');

    return `Your plan has been optimized for the free tier:\n\n${limitationsList}\n\nUpgrade to Pro to unlock advanced features and full customization.`;
  }

  /**
   * Validate that a plan's complexity matches its tier
   */
  static validatePlanComplexity(plan: TransformationPlan): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    if (plan.subscription_tier === 'free') {
      // Check for pro features that shouldn't be present
      if (plan.macro_strategy.macro_cycling !== null) {
        violations.push('Free tier plan should not have macro cycling');
      }

      if (plan.grocery_optimization) {
        violations.push('Free tier plan should not have grocery optimization');
      }

      if (plan.workout_plan.progression_scheme.toLowerCase().includes('periodiz')) {
        violations.push('Free tier plan should not have periodized training');
      }

      const hasRefeed = plan.weekly_progression.some(w => w.refeed_scheduled);
      if (hasRefeed) {
        violations.push('Free tier plan should not have refeed scheduling');
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

/**
 * Convenience function to limit plan complexity
 */
export function limitPlanComplexity(
  plan: TransformationPlan,
  tier: SubscriptionTier
): ComplexityLimitationResult {
  return PlanComplexityLimiter.limitPlanComplexity(plan, tier);
}

/**
 * Convenience function to check if plan is limited
 */
export function isPlanLimited(plan: TransformationPlan): boolean {
  return PlanComplexityLimiter.isPlanLimited(plan);
}

/**
 * Convenience function to get upgrade features
 */
export function getUpgradeFeatures(plan: TransformationPlan): string[] {
  return PlanComplexityLimiter.getUpgradeFeatures(plan);
}
