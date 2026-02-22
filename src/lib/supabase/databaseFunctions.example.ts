/**
 * Example usage of database functions for AI Nutrition Engine
 * This file demonstrates how to use the type-safe wrappers
 */

import { createClient } from '@supabase/supabase-js';
import {
  getPlanStatistics,
  analyzeProgressTrends,
  calculateAdherenceScores,
  getActivePlansForUser,
  compareWeekOverWeek,
  getWeeklyProgressSummary,
  getPlanOverview,
  formatAdherenceRating,
  formatPerformanceSummary,
  formatWeightChange,
  formatBodyFatChange,
} from './databaseFunctions';

// Initialize Supabase client (use your actual configuration)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================================
// Example 1: Get Plan Statistics
// ============================================================================
export async function exampleGetPlanStatistics(planId: string) {
  const { data, error } = await getPlanStatistics(supabase, planId);

  if (error) {
    console.error('Error fetching plan statistics:', error);
    return;
  }

  if (!data) {
    console.log('No statistics found for this plan');
    return;
  }

  console.log('Plan Statistics:');
  console.log(`- Total Weeks: ${data.total_weeks}`);
  console.log(`- Weeks Completed: ${data.weeks_completed}`);
  console.log(`- Completion: ${data.completion_percentage}%`);
  console.log(`- Avg Nutrition Adherence: ${data.avg_nutrition_adherence}%`);
  console.log(`- Avg Workout Adherence: ${data.avg_workout_adherence}%`);
  console.log(`- Weight Change: ${formatWeightChange(data.total_weight_change)}`);
  console.log(`- Body Fat Change: ${formatBodyFatChange(data.total_body_fat_change)}`);

  return data;
}

// ============================================================================
// Example 2: Analyze Progress Trends
// ============================================================================
export async function exampleAnalyzeProgressTrends(planId: string) {
  const { data, error } = await analyzeProgressTrends(supabase, planId, 4);

  if (error) {
    console.error('Error analyzing progress trends:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No progress data found');
    return;
  }

  console.log('Progress Trends (Last 4 Weeks):');
  data.forEach((week) => {
    console.log(`\nWeek ${week.week_number}:`);
    console.log(`  Weight: ${week.weight} kg (${week.trend_direction})`);
    console.log(`  Change from previous: ${formatWeightChange(week.weight_change_from_previous)}`);
    console.log(`  Change from start: ${formatWeightChange(week.weight_change_from_start)}`);
    console.log(`  Nutrition Adherence: ${week.nutrition_adherence}%`);
    console.log(`  Workout Adherence: ${week.workout_adherence}%`);
  });

  return data;
}

// ============================================================================
// Example 3: Calculate Adherence Scores
// ============================================================================
export async function exampleCalculateAdherenceScores(planId: string) {
  const { data, error } = await calculateAdherenceScores(supabase, planId);

  if (error) {
    console.error('Error calculating adherence scores:', error);
    return;
  }

  if (!data) {
    console.log('No adherence data found');
    return;
  }

  console.log('Adherence Scores:');
  console.log(`- Nutrition: ${data.overall_nutrition_adherence}%`);
  console.log(`- Workout: ${data.overall_workout_adherence}%`);
  console.log(`- Combined: ${data.combined_adherence}%`);
  console.log(`- Rating: ${formatAdherenceRating(data.adherence_rating)}`);
  console.log(`- Weeks Tracked: ${data.weeks_tracked}`);

  return data;
}

// ============================================================================
// Example 4: Get Active Plans for User
// ============================================================================
export async function exampleGetActivePlansForUser(userId: string) {
  const { data, error } = await getActivePlansForUser(supabase, userId);

  if (error) {
    console.error('Error fetching active plans:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No active plans found for this user');
    return;
  }

  console.log(`Active Plans (${data.length}):`);
  data.forEach((plan) => {
    console.log(`\nPlan ID: ${plan.plan_id}`);
    console.log(`  Goal: ${plan.goal_type}`);
    console.log(`  Duration: ${plan.duration_weeks} weeks`);
    console.log(`  Progress: ${plan.weeks_completed}/${plan.duration_weeks} weeks`);
    console.log(`  Target Calories: ${plan.target_calories} kcal`);
    console.log(`  Avg Adherence: ${plan.avg_adherence}%`);
    console.log(`  Weight Change: ${formatWeightChange(plan.weight_change)}`);
    console.log(`  Tier: ${plan.subscription_tier}`);
  });

  return data;
}

// ============================================================================
// Example 5: Compare Week Over Week
// ============================================================================
export async function exampleCompareWeekOverWeek(planId: string, currentWeek: number) {
  const { data, error } = await compareWeekOverWeek(supabase, planId, currentWeek);

  if (error) {
    console.error('Error comparing weeks:', error);
    return;
  }

  if (!data) {
    console.log('No comparison data found');
    return;
  }

  console.log(`Week ${data.current_week} vs Week ${data.previous_week}:`);
  console.log('\nCurrent Week:');
  console.log(`  Weight: ${data.current_weight} kg`);
  console.log(`  Body Fat: ${data.current_body_fat}%`);
  console.log(`  Nutrition Adherence: ${data.current_nutrition_adherence}%`);
  console.log(`  Workout Adherence: ${data.current_workout_adherence}%`);

  console.log('\nChanges:');
  console.log(`  Weight: ${formatWeightChange(data.weight_change)}`);
  console.log(`  Body Fat: ${formatBodyFatChange(data.body_fat_change)}`);
  console.log(`  Nutrition Adherence: ${data.nutrition_adherence_change > 0 ? '+' : ''}${data.nutrition_adherence_change}%`);
  console.log(`  Workout Adherence: ${data.workout_adherence_change > 0 ? '+' : ''}${data.workout_adherence_change}%`);

  console.log(`\nPerformance: ${formatPerformanceSummary(data.performance_summary)}`);

  return data;
}

