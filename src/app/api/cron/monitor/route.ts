/**
 * Database Monitoring Cron Job
 * 
 * Scheduled endpoint that runs periodic health checks and sends alerts
 * when issues are detected. Should be called by a cron service like Vercel Cron.
 */

import { NextResponse } from 'next/server';
import { databaseMonitor } from '@/lib/monitoring/databaseMonitor';
import { connectionPoolMonitor } from '@/lib/monitoring/connectionPool';
import { alertingService } from '@/lib/monitoring/alerting';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results: Record<string, unknown> = {};

  try {
    // Run database health check
    const health = await databaseMonitor.checkHealth();
    results.health = {
      status: health.healthy ? 'healthy' : 'unhealthy',
      issueCount: health.issues.length,
      issues: health.issues,
    };

    // Check connection pool
    const poolStatus = await connectionPoolMonitor.checkPoolStatus();
    results.connectionPool = {
      status: poolStatus.status,
      usage: `${poolStatus.count}/${poolStatus.maxConnections}`,
      percentage: `${poolStatus.percentage.toFixed(1)}%`,
    };

    // Send alerts if issues detected
    if (!health.healthy) {
      for (const issue of health.issues) {
        await alertingService.sendAlert({
          severity: 'warning',
          metric: 'Database Health',
          value: 'Issues detected',
          threshold: 'No issues',
          message: issue,
        });
      }
    }

    // Alert on connection pool issues
    if (poolStatus.status === 'critical' || poolStatus.status === 'warning') {
      await alertingService.sendConnectionPoolAlert(
        poolStatus.count,
        poolStatus.maxConnections,
        poolStatus.percentage
      );
    }

    // Check for slow queries
    if (health.metrics?.slowQueries && health.metrics.slowQueries.length > 5) {
      await alertingService.sendSlowQueryAlert(
        health.metrics.slowQueries.length,
        500
      );
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'completed',
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Monitoring cron failed:', error);
    
    // Send critical alert about monitoring failure
    await alertingService.sendAlert({
      severity: 'critical',
      metric: 'Monitoring System',
      value: 'Failed',
      threshold: 'Success',
      message: `Monitoring cron job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    return NextResponse.json(
      {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
