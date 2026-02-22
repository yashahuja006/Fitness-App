/**
 * Type-safe wrappers for Supabase database functions
 * AI Nutrition Engine - Complex Query Functions
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PlanStatistics {
  plan_id: string;
  total_weeks: number;
  weeks_completed: number;
  completion_percentage: number;
  avg_nutrition_adherence: number;
  avg_workout_adherence: number;
  total_weight_change: number;
  total_body_fat_change: number;
  last_recorded_weight: number | null;
  last_recorded_body_fat: number | null;
  last_update_date: string;
}

export interface ProgressTrend {
  week_number: number;
  weight: number;
  weight_change_from_previous: number;
  weight_change_from_start: number;
  body_fat_percentage: number | null;
  body_fat_change_from_previous: number;
  body_fat_change_from_start: number;
  nutrition_adherence: number;
  workout_adherence: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  recorded_at: string;
}

export interface AdherenceScores {
  overall_nutrition_adherence: number;
  overall_workout_adherence: number;
  combined_adherence: number;
  weeks_tracked: number;
  adherence_rating: 'excellent' | 'very_good' | 'good' | 'fair' | 'needs_improvement';
}

export interface ActivePlan {
  plan_id: string;
  created_at: string;
  duration_weeks: number;
  subscription_tier: 'free' | 'pro';
  status: string;
  completion_percentage: number;
  weeks_completed: number;
  target_calories: number;
  goal_type: string;
  avg_adherence: number;
  last_weight: number | null;
  weight_change: number;
}

export interface WeekComparison {
  current_week: number;
  current_weight: number;
  current_body_fat: number | null;
  current_nutrition_adherence: number;
  current_workout_adherence: number;
  previous_week: number;
  previous_weight: number;
  previous_body_fat: number | null;
  previous_nutrition_adherence: number;
  previous_workout_adherence: number;
  weight_change: number;
  body_fat_change: number;
  nutrition_adherence_change: number;
  workout_adherence_change: number;
  performance_summary: 'excellent_progress' | 'good_progress' | 'muscle_gain' | 'plateau' | 'needs_adjustment';
}

export interface WeeklyProgressSummary {
  week_number: number;
  weight: number;
  body_fat_percentage: number | null;
  nutrition_adherence: number;
  workout_adherence: number;
  calorie_adjustment: number;
  week_status: 'on_track' | 'good' | 'needs_attention';
  recorded_at: string;
}

export interface PlanOverview {
  plan_id: string;
  user_id: string;
  created_at: string;
  duration_weeks: number;
  subscription_tier: 'free' | 'pro';
  status: string;
  completion_percentage: number;
  bmr: number;
  maintenance_calories: number;
  target_calories: number;
  goal_strategy: string;
  protein_target: number;
  carbs_target: number;
  fats_target: number;
  weeks_with_data: number;
  avg_nutrition_adherence: number;
  avg_workout_adherence: number;
}

// ============================================================================
// Database Function Wrappers
// ============================================================================

/**
 * Get comprehensive statistics for a transformation plan
 */
export async function getPlanStatistics(
  supabase: ReturnType<typeof createClient>,
  planId: string
): Promise<{ data: PlanStatistics | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_plan_statistics', { p_plan_id: planId })
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Analyze progress trends over specified weeks
 */
export async function analyzeProgressTrends(
  supabase: ReturnType<typeof createClient>,
  planId: string,
  weeksBack: number = 4
): Promise<{ data: ProgressTrend[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('analyze_progress_trends', {
        p_plan_id: planId,
        p_weeks_back: weeksBack
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Calculate adherence scores for a plan
 */
export async function calculateAdherenceScores(
  supabase: ReturnType<typeof createClient>,
  planId: string,
  startWeek: number = 1,
  endWeek?: number
): Promise<{ data: AdherenceScores | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_adherence_scores', {
        p_plan_id: planId,
        p_start_week: startWeek,
        p_end_week: endWeek || null
      })
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all active plans for a user
 */
export async function getActivePlansForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ data: ActivePlan[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_active_plans_for_user', { p_user_id: userId });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Compare current week with previous week
 */
export async function compareWeekOverWeek(
  supabase: ReturnType<typeof createClient>,
  planId: string,
  currentWeek: number
): Promise<{ data: WeekComparison | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('compare_week_over_week', {
        p_plan_id: planId,
        p_current_week: currentWeek
      })
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get weekly progress summary for dashboard
 */
export async function getWeeklyProgressSummary(
  supabase: ReturnType<typeof createClient>,
  planId: string
): Promise<{ data: WeeklyProgressSummary[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_weekly_progress_summary', { p_plan_id: planId });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get plan overview from view (faster for list queries)
 */
export async function getPlanOverview(
  supabase: ReturnType<typeof createClient>,
  userId?: string
): Promise<{ data: PlanOverview[] | null; error: Error | null }> {
  try {
    let query = supabase.from('plan_overview').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format adherence rating for display
 */
export function formatAdherenceRating(rating: AdherenceScores['adherence_rating']): string {
  const ratings = {
    excellent: 'Excellent',
    very_good: 'Very Good',
    good: 'Good',
    fair: 'Fair',
    needs_improvement: 'Needs Improvement'
  };
  return ratings[rating];
}

/**
 * Format performance summary for display
 */
export function formatPerformanceSummary(summary: WeekComparison['performance_summary']): string {
  const summaries = {
    excellent_progress: 'Excellent Progress',
    good_progress: 'Good Progress',
    muscle_gain: 'Muscle Gain',
    plateau: 'Plateau',
    needs_adjustment: 'Needs Adjustment'
  };
  return summaries[summary];
}

/**
 * Get color for adherence rating
 */
export function getAdherenceColor(rating: AdherenceScores['adherence_rating']): string {
  const colors = {
    excellent: 'green',
    very_good: 'blue',
    good: 'yellow',
    fair: 'orange',
    needs_improvement: 'red'
  };
  return colors[rating];
}

/**
 * Get color for week status
 */
export function getWeekStatusColor(status: WeeklyProgressSummary['week_status']): string {
  const colors = {
    on_track: 'green',
    good: 'blue',
    needs_attention: 'orange'
  };
  return colors[status];
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(weeksCompleted: number, totalWeeks: number): number {
  if (totalWeeks === 0) return 0;
  return Math.round((weeksCompleted / totalWeeks) * 100);
}

/**
 * Format weight change with sign
 */
export function formatWeightChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)} kg`;
}

/**
 * Format body fat change with sign
 */
export function formatBodyFatChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}
