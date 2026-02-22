-- Create progress_tracking table for AI Nutrition Engine
-- This table stores weekly progress updates including measurements, adherence scores,
-- and automatic adjustments made to transformation plans

-- Create progress_tracking table
CREATE TABLE IF NOT EXISTS progress_tracking (
  -- Primary key and relationships
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES transformation_plans(id) ON DELETE CASCADE,
  
  -- Week tracking
  week_number INTEGER NOT NULL CHECK (week_number > 0 AND week_number <= 52),
  
  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Measurements
  weight DECIMAL(5,2) CHECK (weight > 0 AND weight <= 500),
  body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 3 AND body_fat_percentage <= 50),
  
  -- Additional measurements (JSONB for flexible structure)
  -- Expected structure: { chest, waist, hips, arms, thighs, etc. in cm }
  measurements JSONB,
  
  -- Adherence tracking (0-100 scale)
  nutrition_adherence DECIMAL(5,2) CHECK (nutrition_adherence >= 0 AND nutrition_adherence <= 100),
  workout_adherence DECIMAL(5,2) CHECK (workout_adherence >= 0 AND workout_adherence <= 100),
  
  -- Adjustments made this week
  calorie_adjustment INTEGER DEFAULT 0,
  
  -- Macro adjustments (JSONB for flexible structure)
  -- Expected structure: { protein_adjustment, carbs_adjustment, fats_adjustment }
  macro_adjustment JSONB,
  
  -- Unique constraint: one entry per plan per week
  CONSTRAINT unique_plan_week UNIQUE (plan_id, week_number)
);

-- Create indexes for performance optimization
CREATE INDEX idx_progress_tracking_plan_id ON progress_tracking(plan_id);
CREATE INDEX idx_progress_tracking_week_number ON progress_tracking(week_number);
CREATE INDEX idx_progress_tracking_recorded_at ON progress_tracking(recorded_at DESC);

-- Create composite index for common queries
CREATE INDEX idx_progress_tracking_plan_week ON progress_tracking(plan_id, week_number);

-- Create GIN index for JSONB fields to enable efficient querying
CREATE INDEX idx_progress_tracking_measurements ON progress_tracking USING GIN (measurements);
CREATE INDEX idx_progress_tracking_macro_adjustment ON progress_tracking USING GIN (macro_adjustment);

-- Add Row Level Security (RLS) policies
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view progress for their own transformation plans
CREATE POLICY "Users can view their own progress tracking"
  ON progress_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transformation_plans
      WHERE transformation_plans.id = progress_tracking.plan_id
      AND transformation_plans.user_id = auth.uid()
    )
  );

-- Policy: Users can insert progress for their own transformation plans
CREATE POLICY "Users can insert their own progress tracking"
  ON progress_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transformation_plans
      WHERE transformation_plans.id = progress_tracking.plan_id
      AND transformation_plans.user_id = auth.uid()
    )
  );

-- Policy: Users can update progress for their own transformation plans
CREATE POLICY "Users can update their own progress tracking"
  ON progress_tracking
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transformation_plans
      WHERE transformation_plans.id = progress_tracking.plan_id
      AND transformation_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transformation_plans
      WHERE transformation_plans.id = progress_tracking.plan_id
      AND transformation_plans.user_id = auth.uid()
    )
  );

-- Policy: Users can delete progress for their own transformation plans
CREATE POLICY "Users can delete their own progress tracking"
  ON progress_tracking
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transformation_plans
      WHERE transformation_plans.id = progress_tracking.plan_id
      AND transformation_plans.user_id = auth.uid()
    )
  );

-- Add comments to document the table and columns
COMMENT ON TABLE progress_tracking IS 'Stores weekly progress updates including measurements, adherence scores, and automatic adjustments for transformation plans';

COMMENT ON COLUMN progress_tracking.id IS 'Unique identifier for the progress entry';
COMMENT ON COLUMN progress_tracking.plan_id IS 'Reference to the transformation plan this progress belongs to';
COMMENT ON COLUMN progress_tracking.week_number IS 'Week number in the transformation plan (1-52)';
COMMENT ON COLUMN progress_tracking.recorded_at IS 'Timestamp when this progress was recorded';
COMMENT ON COLUMN progress_tracking.weight IS 'Body weight in kilograms';
COMMENT ON COLUMN progress_tracking.body_fat_percentage IS 'Body fat percentage (3-50%)';
COMMENT ON COLUMN progress_tracking.measurements IS 'JSONB containing body measurements (chest, waist, hips, arms, thighs, etc.)';
COMMENT ON COLUMN progress_tracking.nutrition_adherence IS 'Nutrition adherence score (0-100)';
COMMENT ON COLUMN progress_tracking.workout_adherence IS 'Workout adherence score (0-100)';
COMMENT ON COLUMN progress_tracking.calorie_adjustment IS 'Calorie adjustment made this week (positive or negative)';
COMMENT ON COLUMN progress_tracking.macro_adjustment IS 'JSONB containing macro adjustments (protein, carbs, fats)';
