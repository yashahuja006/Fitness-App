-- Create database functions for complex queries in AI Nutrition Engine
-- These functions provide efficient, reusable queries for plan statistics,
-- progress analysis, adherence calculations, and week-over-week comparisons

-- ============================================================================
-- Function 1: Get Plan Statistics
-- Returns aggregated statistics for a transformation plan
-- ============================================================================
CREATE OR REPLACE FUNCTION get_plan_statistics(p_plan_id UUID)
RETURNS TABLE (
  plan_id UUID,
  total_weeks INTEGER,
  weeks_completed INTEGER,
  completion_percentage DECIMAL,
  avg_nutrition_adherence DECIMAL,
  avg_workout_adherence DECIMAL,
  total_weight_change DECIMAL,
  total_body_fat_change DECIMAL,
  last_recorded_weight DECIMAL,
  last_recorded_body_fat DECIMAL,
  last_update_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id AS plan_id,
    tp.duration_weeks AS total_weeks,
    COALESCE(COUNT(DISTINCT pt.week_number)::INTEGER, 0) AS weeks_completed,
    tp.completion_percentage,
    COALESCE(ROUND(AVG(pt.nutrition_adherence), 2), 0) AS avg_nutrition_adherence,
    COALESCE(ROUND(AVG(pt.workout_adherence), 2), 0) AS avg_workout_adherence,
    COALESCE(
      (SELECT weight FROM progress_tracking 
       WHERE plan_id = p_plan_id 
       ORDER BY week_number DESC LIMIT 1) - 
      (SELECT weight FROM progress_tracking 
       WHERE plan_id = p_plan_id 
       ORDER BY week_number ASC LIMIT 1),
      0
    ) AS total_weight_change,
    COALESCE(
      (SELECT body_fat_percentage FROM progress_tracking 
       WHERE plan_id = p_plan_id 
       ORDER BY week_number DESC LIMIT 1) - 
      (SELECT body_fat_percentage FROM progress_tracking 
       WHERE plan_id = p_plan_id 
       ORDER BY week_number ASC LIMIT 1),
      0
    ) AS total_body_fat_change,
    (SELECT weight FROM progress_tracking 
     WHERE plan_id = p_plan_id 
     ORDER BY week_number DESC LIMIT 1) AS last_recorded_weight,
    (SELECT body_fat_percentage FROM progress_tracking 
     WHERE plan_id = p_plan_id 
     ORDER BY week_number DESC LIMIT 1) AS last_recorded_body_fat,
    tp.updated_at AS last_update_date
  FROM transformation_plans tp
  LEFT JOIN progress_tracking pt ON tp.id = pt.plan_id
  WHERE tp.id = p_plan_id
  GROUP BY tp.id, tp.duration_weeks, tp.completion_percentage, tp.updated_at;
END;
$$;

COMMENT ON FUNCTION get_plan_statistics IS 'Returns comprehensive statistics for a transformation plan including completion, adherence, and progress metrics';

-- ============================================================================
-- Function 2: Analyze Progress Trends
-- Calculates weight change, body fat change, and trend analysis over time
-- ============================================================================
CREATE OR REPLACE FUNCTION analyze_progress_trends(p_plan_id UUID, p_weeks_back INTEGER DEFAULT 4)
RETURNS TABLE (
  week_number INTEGER,
  weight DECIMAL,
  weight_change_from_previous DECIMAL,
  weight_change_from_start DECIMAL,
  body_fat_percentage DECIMAL,
  body_fat_change_from_previous DECIMAL,
  body_fat_change_from_start DECIMAL,
  nutrition_adherence DECIMAL,
  workout_adherence DECIMAL,
  trend_direction TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_weight DECIMAL;
  v_start_body_fat DECIMAL;
BEGIN
  -- Get starting values
  SELECT pt.weight, pt.body_fat_percentage
  INTO v_start_weight, v_start_body_fat
  FROM progress_tracking pt
  WHERE pt.plan_id = p_plan_id
  ORDER BY pt.week_number ASC
  LIMIT 1;

  RETURN QUERY
  WITH progress_data AS (
    SELECT 
      pt.week_number,
      pt.weight,
      pt.body_fat_percentage,
      pt.nutrition_adherence,
      pt.workout_adherence,
      pt.recorded_at,
      LAG(pt.weight) OVER (ORDER BY pt.week_number) AS prev_weight,
      LAG(pt.body_fat_percentage) OVER (ORDER BY pt.week_number) AS prev_body_fat
    FROM progress_tracking pt
    WHERE pt.plan_id = p_plan_id
    ORDER BY pt.week_number DESC
    LIMIT p_weeks_back
  )
  SELECT 
    pd.week_number,
    pd.weight,
    COALESCE(pd.weight - pd.prev_weight, 0) AS weight_change_from_previous,
    COALESCE(pd.weight - v_start_weight, 0) AS weight_change_from_start,
    pd.body_fat_percentage,
    COALESCE(pd.body_fat_percentage - pd.prev_body_fat, 0) AS body_fat_change_from_previous,
    COALESCE(pd.body_fat_percentage - v_start_body_fat, 0) AS body_fat_change_from_start,
    pd.nutrition_adherence,
    pd.workout_adherence,
    CASE 
      WHEN pd.weight < pd.prev_weight THEN 'decreasing'
      WHEN pd.weight > pd.prev_weight THEN 'increasing'
      ELSE 'stable'
    END AS trend_direction,
    pd.recorded_at
  FROM progress_data pd
  ORDER BY pd.week_number DESC;
END;
$$;

COMMENT ON FUNCTION analyze_progress_trends IS 'Analyzes progress trends including weight change, body fat change, and trend direction over specified weeks';

-- ============================================================================
-- Function 3: Calculate Adherence Scores
-- Computes average adherence scores for nutrition and workouts
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_adherence_scores(
  p_plan_id UUID,
  p_start_week INTEGER DEFAULT 1,
  p_end_week INTEGER DEFAULT NULL
)
RETURNS TABLE (
  overall_nutrition_adherence DECIMAL,
  overall_workout_adherence DECIMAL,
  combined_adherence DECIMAL,
  weeks_tracked INTEGER,
  adherence_rating TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end_week INTEGER;
  v_nutrition_avg DECIMAL;
  v_workout_avg DECIMAL;
  v_combined DECIMAL;
BEGIN
  -- If end_week is NULL, use the maximum week number
  IF p_end_week IS NULL THEN
    SELECT COALESCE(MAX(week_number), 1)
    INTO v_end_week
    FROM progress_tracking
    WHERE plan_id = p_plan_id;
  ELSE
    v_end_week := p_end_week;
  END IF;

  -- Calculate adherence scores
  SELECT 
    COALESCE(ROUND(AVG(nutrition_adherence), 2), 0),
    COALESCE(ROUND(AVG(workout_adherence), 2), 0),
    COALESCE(ROUND((AVG(nutrition_adherence) + AVG(workout_adherence)) / 2, 2), 0),
    COUNT(*)::INTEGER
  INTO v_nutrition_avg, v_workout_avg, v_combined, p_start_week
  FROM progress_tracking
  WHERE plan_id = p_plan_id
    AND week_number BETWEEN p_start_week AND v_end_week;

  RETURN QUERY
  SELECT 
    v_nutrition_avg AS overall_nutrition_adherence,
    v_workout_avg AS overall_workout_adherence,
    v_combined AS combined_adherence,
    p_start_week AS weeks_tracked,
    CASE 
      WHEN v_combined >= 90 THEN 'excellent'
      WHEN v_combined >= 80 THEN 'very_good'
      WHEN v_combined >= 70 THEN 'good'
      WHEN v_combined >= 60 THEN 'fair'
      ELSE 'needs_improvement'
    END AS adherence_rating;
END;
$$;

COMMENT ON FUNCTION calculate_adherence_scores IS 'Calculates average adherence scores for nutrition and workouts with rating classification';

-- ============================================================================
-- Function 4: Get Active Plans for User
-- Returns all active plans for a user with summary data
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_plans_for_user(p_user_id UUID)
RETURNS TABLE (
  plan_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  duration_weeks INTEGER,
  subscription_tier TEXT,
  status TEXT,
  completion_percentage DECIMAL,
  weeks_completed INTEGER,
  target_calories INTEGER,
  goal_type TEXT,
  avg_adherence DECIMAL,
  last_weight DECIMAL,
  weight_change DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id AS plan_id,
    tp.created_at,
    tp.duration_weeks,
    tp.subscription_tier,
    tp.status,
    tp.completion_percentage,
    COALESCE(COUNT(DISTINCT pt.week_number)::INTEGER, 0) AS weeks_completed,
    COALESCE((tp.metabolic_analysis->>'target_calories_week1')::INTEGER, 0) AS target_calories,
    COALESCE(tp.metabolic_analysis->>'strategy', 'unknown') AS goal_type,
    COALESCE(ROUND((AVG(pt.nutrition_adherence) + AVG(pt.workout_adherence)) / 2, 2), 0) AS avg_adherence,
    (SELECT weight FROM progress_tracking 
     WHERE plan_id = tp.id 
     ORDER BY week_number DESC LIMIT 1) AS last_weight,
    COALESCE(
      (SELECT weight FROM progress_tracking 
       WHERE plan_id = tp.id 
       ORDER BY week_number DESC LIMIT 1) - 
      (SELECT weight FROM progress_tracking 
       WHERE plan_id = tp.id 
       ORDER BY week_number ASC LIMIT 1),
      0
    ) AS weight_change
  FROM transformation_plans tp
  LEFT JOIN progress_tracking pt ON tp.id = pt.plan_id
  WHERE tp.user_id = p_user_id
    AND tp.status = 'active'
  GROUP BY tp.id, tp.created_at, tp.duration_weeks, tp.subscription_tier, 
           tp.status, tp.completion_percentage, tp.metabolic_analysis
  ORDER BY tp.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_active_plans_for_user IS 'Returns all active transformation plans for a user with summary statistics';

-- ============================================================================
-- Function 5: Week-over-Week Comparison
-- Compares current week metrics with previous weeks
-- ============================================================================
CREATE OR REPLACE FUNCTION compare_week_over_week(
  p_plan_id UUID,
  p_current_week INTEGER
)
RETURNS TABLE (
  current_week INTEGER,
  current_weight DECIMAL,
  current_body_fat DECIMAL,
  current_nutrition_adherence DECIMAL,
  current_workout_adherence DECIMAL,
  previous_week INTEGER,
  previous_weight DECIMAL,
  previous_body_fat DECIMAL,
  previous_nutrition_adherence DECIMAL,
  previous_workout_adherence DECIMAL,
  weight_change DECIMAL,
  body_fat_change DECIMAL,
  nutrition_adherence_change DECIMAL,
  workout_adherence_change DECIMAL,
  performance_summary TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_record RECORD;
  v_previous_record RECORD;
  v_weight_change DECIMAL;
  v_bf_change DECIMAL;
  v_nutrition_change DECIMAL;
  v_workout_change DECIMAL;
BEGIN
  -- Get current week data
  SELECT 
    week_number, weight, body_fat_percentage, 
    nutrition_adherence, workout_adherence
  INTO v_current_record
  FROM progress_tracking
  WHERE plan_id = p_plan_id AND week_number = p_current_week;

  -- Get previous week data
  SELECT 
    week_number, weight, body_fat_percentage, 
    nutrition_adherence, workout_adherence
  INTO v_previous_record
  FROM progress_tracking
  WHERE plan_id = p_plan_id AND week_number = p_current_week - 1;

  -- Calculate changes
  v_weight_change := COALESCE(v_current_record.weight - v_previous_record.weight, 0);
  v_bf_change := COALESCE(v_current_record.body_fat_percentage - v_previous_record.body_fat_percentage, 0);
  v_nutrition_change := COALESCE(v_current_record.nutrition_adherence - v_previous_record.nutrition_adherence, 0);
  v_workout_change := COALESCE(v_current_record.workout_adherence - v_previous_record.workout_adherence, 0);

  RETURN QUERY
  SELECT 
    v_current_record.week_number AS current_week,
    v_current_record.weight AS current_weight,
    v_current_record.body_fat_percentage AS current_body_fat,
    v_current_record.nutrition_adherence AS current_nutrition_adherence,
    v_current_record.workout_adherence AS current_workout_adherence,
    v_previous_record.week_number AS previous_week,
    v_previous_record.weight AS previous_weight,
    v_previous_record.body_fat_percentage AS previous_body_fat,
    v_previous_record.nutrition_adherence AS previous_nutrition_adherence,
    v_previous_record.workout_adherence AS previous_workout_adherence,
    v_weight_change AS weight_change,
    v_bf_change AS body_fat_change,
    v_nutrition_change AS nutrition_adherence_change,
    v_workout_change AS workout_adherence_change,
    CASE 
      WHEN v_weight_change < 0 AND v_bf_change < 0 THEN 'excellent_progress'
      WHEN v_weight_change < 0 AND v_bf_change <= 0 THEN 'good_progress'
      WHEN v_weight_change > 0 AND v_bf_change < 0 THEN 'muscle_gain'
      WHEN v_weight_change = 0 THEN 'plateau'
      ELSE 'needs_adjustment'
    END AS performance_summary;
END;
$$;

COMMENT ON FUNCTION compare_week_over_week IS 'Compares current week metrics with previous week including weight, body fat, and adherence changes';

-- ============================================================================
-- Function 6: Get Weekly Progress Summary (Bonus)
-- Returns a comprehensive weekly summary for dashboard display
-- ============================================================================
CREATE OR REPLACE FUNCTION get_weekly_progress_summary(p_plan_id UUID)
RETURNS TABLE (
  week_number INTEGER,
  weight DECIMAL,
  body_fat_percentage DECIMAL,
  nutrition_adherence DECIMAL,
  workout_adherence DECIMAL,
  calorie_adjustment INTEGER,
  week_status TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.week_number,
    pt.weight,
    pt.body_fat_percentage,
    pt.nutrition_adherence,
    pt.workout_adherence,
    pt.calorie_adjustment,
    CASE 
      WHEN (pt.nutrition_adherence + pt.workout_adherence) / 2 >= 85 THEN 'on_track'
      WHEN (pt.nutrition_adherence + pt.workout_adherence) / 2 >= 70 THEN 'good'
      ELSE 'needs_attention'
    END AS week_status,
    pt.recorded_at
  FROM progress_tracking pt
  WHERE pt.plan_id = p_plan_id
  ORDER BY pt.week_number ASC;
END;
$$;

COMMENT ON FUNCTION get_weekly_progress_summary IS 'Returns a comprehensive weekly progress summary for dashboard display';

-- ============================================================================
-- Grant execute permissions to authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_plan_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_progress_trends TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_adherence_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_plans_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION compare_week_over_week TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_progress_summary TO authenticated;

-- ============================================================================
-- Create helper view for quick plan overview (optional but useful)
-- ============================================================================
CREATE OR REPLACE VIEW plan_overview AS
SELECT 
  tp.id AS plan_id,
  tp.user_id,
  tp.created_at,
  tp.duration_weeks,
  tp.subscription_tier,
  tp.status,
  tp.completion_percentage,
  (tp.metabolic_analysis->>'bmr')::DECIMAL AS bmr,
  (tp.metabolic_analysis->>'maintenance_calories')::DECIMAL AS maintenance_calories,
  (tp.metabolic_analysis->>'target_calories_week1')::DECIMAL AS target_calories,
  tp.metabolic_analysis->>'strategy' AS goal_strategy,
  (tp.macro_strategy->>'protein_grams')::DECIMAL AS protein_target,
  (tp.macro_strategy->>'carbs_grams')::DECIMAL AS carbs_target,
  (tp.macro_strategy->>'fats_grams')::DECIMAL AS fats_target,
  COUNT(DISTINCT pt.week_number) AS weeks_with_data,
  ROUND(AVG(pt.nutrition_adherence), 2) AS avg_nutrition_adherence,
  ROUND(AVG(pt.workout_adherence), 2) AS avg_workout_adherence
FROM transformation_plans tp
LEFT JOIN progress_tracking pt ON tp.id = pt.plan_id
GROUP BY tp.id, tp.user_id, tp.created_at, tp.duration_weeks, tp.subscription_tier,
         tp.status, tp.completion_percentage, tp.metabolic_analysis, tp.macro_strategy;

COMMENT ON VIEW plan_overview IS 'Provides a quick overview of transformation plans with key metrics and progress data';

-- Grant select on view to authenticated users
GRANT SELECT ON plan_overview TO authenticated;

