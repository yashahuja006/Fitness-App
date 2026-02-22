/**
 * Unit tests for Plan Complexity Limiter Service
 * Tests tier-based plan simplification and feature gating
 */

import { describe, it, expect } from '@jest/globals';
import {
  PlanComplexityLimiter,
  limitPlanComplexity,
  isPlanLimited,
  getUpgradeFeatures
} from '@/lib/planComplexityLimiter';
import type {
  TransformationPlan,
  MealPlan,
  WorkoutPlan,
  MacroStrategy,
  WeeklyProgression
} from '@/types/supabase-transformation-plans';

// Helper function to create a mock transformation plan
function createMockPlan(tier: 'free' | 'pro' = 'pro'): TransformationPlan {
  return {
    id: 'test-plan-id',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    duration_weeks: 8,
    subscription_tier: tier,
    metabolic_analysis: {
      bmr: 1800,
      maintenance_calories: 2400,
      target_calories_week1: 2000,
      strategy: 'deficit',
      activity_level: 'moderate',
      goal: 'fat_loss'
    },
    macro_strategy: {
      protein_grams: 150,
      carbs_grams: 200,
      fats_grams: 60,
      macro_cycling: {
        training_day: {
          calories: 2200,
          protein_grams: 150,
          carbs_grams: 250,
          fats_grams: 55,
          carb_percentage: 45,
          protein_percentage: 27,
          fat_percentage: 28
        },
        rest_day: {
          calories: 1800,
          protein_grams: 150,
          carbs_grams: 150,
          fats_grams: 65,
          carb_percentage: 33,
          protein_percentage: 33,
          fat_percentage: 34
        }
      }
    },
    weekly_progression: [
      {
        week: 1,
        target_calories: 2000,
        adjustment_reason: 'Initial target',
        plateau_prevention: false,
        refeed_scheduled: false
      },
      {
        week: 2,
        target_calories: 1950,
        adjustment_reason: 'Progressive taper',
        plateau_prevention: false,
        refeed_scheduled: true
      }
    ],
    meal_plan: {
      training_day: {
        total_calories: 2200,
        total_protein: 150,
        total_carbs: 250,
        total_fats: 55,
        meals: [
          {
            name: 'Breakfast',
            calories: 550,
            protein: 40,
            carbs: 60,
            fats: 15,
            ingredients: [
              {
                name: 'Oats',
                quantity: '80g',
                calories: 300,
                protein: 10,
                carbs: 50,
                fats: 5
              }
            ],
            preparation: 'Cook oats with water. Add protein powder. Top with berries and nuts. Serve warm.'
          }
        ]
      },
      rest_day: {
        total_calories: 1800,
        total_protein: 150,
        total_carbs: 150,
        total_fats: 65,
        meals: [
          {
            name: 'Breakfast',
            calories: 450,
            protein: 40,
            carbs: 40,
            fats: 20,
            ingredients: [
              {
                name: 'Eggs',
                quantity: '3 large',
                calories: 210,
                protein: 18,
                carbs: 2,
                fats: 15
              }
            ]
          }
        ]
      }
    },
    workout_plan: {
      split_type: 'push_pull_legs',
      weekly_schedule: [
        {
          day: 'Monday',
          focus: 'Push',
          exercises: [
            {
              name: 'Bench Press',
              sets: 4,
              reps: '8-10',
              rpe: 8,
              rest_seconds: 120
            }
          ]
        }
      ],
      exercise_structure: 'Periodized hypertrophy and strength blocks with undulating intensity',
      progression_scheme: 'periodized',
      rpe_range: [7, 9]
    },
    progress_projection: {
      expected_weight_change: -4,
      expected_bf_change: -3,
      confidence_level: 'high',
      timeline_weeks: 8,
      assumptions: ['80% adherence', 'Consistent training']
    },
    grocery_optimization: {
      consolidated_list: [
        {
          name: 'Chicken Breast',
          quantity: '2kg',
          category: 'Protein'
        }
      ]
    },
    status: 'active',
    completion_percentage: 0
  };
}

