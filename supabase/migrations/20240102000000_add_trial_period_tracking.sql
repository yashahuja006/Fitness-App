-- Migration: Add Trial Period Tracking
-- Description: Adds trial period management to the subscription system
-- Created: 2024-01-02

-- Add trial-related columns to user profiles or create a dedicated trial tracking table
-- Option 1: Add to existing user subscription data (if you have a users or subscriptions table)
-- Option 2: Create a dedicated trial_periods table (recommended for better separation)

-- Create trial_periods table for comprehensive trial tracking
CREATE TABLE IF NOT EXISTS trial_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trial period dates
  trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_duration_days INTEGER NOT NULL CHECK (trial_duration_days > 0 AND trial_duration_days <= 90),
  
  -- Trial status
  is_active BOOLEAN NOT NULL DEFAULT true,
  has_expired BOOLEAN NOT NULL DEFAULT false,
  has_converted BOOLEAN NOT NULL DEFAULT false,
  
  -- Conversion tracking
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_to_tier TEXT CHECK (converted_to_tier IN ('free', 'pro')),
  conversion_reason TEXT CHECK (conversion_reason IN ('manual', 'auto', 'upgrade_prompt')),
  
  -- Cancellation tracking
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_trial_dates CHECK (trial_end_date > trial_start_date),
  CONSTRAINT valid_conversion CHECK (
    (has_converted = false) OR 
    (has_converted = true AND converted_at IS NOT NULL AND converted_to_tier IS NOT NULL)
  ),
  
  -- Ensure one active trial per user
  CONSTRAINT one_active_trial_per_user UNIQUE (user_id, is_active) 
    WHERE is_active = true
);

-- Create indexes for efficient queries
CREATE INDEX idx_trial_periods_user_id ON trial_periods(user_id);
CREATE INDEX idx_trial_periods_active ON trial_periods(is_active) WHERE is_active = true;
CREATE INDEX idx_trial_periods_expiring_soon ON trial_periods(trial_end_date) 
  WHERE is_active = true AND has_expired = false;
CREATE INDEX idx_trial_periods_converted ON trial_periods(has_converted, converted_at);
CREATE INDEX idx_trial_periods_created_at ON trial_periods(created_at DESC);

-- Create composite index for common queries
CREATE INDEX idx_trial_periods_user_status ON trial_periods(user_id, is_active, has_expired);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trial_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trial_periods_updated_at
  BEFORE UPDATE ON trial_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_periods_updated_at();

-- Add trigger to automatically expire trials
CREATE OR REPLACE FUNCTION auto_expire_trials()
RETURNS TRIGGER AS $$
BEGIN
  -- If trial end date has passed and trial is still active, mark as expired
  IF NEW.trial_end_date <= NOW() AND NEW.is_active = true AND NEW.has_expired = false THEN
    NEW.has_expired = true;
    NEW.is_active = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_trials
  BEFORE UPDATE ON trial_periods
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_trials();

-- Row Level Security (RLS) policies
ALTER TABLE trial_periods ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial periods
CREATE POLICY trial_periods_select_own
  ON trial_periods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own trial periods (typically done by system)
CREATE POLICY trial_periods_insert_own
  ON trial_periods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own trial periods (typically done by system)
CREATE POLICY trial_periods_update_own
  ON trial_periods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policy (if you have an admin role)
-- CREATE POLICY trial_periods_admin_all
--   ON trial_periods
--   FOR ALL
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Add comments for documentation
COMMENT ON TABLE trial_periods IS 'Tracks trial period information for users';
COMMENT ON COLUMN trial_periods.user_id IS 'Reference to the user in the trial';
COMMENT ON COLUMN trial_periods.trial_start_date IS 'When the trial period started';
COMMENT ON COLUMN trial_periods.trial_end_date IS 'When the trial period ends';
COMMENT ON COLUMN trial_periods.trial_duration_days IS 'Duration of trial in days (1-90)';
COMMENT ON COLUMN trial_periods.is_active IS 'Whether the trial is currently active';
COMMENT ON COLUMN trial_periods.has_expired IS 'Whether the trial has expired';
COMMENT ON COLUMN trial_periods.has_converted IS 'Whether the trial was converted to paid';
COMMENT ON COLUMN trial_periods.converted_at IS 'When the trial was converted';
COMMENT ON COLUMN trial_periods.converted_to_tier IS 'Which tier the trial converted to';
COMMENT ON COLUMN trial_periods.conversion_reason IS 'Reason for conversion (manual, auto, upgrade_prompt)';
COMMENT ON COLUMN trial_periods.cancellation_date IS 'When the trial was cancelled';
COMMENT ON COLUMN trial_periods.cancellation_reason IS 'Reason for trial cancellation';

-- Create helper function to get active trial for user
CREATE OR REPLACE FUNCTION get_active_trial(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  trial_duration_days INTEGER,
  days_remaining INTEGER,
  is_active BOOLEAN,
  has_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id,
    tp.trial_start_date,
    tp.trial_end_date,
    tp.trial_duration_days,
    GREATEST(0, EXTRACT(DAY FROM (tp.trial_end_date - NOW()))::INTEGER) as days_remaining,
    tp.is_active,
    tp.has_expired
  FROM trial_periods tp
  WHERE tp.user_id = p_user_id
    AND tp.is_active = true
    AND tp.has_expired = false
  ORDER BY tp.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has had trial before
CREATE OR REPLACE FUNCTION has_had_trial_before(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO trial_count
  FROM trial_periods
  WHERE user_id = p_user_id;
  
  RETURN trial_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get expiring trials (for notifications)
CREATE OR REPLACE FUNCTION get_expiring_trials(p_days_threshold INTEGER DEFAULT 3)
RETURNS TABLE (
  user_id UUID,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.user_id,
    tp.trial_end_date,
    EXTRACT(DAY FROM (tp.trial_end_date - NOW()))::INTEGER as days_remaining
  FROM trial_periods tp
  WHERE tp.is_active = true
    AND tp.has_expired = false
    AND tp.trial_end_date > NOW()
    AND tp.trial_end_date <= NOW() + (p_days_threshold || ' days')::INTERVAL
  ORDER BY tp.trial_end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire old trials (can be run as a scheduled job)
CREATE OR REPLACE FUNCTION expire_old_trials()
RETURNS TABLE (
  expired_count INTEGER
) AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE trial_periods
  SET 
    is_active = false,
    has_expired = true,
    updated_at = NOW()
  WHERE is_active = true
    AND has_expired = false
    AND trial_end_date <= NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON trial_periods TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_had_trial_before(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_trials(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_trials() TO authenticated;
