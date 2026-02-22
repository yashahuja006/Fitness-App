/**
 * Supabase Trial Period Service
 * Database operations for trial period management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  TrialPeriodData,
  TrialStatusResult,
  TrialConversionData,
  TrialPeriodManager,
} from '../trialPeriodManagement';

export interface TrialPeriodRow {
  id: string;
  user_id: string;
  trial_start_date: string;
  trial_end_date: string;
  trial_duration_days: number;
  is_active: boolean;
  has_expired: boolean;
  has_converted: boolean;
  converted_at?: string;
  converted_to_tier?: 'free' | 'pro';
  conversion_reason?: 'manual' | 'auto' | 'upgrade_prompt';
  cancellation_date?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Trial Period Database Service
 */
export class TrialPeriodService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new trial period for a user
   */
  async createTrial(
    userId: string,
    trialDurationDays: number = 14
  ): Promise<{ data: TrialPeriodData | null; error: Error | null }> {
    try {
      // Check if user already has an active trial
      const { data: existingTrial } = await this.getActiveTrial(userId);
      if (existingTrial) {
        return {
          data: null,
          error: new Error('User already has an active trial'),
        };
      }

      // Initialize trial data
      const trialData = TrialPeriodManager.initializeTrial(
        userId,
        trialDurationDays
      );

      // Insert into database
      const { data, error } = await this.supabase
        .from('trial_periods')
        .insert({
          user_id: userId,
          trial_start_date: trialData.trialStartDate.toISOString(),
          trial_end_date: trialData.trialEndDate.toISOString(),
          trial_duration_days: trialData.trialDurationDays,
          is_active: true,
          has_expired: false,
          has_converted: false,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return {
        data: this.mapRowToTrialData(data),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Get active trial for a user
   */
  async getActiveTrial(
    userId: string
  ): Promise<{ data: TrialPeriodData | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('trial_periods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('has_expired', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      if (!data) {
        return { data: null, error: null };
      }

      return {
        data: this.mapRowToTrialData(data),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Get trial status for a user
   */
  async getTrialStatus(
    userId: string
  ): Promise<{ data: TrialStatusResult | null; error: Error | null }> {
    try {
      const { data: trialData, error } = await this.getActiveTrial(userId);

      if (error) {
        return { data: null, error };
      }

      if (!trialData) {
        return {
          data: {
            isInTrial: false,
            isExpired: false,
            daysRemaining: 0,
            daysElapsed: 0,
            canAccess: false,
            message: 'No active trial found',
            shouldPromptUpgrade: false,
          },
          error: null,
        };
      }

      const status = TrialPeriodManager.checkTrialStatus(trialData);
      return { data: status, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(
    userId: string,
    targetTier: 'free' | 'pro' = 'pro',
    conversionReason?: 'manual' | 'auto' | 'upgrade_prompt'
  ): Promise<{
    data: { trialData: TrialPeriodData; conversionData: TrialConversionData } | null;
    error: Error | null;
  }> {
    try {
      // Get active trial
      const { data: trialData, error: fetchError } = await this.getActiveTrial(
        userId
      );

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      if (!trialData) {
        return { data: null, error: new Error('No active trial found') };
      }

      // Convert trial
      const { updatedTrialData, conversionData } =
        TrialPeriodManager.convertTrialToPaid(
          trialData,
          targetTier,
          conversionReason
        );

      // Update database
      const { error: updateError } = await this.supabase
        .from('trial_periods')
        .update({
          is_active: false,
          has_converted: true,
          converted_at: updatedTrialData.convertedAt?.toISOString(),
          converted_to_tier: updatedTrialData.convertedToTier,
          conversion_reason: conversionReason,
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (updateError) {
        return { data: null, error: new Error(updateError.message) };
      }

      return {
        data: { trialData: updatedTrialData, conversionData },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Expire trial
   */
  async expireTrial(
    userId: string
  ): Promise<{ data: TrialPeriodData | null; error: Error | null }> {
    try {
      const { data: trialData, error: fetchError } = await this.getActiveTrial(
        userId
      );

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      if (!trialData) {
        return { data: null, error: new Error('No active trial found') };
      }

      const expiredTrial = TrialPeriodManager.expireTrial(trialData);

      const { error: updateError } = await this.supabase
        .from('trial_periods')
        .update({
          is_active: false,
          has_expired: true,
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (updateError) {
        return { data: null, error: new Error(updateError.message) };
      }

      return { data: expiredTrial, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Cancel trial
   */
  async cancelTrial(
    userId: string,
    reason?: string
  ): Promise<{ data: TrialPeriodData | null; error: Error | null }> {
    try {
      const { data: trialData, error: fetchError } = await this.getActiveTrial(
        userId
      );

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      if (!trialData) {
        return { data: null, error: new Error('No active trial found') };
      }

      const cancelledTrial = TrialPeriodManager.cancelTrial(trialData, reason);

      const { error: updateError } = await this.supabase
        .from('trial_periods')
        .update({
          is_active: false,
          cancellation_date: cancelledTrial.cancellationDate?.toISOString(),
          cancellation_reason: reason,
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (updateError) {
        return { data: null, error: new Error(updateError.message) };
      }

      return { data: cancelledTrial, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Extend trial period
   */
  async extendTrial(
    userId: string,
    additionalDays: number
  ): Promise<{ data: TrialPeriodData | null; error: Error | null }> {
    try {
      const { data: trialData, error: fetchError } = await this.getActiveTrial(
        userId
      );

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      if (!trialData) {
        return { data: null, error: new Error('No active trial found') };
      }

      const extendedTrial = TrialPeriodManager.extendTrial(
        trialData,
        additionalDays
      );

      const { error: updateError } = await this.supabase
        .from('trial_periods')
        .update({
          trial_end_date: extendedTrial.trialEndDate.toISOString(),
          trial_duration_days: extendedTrial.trialDurationDays,
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (updateError) {
        return { data: null, error: new Error(updateError.message) };
      }

      return { data: extendedTrial, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Check if user has had trial before
   */
  async hasHadTrialBefore(
    userId: string
  ): Promise<{ data: boolean; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.rpc('has_had_trial_before', {
        p_user_id: userId,
      });

      if (error) {
        return { data: false, error: new Error(error.message) };
      }

      return { data: data || false, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Get expiring trials (for notifications)
   */
  async getExpiringTrials(
    daysThreshold: number = 3
  ): Promise<{
    data: Array<{ userId: string; trialEndDate: Date; daysRemaining: number }> | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_expiring_trials', {
        p_days_threshold: daysThreshold,
      });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const mappedData = (data || []).map((row: any) => ({
        userId: row.user_id,
        trialEndDate: new Date(row.trial_end_date),
        daysRemaining: row.days_remaining,
      }));

      return { data: mappedData, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Expire old trials (batch operation)
   */
  async expireOldTrials(): Promise<{
    data: { expiredCount: number } | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('expire_old_trials');

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: { expiredCount: data || 0 }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Get trial history for a user
   */
  async getTrialHistory(
    userId: string
  ): Promise<{ data: TrialPeriodData[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('trial_periods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const mappedData = (data || []).map((row) => this.mapRowToTrialData(row));

      return { data: mappedData, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Map database row to TrialPeriodData
   */
  private mapRowToTrialData(row: TrialPeriodRow): TrialPeriodData {
    return {
      userId: row.user_id,
      trialStartDate: new Date(row.trial_start_date),
      trialEndDate: new Date(row.trial_end_date),
      trialDurationDays: row.trial_duration_days,
      isActive: row.is_active,
      hasExpired: row.has_expired,
      hasConverted: row.has_converted,
      convertedAt: row.converted_at ? new Date(row.converted_at) : undefined,
      convertedToTier: row.converted_to_tier,
      cancellationDate: row.cancellation_date
        ? new Date(row.cancellation_date)
        : undefined,
      cancellationReason: row.cancellation_reason,
    };
  }
}

/**
 * Create trial period service instance
 */
export function createTrialPeriodService(
  supabase: SupabaseClient
): TrialPeriodService {
  return new TrialPeriodService(supabase);
}
