/**
 * Database Health Check API Endpoint
 * 
 * Provides a health check endpoint for monitoring database connectivity
 * and basic performance metrics.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'not_configured',
          error: 'Supabase credentials not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('transformation_plans')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    const responseTime = Date.now() - startTime;

    // Determine health status based on response time
    let healthStatus: 'healthy' | 'degraded' = 'healthy';
    if (responseTime > 1000) {
      healthStatus = 'degraded';
    }

    return NextResponse.json({
      status: healthStatus,
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      checks: {
        connectivity: 'pass',
        responseTime: responseTime < 1000 ? 'pass' : 'warning',
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        checks: {
          connectivity: 'fail',
        },
      },
      { status: 503 }
    );
  }
}