// ============================================================================
// Example 6: Get Weekly Progress Summary
// ============================================================================
export async function exampleGetWeeklyProgressSummary(planId: string) {
  const { data, error } = await getWeeklyProgressSummary(supabase, planId);

  if (error) {
    console.error('Error fetching weekly summary:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No weekly progress data found');
    return;
  }

  console.log('Weekly Progress Summary:');
  data.forEach((week) => {
    console.log(`\nWeek ${week.week_number} (${week.week_status}):`);
    console.log(`  Weight: ${week.weight} kg`);
    console.log(`  Body Fat: ${week.body_fat_percentage}%`);
    console.log(`  Nutrition: ${week.nutrition_adherence}%`);
    console.log(`  Workout: ${week.workout_adherence}%`);
    console.log(`  Calorie Adjustment: ${week.calorie_adjustment > 0 ? '+' : ''}${week.calorie_adjustment} kcal`);
  });

  return data;
}

// ============================================================================
// Example 7: Get Plan Overview (Using View)
// ============================================================================
export async function exampleGetPlanOverview(userId?: string) {
  const { data, error } = await getPlanOverview(supabase, userId);

  if (error) {
    console.error('Error fetching plan overview:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No plans found');
    return;
  }

  console.log(`Plan Overview (${data.length} plans):`);
  data.forEach((plan) => {
    console.log(`\nPlan ID: ${plan.plan_id}`);
    console.log(`  Status: ${plan.status}`);
    console.log(`  Duration: ${plan.duration_weeks} weeks`);
    console.log(`  BMR: ${plan.bmr} kcal`);
    console.log(`  Maintenance: ${plan.maintenance_calories} kcal`);
    console.log(`  Target: ${plan.target_calories} kcal`);
    console.log(`  Macros: P${plan.protein_target}g / C${plan.carbs_target}g / F${plan.fats_target}g`);
    console.log(`  Weeks with Data: ${plan.weeks_with_data}`);
    console.log(`  Avg Adherence: ${plan.avg_nutrition_adherence}% / ${plan.avg_workout_adherence}%`);
  });

  return data;
}

// ============================================================================
// Example 8: Dashboard Data Aggregation
// ============================================================================
export async function exampleDashboardData(planId: string, userId: string) {
  console.log('Fetching comprehensive dashboard data...\n');

  // Fetch all relevant data in parallel
  const [stats, trends, adherence, activePlans, weeklySummary] = await Promise.all([
    getPlanStatistics(supabase, planId),
    analyzeProgressTrends(supabase, planId, 4),
    calculateAdherenceScores(supabase, planId),
    getActivePlansForUser(supabase, userId),
    getWeeklyProgressSummary(supabase, planId),
  ]);

  // Check for errors
  if (stats.error || trends.error || adherence.error || activePlans.error || weeklySummary.error) {
    console.error('Error fetching dashboard data');
    return null;
  }

  // Aggregate dashboard data
  const dashboardData = {
    statistics: stats.data,
    recentTrends: trends.data,
    adherenceScores: adherence.data,
    allActivePlans: activePlans.data,
    weeklyProgress: weeklySummary.data,
  };

  console.log('Dashboard Data Summary:');
  console.log(`- Plan Completion: ${stats.data?.completion_percentage}%`);
  console.log(`- Overall Adherence: ${adherence.data?.combined_adherence}% (${formatAdherenceRating(adherence.data?.adherence_rating || 'needs_improvement')})`);
  console.log(`- Total Weight Change: ${formatWeightChange(stats.data?.total_weight_change || 0)}`);
  console.log(`- Active Plans: ${activePlans.data?.length || 0}`);
  console.log(`- Weeks Tracked: ${weeklySummary.data?.length || 0}`);

  return dashboardData;
}

// ============================================================================
// Example Usage in React Component
// ============================================================================

/*
// Example React component using these functions

import { useEffect, useState } from 'react';
import { getPlanStatistics, PlanStatistics } from '@/lib/supabase/databaseFunctions';
import { createClient } from '@/lib/supabase/client';

export function PlanStatisticsCard({ planId }: { planId: string }) {
  const [stats, setStats] = useState<PlanStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await getPlanStatistics(supabase, planId);
      
      if (error) {
        console.error('Error:', error);
        return;
      }
      
      setStats(data);
      setLoading(false);
    }

    fetchStats();
  }, [planId]);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="card">
      <h2>Plan Statistics</h2>
      <p>Completion: {stats.completion_percentage}%</p>
      <p>Weeks: {stats.weeks_completed}/{stats.total_weeks}</p>
      <p>Avg Adherence: {stats.avg_nutrition_adherence}%</p>
      <p>Weight Change: {stats.total_weight_change} kg</p>
    </div>
  );
}
*/
