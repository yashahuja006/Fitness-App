/**
 * Database Monitoring Service
 * 
 * Provides comprehensive monitoring capabilities for the Supabase database
 * including connection stats, query performance, and health checks.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  databaseSize: string;
  slowQueries: SlowQuery[];
  timestamp: Date;
}

export interface SlowQuery {
  query: string;
  meanTime: number;
  calls: number;
  totalTime?: number;
}

export interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  idleInTransaction: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  issues: string[];
  metrics?: DatabaseMetrics;
}

export class DatabaseMonitor {
  private supabase: SupabaseClient;
  private readonly CONNECTION_WARNING_THRESHOLD = 80;
  private readonly SLOW_QUERY_THRESHOLD = 5;
  private readonly QUERY_TIME_WARNING = 500; // ms

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get comprehensive database metrics
   */
  async getMetrics(): Promise<DatabaseMetrics> {
    try {
      const [connections, slowQueries, tableSize] = await Promise.all([
        this.getConnectionStats(),
        this.getSlowQueries(),
        this.getDatabaseSize(),
      ]);

      return {
        connectionCount: connections.total,
        activeQueries: connections.active,
        databaseSize: tableSize,
        slowQueries,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  private async getConnectionStats(): Promise<ConnectionStats> {
    try {
      // Query pg_stat_activity for connection information
      const { data, error } = await this.supabase.rpc('get_connection_stats');

      if (error) {
        console.error('Failed to get connection stats:', error);
        // Return default values if query fails
        return { total: 0, active: 0, idle: 0, idleInTransaction: 0 };
      }

      return data as ConnectionStats;
    } catch (error) {
      console.error('Error in getConnectionStats:', error);
      return { total: 0, active: 0, idle: 0, idleInTransaction: 0 };
    }
  }

  /**
   * Get slow queries from pg_stat_statements
   */
  private async getSlowQueries(): Promise<SlowQuery[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_slow_queries', {
        threshold_ms: this.QUERY_TIME_WARNING,
      });

      if (error) {
        console.error('Failed to get slow queries:', error);
        return [];
      }

      return (data as SlowQuery[]) || [];
    } catch (error) {
      console.error('Error in getSlowQueries:', error);
      return [];
    }
  }

  /**
   * Get database size for transformation_plans table
   */
  private async getDatabaseSize(): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_size', {
        table_name: 'transformation_plans',
      });

      if (error) {
        console.error('Failed to get database size:', error);
        return 'Unknown';
      }

      return (data as string) || 'Unknown';
    } catch (error) {
      console.error('Error in getDatabaseSize:', error);
      return 'Unknown';
    }
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const issues: string[] = [];

    try {
      const metrics = await this.getMetrics();

      // Check connection pool
      if (metrics.connectionCount > this.CONNECTION_WARNING_THRESHOLD) {
        issues.push(
          `High connection count detected: ${metrics.connectionCount} (threshold: ${this.CONNECTION_WARNING_THRESHOLD})`
        );
      }

      // Check for slow queries
      if (metrics.slowQueries.length > this.SLOW_QUERY_THRESHOLD) {
        issues.push(
          `${metrics.slowQueries.length} slow queries detected (threshold: ${this.SLOW_QUERY_THRESHOLD})`
        );
      }

      // Check active queries
      if (metrics.activeQueries > 50) {
        issues.push(
          `High number of active queries: ${metrics.activeQueries}`
        );
      }

      return {
        healthy: issues.length === 0,
        issues,
        metrics,
      };
    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        healthy: false,
        issues,
      };
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('transformation_plans')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get query performance statistics
   */
  async getQueryPerformance(): Promise<{
    avgQueryTime: number;
    maxQueryTime: number;
    totalQueries: number;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_query_performance');

      if (error) {
        console.error('Failed to get query performance:', error);
        return { avgQueryTime: 0, maxQueryTime: 0, totalQueries: 0 };
      }

      return data as { avgQueryTime: number; maxQueryTime: number; totalQueries: number };
    } catch (error) {
      console.error('Error in getQueryPerformance:', error);
      return { avgQueryTime: 0, maxQueryTime: 0, totalQueries: 0 };
    }
  }

  /**
   * Get RLS policy performance metrics
   */
  async getRLSPerformance(): Promise<Array<{
    tableName: string;
    policyName: string;
    avgExecutionTime: number;
  }>> {
    try {
      const { data, error } = await this.supabase.rpc('check_rls_performance');

      if (error) {
        console.error('Failed to get RLS performance:', error);
        return [];
      }

      return data as Array<{
        tableName: string;
        policyName: string;
        avgExecutionTime: number;
      }>;
    } catch (error) {
      console.error('Error in getRLSPerformance:', error);
      return [];
    }
  }
}

// Export singleton instance
export const databaseMonitor = new DatabaseMonitor();
