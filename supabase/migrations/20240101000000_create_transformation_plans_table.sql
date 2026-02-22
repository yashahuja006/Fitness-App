-- Create transformation_plans table for AI Nutrition Engine
-- This table stores comprehensive transformation programs with metabolic analysis,
-- meal plans, workout plans, and progress projections

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transformation_plans table
CREATE TABLE IF NOT EXISTS transformation_plans (
  -- Primary key and relationships
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Plan metadata
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0 AND duration_weeks <= 52),
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro')),
  
  -- Metabolic data (JSONB for flexible structure)
  -- Expected structure: { bmr, maintenance_calories, target_calories_week1, strategy, body_composition_factor }
  metabolic_analysis JSONB NOT NULL,
  
  -- Macro strategy (JSONB for flexible structure)
  -- Expected structure: { protein_grams, carbs_grams, fats_grams, macro_cycling: { training_day, rest_day } }
  macro_strategy JSONB NOT NULL,
  
  -- Weekly progression plan (JSONB array)
  -- Expected structure: [{ week, target_calories, adjustment_reason, plateau_prevention, refeed_scheduled }]
  weekly_progression JSONB NOT NULL,
  
  -- Meal plan (JSONB for flexible structure)
  -- Expected structure: { training_day: DayMealPlan, rest_day: DayMealPlan }
  meal_plan JSONB NOT NULL,
  
  -- Workout plan (JSONB for flexible structure)
  -- Expected structure: { split_type, weekly_schedule, exercise_structure, progression_scheme, rpe_range }
  workout_plan JSONB NOT NULL,
  
  -- Progress projection (JSONB for flexible structure)
  -- Expected structure: { expected_weight_change, expected_bf_change, muscle_gain_potential, confidence_level }
  progress_projection JSONB NOT NULL,
  
  -- Grocery optimization (Pro feature - JSONB)
  -- Expected structure: { consolidated_list, cost_optimization, seasonal_substitutions, bulk_buying }
  grocery_optimization JSONB,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'paused')),
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Create indexes for performance optimization
CREATE INDEX idx_transformation_plans_user_id ON transformation_plans(user_id);
CREATE INDEX idx_transformation_plans_status ON transformation_plans(status);
CREATE INDEX idx_transformation_plans_created_at ON transformation_plans(created_at DESC);
CREATE INDEX idx_transformation_plans_subscription_tier ON transformation_plans(subscription_tier);

-- Create composite index for common queries
CREATE INDEX idx_transformation_plans_user_status ON transformation_plans(user_id, status);

-- Create GIN indexes for JSONB fields to enable efficient querying
CREATE INDEX idx_transformation_plans_metabolic_analysis ON transformation_plans USING GIN (metabolic_analysis);
CREATE INDEX idx_transformation_plans_macro_strategy ON transformation_plans USING GIN (macro_strategy);
CREATE INDEX idx_transformation_plans_weekly_progression ON transformation_plans USING GIN (weekly_progression);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transformation_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_transformation_plans_updated_at
  BEFORE UPDATE ON transformation_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_transformation_plans_updated_at();

-- Add Row Level Security (RLS) policies
ALTER TABLE transformation_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transformation plans
CREATE POLICY "Users can view their own transformation plans"
  ON transformation_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transformation plans
CREATE POLICY "Users can insert their own transformation plans"
  ON transformation_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own transformation plans
CREATE POLICY "Users can update their own transformation plans"
  ON transformation_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own transformation plans
CREATE POLICY "Users can delete their own transformation plans"
  ON transformation_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments to document the table and columns
COMMENT ON TABLE transformation_plans IS 'Stores comprehensive transformation programs including metabolic analysis, meal plans, workout plans, and progress projections for the AI Nutrition Engine';

COMMENT ON COLUMN transformation_plans.id IS 'Unique identifier for the transformation plan';
COMMENT ON COLUMN transformation_plans.user_id IS 'Reference to the user who owns this plan';
COMMENT ON COLUMN transformation_plans.duration_weeks IS 'Duration of the transformation plan in weeks (1-52)';
COMMENT ON COLUMN transformation_plans.subscription_tier IS 'User subscription tier: free or pro';
COMMENT ON COLUMN transformation_plans.metabolic_analysis IS 'JSONB containing BMR, TDEE, target calories, and metabolic strategy';
COMMENT ON COLUMN transformation_plans.macro_strategy IS 'JSONB containing protein, carbs, fats targets and macro cycling strategy';
COMMENT ON COLUMN transformation_plans.weekly_progression IS 'JSONB array containing weekly calorie targets and adjustment logic';
COMMENT ON COLUMN transformation_plans.meal_plan IS 'JSONB containing training day and rest day meal plans';
COMMENT ON COLUMN transformation_plans.workout_plan IS 'JSONB containing workout split, schedule, and progression scheme';
COMMENT ON COLUMN transformation_plans.progress_projection IS 'JSONB containing predicted outcomes and confidence levels';
COMMENT ON COLUMN transformation_plans.grocery_optimization IS 'JSONB containing grocery lists and optimization strategies (Pro feature)';
COMMENT ON COLUMN transformation_plans.status IS 'Current status of the plan: active, completed, archived, or paused';
COMMENT ON COLUMN transformation_plans.completion_percentage IS 'Progress percentage (0-100)';
