/**
 * Connection Pool Monitor
 * 
 * Monitors Supabase connection pool usage and provides warnings
 * when approaching capacity limits.
 */

import { createClient } from '@supabase/supabase-js';

export interface ConnectionPoolStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  count: number;
  percentage: number;
  maxConnections: number;
  timestamp: Date;
}

export class ConnectionPoolMonitor {
  private supabase;
  private readonly maxConnections = 100; // Default Supabase limit
  private readonly warningThreshold = 80; // 80% capacity
  private readonly criticalThreshold = 95; // 95% capacity

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check current connection pool status
   */
  async checkPoolStatus(): Promise<ConnectionPoolStatus> {
    try {
      const { data, error } = await this.supabase.rpc('get_connection_count');

      if (error) {
        console.error('Failed to check connection pool:', error);
        return {
          status: 'unknown',
          count: 0,
          percentage: 0,
          maxConnections: this.maxConnections,
          timestamp: new Date(),
        };
      }

      const count = (data as number) || 0;
      const percentage = (count / this.maxConnections) * 100;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (percentage >= this.criticalThreshold) {
        status = 'critical';
        console.error(
          `CRITICAL: Connection pool at ${percentage.toFixed(1)}% capacity (${count}/${this.maxConnections})`
        );
      } else if (percentage >= this.warningThreshold) {
        status = 'warning';
        console.warn(
          `WARNING: Connection pool at ${percentage.toFixed(1)}% capacity (${count}/${this.maxConnections})`
        );
      }

      return {
        status,
        count,
        percentage,
        maxConnections: this.maxConnections,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error checking connection pool:', error);
      return {
        status: 'unknown',
        count: 0,
        percentage: 0,
        maxConnections: this.maxConnections,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get detailed connection breakdown by state
   */
  async getConnectionBreakdown(): Promise<{
    active: number;
    idle: number;
    idleInTransaction: number;
    waiting: number;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_connection_breakdown');

      if (error) {
        console.error('Failed to get connection breakdown:', error);
        return { active: 0, idle: 0, idleInTransaction: 0, waiting: 0 };
      }

      return data as {
        active: number;
        idle: number;
        idleInTransaction: number;
        waiting: number;
      };
    } catch (error) {
      console.error('Error getting connection breakdown:', error);
      return { active: 0, idle: 0, idleInTransaction: 0, waiting: 0 };
    }
  }

  /**
   * Identify long-running connections
   */
  async getLongRunningConnections(thresholdMinutes: number = 5): Promise<
    Array<{
      pid: number;
      duration: string;
      query: string;
      state: string;
    }>
  > {
    try {
      const { data, error } = await this.supabase.rpc('get_long_running_connections', {
        threshold_minutes: thresholdMinutes,
      });

      if (error) {
        console.error('Failed to get long-running connections:', error);
        return [];
      }

      return data as Array<{
        pid: number;
        duration: string;
        query: string;
        state: string;
      }>;
    } catch (error) {
      console.error('Error getting long-running connections:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on current pool status
   */
  async getRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const status = await this.checkPoolStatus();
    const breakdown = await this.getConnectionBreakdown();

    if (status.percentage >= this.criticalThreshold) {
      recommendations.push('URGENT: Connection pool is critically full. Consider scaling up or optimizing queries.');
    } else if (status.percentage >= this.warningThreshold) {
      recommendations.push('Connection pool usage is high. Monitor closely and consider optimization.');
    }

    if (breakdown.idleInTransaction > 10) {
      recommendations.push(
        `${breakdown.idleInTransaction} connections are idle in transaction. Review transaction handling.`
      );
    }

    if (breakdown.waiting > 5) {
      recommendations.push(
        `${breakdown.waiting} connections are waiting. This may indicate connection pool exhaustion.`
      );
    }

    const longRunning = await this.getLongRunningConnections();
    if (longRunning.length > 0) {
      recommendations.push(
        `${longRunning.length} long-running queries detected. Review and optimize these queries.`
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const connectionPoolMonitor = new ConnectionPoolMonitor();