describe('PlanComplexityLimiter', () => {
  describe('limitPlanComplexity', () => {
    it('should not modify pro tier plans', () => {
      const proPlan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(proPlan, 'pro');

      expect(result.tier).toBe('pro');
      expect(result.limitationsApplied).toHaveLength(0);
      expect(result.featuresRemoved).toHaveLength(0);
      expect(result.plan.macro_strategy.macro_cycling).not.toBeNull();
      expect(result.plan.grocery_optimization).toBeDefined();
    });

    it('should remove macro cycling for free tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.macro_strategy.macro_cycling).toBeNull();
      expect(result.limitationsApplied).toContain('Macro cycling removed');
      expect(result.featuresRemoved).toContain('macro_cycling');
    });

    it('should remove grocery optimization for free tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.grocery_optimization).toBeUndefined();
      expect(result.limitationsApplied).toContain('Grocery optimization removed');
      expect(result.featuresRemoved).toContain('grocery_optimization');
    });

    it('should simplify meal plan for free tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.limitationsApplied).toContain('Meal plan simplified to 3-day rotation');
      // Meal structure should still be present
      expect(result.plan.meal_plan.training_day).toBeDefined();
      expect(result.plan.meal_plan.rest_day).toBeDefined();
    });

    it('should remove periodization from workout plan for free tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.workout_plan.progression_scheme).toBe('linear');
      expect(result.limitationsApplied).toContain('Workout plan simplified - periodization removed');
      expect(result.featuresRemoved).toContain('periodized_training');
    });

    it('should remove refeed scheduling for free tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      const hasRefeed = result.plan.weekly_progression.some(w => w.refeed_scheduled);
      expect(hasRefeed).toBe(false);
      expect(result.limitationsApplied).toContain('Refeed scheduling removed from progression');
      expect(result.featuresRemoved).toContain('refeed_strategy');
    });

    it('should update subscription tier in the plan', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.subscription_tier).toBe('free');
    });

    it('should not mutate the original plan', () => {
      const plan = createMockPlan('pro');
      const originalMacroCycling = plan.macro_strategy.macro_cycling;
      
      PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      // Original plan should remain unchanged
      expect(plan.macro_strategy.macro_cycling).toBe(originalMacroCycling);
    });

    it('should track all applied limitations', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.limitationsApplied.length).toBeGreaterThan(0);
      expect(result.featuresRemoved.length).toBeGreaterThan(0);
    });
  });

  describe('isPlanLimited', () => {
    it('should return true for free tier plans', () => {
      const plan = createMockPlan('free');
      expect(PlanComplexityLimiter.isPlanLimited(plan)).toBe(true);
    });

    it('should return false for pro tier plans', () => {
      const plan = createMockPlan('pro');
      expect(PlanComplexityLimiter.isPlanLimited(plan)).toBe(false);
    });
  });

  describe('getUpgradeFeatures', () => {
    it('should return empty array for pro tier plans', () => {
      const plan = createMockPlan('pro');
      const features = PlanComplexityLimiter.getUpgradeFeatures(plan);

      expect(features).toHaveLength(0);
    });

    it('should return list of features for free tier plans', () => {
      const plan = createMockPlan('free');
      const features = PlanComplexityLimiter.getUpgradeFeatures(plan);

      expect(features.length).toBeGreaterThan(0);
      expect(features).toContain('7-day meal variety (vs 3-day rotation)');
      expect(features).toContain('Macro cycling for training vs rest days');
      expect(features).toContain('Smart grocery list optimization');
      expect(features).toContain('Periodized training programs');
    });
  });

  describe('getLimitationMessage', () => {
    it('should return pro message for pro tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'pro');
      const message = PlanComplexityLimiter.getLimitationMessage(result);

      expect(message).toContain('Pro features');
      expect(message).toContain('full plan complexity');
    });

    it('should return detailed limitations for free tier', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');
      const message = PlanComplexityLimiter.getLimitationMessage(result);

      expect(message).toContain('free tier');
      expect(message).toContain('Upgrade to Pro');
    });
  });

  describe('validatePlanComplexity', () => {
    it('should validate pro tier plans correctly', () => {
      const plan = createMockPlan('pro');
      const validation = PlanComplexityLimiter.validatePlanComplexity(plan);

      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should detect macro cycling violation in free tier', () => {
      const plan = createMockPlan('free');
      // Plan still has macro cycling (shouldn't for free tier)
      plan.macro_strategy.macro_cycling = {
        training_day: {
          calories: 2200,
          protein_grams: 150,
          carbs_grams: 250,
          fats_grams: 55,
          carb_percentage: 45,
          protein_percentage: 27,
          fat_percentage: 28
        },
        rest_day: {
          calories: 1800,
          protein_grams: 150,
          carbs_grams: 150,
          fats_grams: 65,
          carb_percentage: 33,
          protein_percentage: 33,
          fat_percentage: 34
        }
      };

      const validation = PlanComplexityLimiter.validatePlanComplexity(plan);

      expect(validation.isValid).toBe(false);
      expect(validation.violations).toContain('Free tier plan should not have macro cycling');
    });

    it('should detect grocery optimization violation in free tier', () => {
      const plan = createMockPlan('free');
      plan.grocery_optimization = {
        consolidated_list: []
      };

      const validation = PlanComplexityLimiter.validatePlanComplexity(plan);

      expect(validation.isValid).toBe(false);
      expect(validation.violations).toContain('Free tier plan should not have grocery optimization');
    });

    it('should detect periodization violation in free tier', () => {
      const plan = createMockPlan('free');
      plan.workout_plan.progression_scheme = 'periodized';

      const validation = PlanComplexityLimiter.validatePlanComplexity(plan);

      expect(validation.isValid).toBe(false);
      expect(validation.violations).toContain('Free tier plan should not have periodized training');
    });

    it('should detect refeed scheduling violation in free tier', () => {
      const plan = createMockPlan('free');
      plan.weekly_progression[0].refeed_scheduled = true;

      const validation = PlanComplexityLimiter.validatePlanComplexity(plan);

      expect(validation.isValid).toBe(false);
      expect(validation.violations).toContain('Free tier plan should not have refeed scheduling');
    });

    it('should validate properly limited free tier plan', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');
      const validation = PlanComplexityLimiter.validatePlanComplexity(result.plan);

      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  describe('Convenience functions', () => {
    it('limitPlanComplexity should work as standalone function', () => {
      const plan = createMockPlan('pro');
      const result = limitPlanComplexity(plan, 'free');

      expect(result.tier).toBe('free');
      expect(result.plan.macro_strategy.macro_cycling).toBeNull();
    });

    it('isPlanLimited should work as standalone function', () => {
      const freePlan = createMockPlan('free');
      const proPlan = createMockPlan('pro');

      expect(isPlanLimited(freePlan)).toBe(true);
      expect(isPlanLimited(proPlan)).toBe(false);
    });

    it('getUpgradeFeatures should work as standalone function', () => {
      const plan = createMockPlan('free');
      const features = getUpgradeFeatures(plan);

      expect(features.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle plan without grocery optimization', () => {
      const plan = createMockPlan('pro');
      delete plan.grocery_optimization;

      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.grocery_optimization).toBeUndefined();
      expect(result.featuresRemoved).not.toContain('grocery_optimization');
    });

    it('should handle plan without macro cycling', () => {
      const plan = createMockPlan('pro');
      plan.macro_strategy.macro_cycling = null;

      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.macro_strategy.macro_cycling).toBeNull();
      expect(result.featuresRemoved).not.toContain('macro_cycling');
    });

    it('should handle plan with non-periodized workout', () => {
      const plan = createMockPlan('pro');
      plan.workout_plan.progression_scheme = 'linear';

      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.workout_plan.progression_scheme).toBe('linear');
    });

    it('should handle empty weekly progression', () => {
      const plan = createMockPlan('pro');
      plan.weekly_progression = [];

      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.weekly_progression).toHaveLength(0);
    });

    it('should handle meal without preparation instructions', () => {
      const plan = createMockPlan('pro');
      delete plan.meal_plan.training_day.meals[0].preparation;

      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.meal_plan.training_day.meals[0].preparation).toBeUndefined();
    });
  });

  describe('Plan integrity', () => {
    it('should maintain all required plan fields', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      // Check all required fields are present
      expect(result.plan.id).toBeDefined();
      expect(result.plan.user_id).toBeDefined();
      expect(result.plan.metabolic_analysis).toBeDefined();
      expect(result.plan.macro_strategy).toBeDefined();
      expect(result.plan.weekly_progression).toBeDefined();
      expect(result.plan.meal_plan).toBeDefined();
      expect(result.plan.workout_plan).toBeDefined();
      expect(result.plan.progress_projection).toBeDefined();
    });

    it('should maintain macro strategy structure', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.macro_strategy.protein_grams).toBe(plan.macro_strategy.protein_grams);
      expect(result.plan.macro_strategy.carbs_grams).toBe(plan.macro_strategy.carbs_grams);
      expect(result.plan.macro_strategy.fats_grams).toBe(plan.macro_strategy.fats_grams);
    });

    it('should maintain meal plan structure', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.meal_plan.training_day).toBeDefined();
      expect(result.plan.meal_plan.rest_day).toBeDefined();
      expect(result.plan.meal_plan.training_day.meals.length).toBeGreaterThan(0);
    });

    it('should maintain workout plan structure', () => {
      const plan = createMockPlan('pro');
      const result = PlanComplexityLimiter.limitPlanComplexity(plan, 'free');

      expect(result.plan.workout_plan.split_type).toBeDefined();
      expect(result.plan.workout_plan.weekly_schedule).toBeDefined();
      expect(result.plan.workout_plan.rpe_range).toBeDefined();
    });
  });
});
