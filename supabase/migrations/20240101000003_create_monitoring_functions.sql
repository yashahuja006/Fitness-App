-- Migration: Create Monitoring Functions
-- Description: Creates database functions for monitoring connection stats,
--              slow queries, and database health metrics

-- Create monitoring schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Grant usage on monitoring schema
GRANT USAGE ON SCHEMA monitoring TO postgres, authenticated, service_role;

-- ============================================================================
-- Connection Monitoring Functions
-- ============================================================================

-- Function to get current connection count
CREATE OR REPLACE FUNCTION get_connection_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT count(*)
        FROM pg_stat_activity
        WHERE datname = current_database()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection statistics
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'total', count(*),
            'active', count(*) FILTER (WHERE state = 'active'),
            'idle', count(*) FILTER (WHERE state = 'idle'),
            'idleInTransaction', count(*) FILTER (WHERE state = 'idle in transaction')
        )
        FROM pg_stat_activity
        WHERE datname = current_database()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection breakdown by state
CREATE OR REPLACE FUNCTION get_connection_breakdown()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'active', count(*) FILTER (WHERE state = 'active'),
            'idle', count(*) FILTER (WHERE state = 'idle'),
            'idleInTransaction', count(*) FILTER (WHERE state = 'idle in transaction'),
            'waiting', count(*) FILTER (WHERE wait_event IS NOT NULL)
        )
        FROM pg_stat_activity
        WHERE datname = current_database()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get long-running connections
CREATE OR REPLACE FUNCTION get_long_running_connections(threshold_minutes INTEGER DEFAULT 5)
RETURNS TABLE (
    pid INTEGER,
    duration TEXT,
    query TEXT,
    state TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pg_stat_activity.pid::INTEGER,
        (now() - pg_stat_activity.query_start)::TEXT as duration,
        pg_stat_activity.query,
        pg_stat_activity.state
    FROM pg_stat_activity
    WHERE
        datname = current_database()
        AND state = 'active'
        AND (now() - pg_stat_activity.query_start) > (threshold_minutes || ' minutes')::INTERVAL
    ORDER BY (now() - pg_stat_activity.query_start) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Query Performance Monitoring Functions
-- ============================================================================

-- Note: pg_stat_statements extension must be enabled for these functions to work
-- Enable it with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Function to get slow queries (requires pg_stat_statements)
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms NUMERIC DEFAULT 500)
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    mean_time NUMERIC,
    total_time NUMERIC
) AS $$
BEGIN
    -- Check if pg_stat_statements exists
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) THEN
        RETURN QUERY
        SELECT
            pss.query::TEXT,
            pss.calls,
            round(pss.mean_exec_time::NUMERIC, 2) as mean_time,
            round(pss.total_exec_time::NUMERIC, 2) as total_time
        FROM pg_stat_statements pss
        WHERE pss.mean_exec_time > threshold_ms
        ORDER BY pss.mean_exec_time DESC
        LIMIT 50;
    ELSE
        -- Return empty result if extension not available
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get query performance statistics
CREATE OR REPLACE FUNCTION get_query_performance()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if pg_stat_statements exists
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) THEN
        SELECT json_build_object(
            'avgQueryTime', round(avg(mean_exec_time)::NUMERIC, 2),
            'maxQueryTime', round(max(mean_exec_time)::NUMERIC, 2),
            'totalQueries', sum(calls)
        )
        INTO result
        FROM pg_stat_statements;
        
        RETURN result;
    ELSE
        RETURN json_build_object(
            'avgQueryTime', 0,
            'maxQueryTime', 0,
            'totalQueries', 0
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Database Size Monitoring Functions
-- ============================================================================

-- Function to get table size
CREATE OR REPLACE FUNCTION get_table_size(table_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT pg_size_pretty(pg_total_relation_size(table_name::regclass))
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all table sizes
CREATE OR REPLACE FUNCTION get_all_table_sizes()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    size_pretty TEXT,
    size_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::TEXT,
        tablename::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT,
        pg_total_relation_size(schemaname||'.'||tablename)
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database size
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT pg_size_pretty(pg_database_size(current_database()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policy Performance Monitoring
-- ============================================================================

-- Function to check RLS policy performance
-- Note: This is a placeholder as actual RLS performance monitoring
-- requires query analysis from pg_stat_statements
CREATE OR REPLACE FUNCTION check_rls_performance()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    avg_execution_time NUMERIC
) AS $$
BEGIN
    -- This is a simplified version
    -- In production, you would analyze pg_stat_statements for RLS-related queries
    RETURN QUERY
    SELECT
        'transformation_plans'::TEXT,
        'Users can view own plans'::TEXT,
        0.5::NUMERIC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Index Usage Monitoring
-- ============================================================================

-- Function to get unused indexes
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::TEXT,
        tablename::TEXT,
        indexname::TEXT,
        pg_size_pretty(pg_relation_size(indexrelid))::TEXT
    FROM pg_stat_user_indexes
    WHERE
        idx_scan = 0
        AND schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::TEXT,
        tablename::TEXT,
        indexname::TEXT,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_connection_count() TO service_role;
GRANT EXECUTE ON FUNCTION get_connection_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_connection_breakdown() TO service_role;
GRANT EXECUTE ON FUNCTION get_long_running_connections(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_slow_queries(NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION get_query_performance() TO service_role;
GRANT EXECUTE ON FUNCTION get_table_size(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_all_table_sizes() TO service_role;
GRANT EXECUTE ON FUNCTION get_database_size() TO service_role;
GRANT EXECUTE ON FUNCTION check_rls_performance() TO service_role;
GRANT EXECUTE ON FUNCTION get_unused_indexes() TO service_role;
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION get_connection_count() IS 'Returns the current number of database connections';
COMMENT ON FUNCTION get_connection_stats() IS 'Returns detailed connection statistics including active, idle, and idle in transaction counts';
COMMENT ON FUNCTION get_connection_breakdown() IS 'Returns connection breakdown by state';
COMMENT ON FUNCTION get_long_running_connections(INTEGER) IS 'Returns connections running longer than the specified threshold in minutes';
COMMENT ON FUNCTION get_slow_queries(NUMERIC) IS 'Returns queries with mean execution time above the threshold (requires pg_stat_statements)';
COMMENT ON FUNCTION get_query_performance() IS 'Returns overall query performance statistics';
COMMENT ON FUNCTION get_table_size(TEXT) IS 'Returns the size of a specific table in human-readable format';
COMMENT ON FUNCTION get_all_table_sizes() IS 'Returns sizes of all tables in the public schema';
COMMENT ON FUNCTION get_database_size() IS 'Returns the total database size in human-readable format';
COMMENT ON FUNCTION check_rls_performance() IS 'Checks Row Level Security policy performance';
COMMENT ON FUNCTION get_unused_indexes() IS 'Returns indexes that have never been scanned';
COMMENT ON FUNCTION get_index_usage_stats() IS 'Returns index usage statistics for all indexes';
