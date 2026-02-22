# Supabase Backup and Monitoring Guide

## Overview

This document outlines the backup and monitoring strategy for the AI Nutrition Engine's Supabase database. It covers automated backups, monitoring setup, health checks, and operational procedures.

## Table of Contents

1. [Automated Backups](#automated-backups)
2. [Database Monitoring](#database-monitoring)
3. [Health Checks](#health-checks)
4. [Alerting Configuration](#alerting-configuration)
5. [Runbooks](#runbooks)
6. [Disaster Recovery](#disaster-recovery)

---

## Automated Backups

### Supabase Built-in Backups

Supabase provides automated daily backups for all projects:

**Free Tier:**
- Daily backups retained for 7 days
- Point-in-time recovery (PITR) not available
- Manual backup exports recommended

**Pro Tier:**
- Daily backups retained for 7 days
- Point-in-time recovery available (up to 7 days)
- Automated backup scheduling

**Enterprise Tier:**
- Custom backup retention (30+ days)
- Point-in-time recovery (custom duration)
- Multi-region backup replication

### Backup Configuration

#### 1. Enable Automated Backups (Pro/Enterprise)

Backups are automatically enabled on Supabase Pro and Enterprise plans. To verify:

1. Go to Supabase Dashboard → Settings → Database
2. Check "Backups" section
3. Verify backup schedule is active

#### 2. Manual Backup Procedures

For Free tier or additional backup copies:

```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Using pg_dump directly
pg_dump -h db.your-project-ref.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d_%H%M%S).dump
```

#### 3. Automated Backup Script

Create a scheduled backup script for additional safety:

```bash
#!/bin/bash
# File: scripts/backup-database.sh

# Configuration
PROJECT_REF="your-project-ref"
BACKUP_DIR="/path/to/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fitness_app_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting backup at $(date)"
supabase db dump -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "Backup compressed: $BACKUP_FILE.gz"
    
    # Remove old backups
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
else
    echo "Backup failed!"
    exit 1
fi
```

#### 4. Schedule Automated Backups

**Using Cron (Linux/Mac):**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/supabase-backup.log 2>&1
```

**Using Windows Task Scheduler:**

1. Open Task Scheduler
2. Create Basic Task → "Supabase Daily Backup"
3. Trigger: Daily at 2:00 AM
4. Action: Start a program → `bash.exe` with arguments: `/path/to/scripts/backup-database.sh`

### Backup Verification

#### Automated Verification Script

```bash
#!/bin/bash
# File: scripts/verify-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > /tmp/backup_verify.sql
    VERIFY_FILE="/tmp/backup_verify.sql"
else
    VERIFY_FILE="$BACKUP_FILE"
fi

# Check file size
FILE_SIZE=$(stat -f%z "$VERIFY_FILE" 2>/dev/null || stat -c%s "$VERIFY_FILE" 2>/dev/null)
if [ "$FILE_SIZE" -lt 1000 ]; then
    echo "ERROR: Backup file is too small ($FILE_SIZE bytes)"
    exit 1
fi

# Check for critical tables
REQUIRED_TABLES=("transformation_plans" "progress_tracking")
for table in "${REQUIRED_TABLES[@]}"; do
    if ! grep -q "CREATE TABLE.*$table" "$VERIFY_FILE"; then
        echo "ERROR: Table $table not found in backup"
        exit 1
    fi
done

echo "Backup verification passed: $BACKUP_FILE"
echo "File size: $FILE_SIZE bytes"

# Cleanup
rm -f /tmp/backup_verify.sql
```

### Backup Retention Policy

| Backup Type | Retention Period | Storage Location |
|-------------|------------------|------------------|
| Daily Automated | 7 days | Supabase (built-in) |
| Weekly Manual | 30 days | External storage |
| Monthly Archive | 12 months | Cold storage |
| Pre-deployment | Indefinite | Version control |

---

## Database Monitoring

### Key Metrics to Monitor

1. **Performance Metrics**
   - Query execution time
   - Connection pool usage
   - Database size and growth rate
   - Index usage and efficiency

2. **Resource Metrics**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network throughput

3. **Application Metrics**
   - API response times
   - Error rates
   - Active connections
   - RLS policy performance

### Supabase Dashboard Monitoring

Access built-in monitoring:

1. Go to Supabase Dashboard → Reports
2. Monitor:
   - Database health
   - API usage
   - Storage usage
   - Auth activity

### Custom Monitoring Setup

#### 1. Database Performance Monitoring

Create a monitoring view:

```sql
-- File: supabase/migrations/monitoring_views.sql

-- Query performance monitoring
CREATE OR REPLACE VIEW monitoring.slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms
ORDER BY mean_time DESC
LIMIT 50;

-- Connection monitoring
CREATE OR REPLACE VIEW monitoring.connection_stats AS
SELECT
    datname,
    count(*) as connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname;

-- Table size monitoring
CREATE OR REPLACE VIEW monitoring.table_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

#### 2. Application-Level Monitoring

Create a monitoring service:

```typescript
// File: src/lib/monitoring/databaseMonitor.ts

import { createClient } from '@supabase/supabase-js';

interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  databaseSize: string;
  slowQueries: Array<{
    query: string;
    meanTime: number;
    calls: number;
  }>;
  timestamp: Date;
}

export class DatabaseMonitor {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async getMetrics(): Promise<DatabaseMetrics> {
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
  }

  private async getConnectionStats() {
    const { data, error } = await this.supabase
      .from('monitoring.connection_stats')
      .select('*')
      .single();

    if (error) throw error;

    return {
      total: data.connections,
      active: data.active,
      idle: data.idle,
    };
  }

  private async getSlowQueries() {
    const { data, error } = await this.supabase
      .from('monitoring.slow_queries')
      .select('query, mean_time, calls')
      .limit(10);

    if (error) throw error;
    return data;
  }

  private async getDatabaseSize() {
    const { data, error } = await this.supabase
      .from('monitoring.table_sizes')
      .select('size')
      .eq('tablename', 'transformation_plans')
      .single();

    if (error) throw error;
    return data.size;
  }

  async checkHealth(): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    const metrics = await this.getMetrics();

    // Check connection pool
    if (metrics.connectionCount > 80) {
      issues.push('High connection count detected');
    }

    // Check for slow queries
    if (metrics.slowQueries.length > 5) {
      issues.push(`${metrics.slowQueries.length} slow queries detected`);
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}
```

---

## Health Checks

### API Health Check Endpoint

Create a health check endpoint:

```typescript
// File: src/app/api/health/database/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test database connection
    const { data, error } = await supabase
      .from('transformation_plans')
      .select('count')
      .limit(1);

    if (error) throw error;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### Connection Pool Monitoring

```typescript
// File: src/lib/monitoring/connectionPool.ts

export class ConnectionPoolMonitor {
  private maxConnections = 100;
  private warningThreshold = 80;

  async checkPoolStatus() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc('get_connection_count');

    if (error) {
      console.error('Failed to check connection pool:', error);
      return { status: 'unknown', count: 0 };
    }

    const count = data as number;
    const percentage = (count / this.maxConnections) * 100;

    if (percentage >= this.warningThreshold) {
      console.warn(`Connection pool at ${percentage.toFixed(1)}% capacity`);
      return { status: 'warning', count, percentage };
    }

    return { status: 'healthy', count, percentage };
  }
}
```

### RLS Policy Performance

```sql
-- Monitor RLS policy execution time
CREATE OR REPLACE FUNCTION monitoring.check_rls_performance()
RETURNS TABLE (
    table_name text,
    policy_name text,
    avg_execution_time numeric
) AS $$
BEGIN
    -- This is a placeholder - actual implementation depends on pg_stat_statements
    RETURN QUERY
    SELECT
        'transformation_plans'::text,
        'Users can view own plans'::text,
        0.5::numeric;
END;
$$ LANGUAGE plpgsql;
```

---

## Alerting Configuration

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Connection Pool | >80% | >95% | Scale up or optimize queries |
| Query Time | >500ms | >2s | Investigate slow queries |
| Database Size | >80% quota | >95% quota | Archive old data or upgrade |
| Error Rate | >5% | >10% | Check logs and RLS policies |
| Response Time | >1s | >3s | Optimize or scale |

### Email Alerting

```typescript
// File: src/lib/monitoring/alerting.ts

import nodemailer from 'nodemailer';

interface Alert {
  severity: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

export class AlertingService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // Configure your email service
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendAlert(alert: Alert) {
    const subject = `[${alert.severity.toUpperCase()}] Database Alert: ${alert.metric}`;
    
    const html = `
      <h2>Database Alert</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Metric:</strong> ${alert.metric}</p>
      <p><strong>Current Value:</strong> ${alert.value}</p>
      <p><strong>Threshold:</strong> ${alert.threshold}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    `;

    await this.transporter.sendMail({
      from: process.env.ALERT_FROM_EMAIL,
      to: process.env.ALERT_TO_EMAIL,
      subject,
      html,
    });
  }
}
```

### Monitoring Cron Job

```typescript
// File: src/app/api/cron/monitor/route.ts

import { NextResponse } from 'next/server';
import { DatabaseMonitor } from '@/lib/monitoring/databaseMonitor';
import { AlertingService } from '@/lib/monitoring/alerting';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const monitor = new DatabaseMonitor();
    const alerting = new AlertingService();
    
    const health = await monitor.checkHealth();
    
    if (!health.healthy) {
      for (const issue of health.issues) {
        await alerting.sendAlert({
          severity: 'warning',
          metric: 'Database Health',
          value: 0,
          threshold: 0,
          message: issue,
        });
      }
    }

    return NextResponse.json({
      status: health.healthy ? 'ok' : 'issues_detected',
      issues: health.issues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Monitoring cron failed:', error);
    return NextResponse.json(
      { error: 'Monitoring failed' },
      { status: 500 }
    );
  }
}
```

---

## Runbooks

### Common Issues and Solutions

#### Issue 1: High Connection Count

**Symptoms:**
- Connection pool warnings
- Slow query performance
- Connection timeout errors

**Diagnosis:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check connections by state
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;
```

**Resolution:**
1. Identify long-running queries:
   ```sql
   SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;
   ```

2. Kill problematic connections:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE pid = <problematic_pid>;
   ```

3. Optimize application connection pooling
4. Consider upgrading Supabase plan

#### Issue 2: Slow Queries

**Symptoms:**
- API timeouts
- High query execution times
- User complaints about performance

**Diagnosis:**
```sql
-- Find slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Resolution:**
1. Add missing indexes
2. Optimize JSONB queries
3. Review RLS policies
4. Consider query caching

#### Issue 3: Database Size Growth

**Symptoms:**
- Approaching storage quota
- Slow backup times
- Increased costs

**Diagnosis:**
```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Resolution:**
1. Archive old transformation plans
2. Implement data retention policies
3. Compress JSONB data
4. Upgrade storage plan

#### Issue 4: Backup Failure

**Symptoms:**
- Backup script errors
- Missing backup files
- Incomplete backups

**Diagnosis:**
1. Check backup logs
2. Verify disk space
3. Test database connectivity

**Resolution:**
1. Ensure sufficient disk space
2. Verify credentials and permissions
3. Check network connectivity
4. Run manual backup to test

---

## Disaster Recovery

### Recovery Procedures

#### Restore from Supabase Backup (Pro/Enterprise)

1. Go to Supabase Dashboard → Settings → Database → Backups
2. Select backup to restore
3. Click "Restore" and confirm
4. Wait for restoration to complete
5. Verify data integrity

#### Restore from Manual Backup

```bash
# Restore from SQL dump
psql -h db.your-project-ref.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_20240101_120000.sql

# Restore from custom format
pg_restore -h db.your-project-ref.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  backup_20240101_120000.dump
```

### Recovery Time Objectives (RTO)

| Scenario | Target RTO | Procedure |
|----------|-----------|-----------|
| Minor data corruption | 1 hour | Point-in-time recovery |
| Table deletion | 2 hours | Restore from daily backup |
| Complete database loss | 4 hours | Full restore from backup |
| Regional outage | 8 hours | Failover to backup region |

### Recovery Point Objectives (RPO)

| Tier | RPO | Backup Frequency |
|------|-----|------------------|
| Free | 24 hours | Daily |
| Pro | 1 hour | PITR + Daily |
| Enterprise | 15 minutes | PITR + Continuous |

### Testing Recovery

Schedule quarterly disaster recovery tests:

1. Create test environment
2. Restore latest backup
3. Verify data integrity
4. Test application functionality
5. Document any issues
6. Update procedures as needed

---

## Maintenance Schedule

| Task | Frequency | Responsibility |
|------|-----------|----------------|
| Verify backups | Daily | Automated |
| Review slow queries | Weekly | DevOps |
| Check storage usage | Weekly | DevOps |
| Test backup restoration | Monthly | DevOps |
| Review RLS policies | Monthly | Security |
| Disaster recovery drill | Quarterly | Team |
| Update documentation | As needed | Team |

---

## Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Database Monitoring Guide](https://supabase.com/docs/guides/platform/metrics)
- [Row Level Security Performance](https://supabase.com/docs/guides/auth/row-level-security)

---

## Contact Information

**Database Administrator:** [Your Name/Team]  
**Emergency Contact:** [Emergency Email/Phone]  
**Supabase Support:** support@supabase.io  
**Escalation:** [Escalation Procedure]

---

*Last Updated: [Current Date]*  
*Version: 1.0*
