# Monitoring Setup Guide

## Quick Start

This guide will help you set up automated backups and monitoring for your Supabase database.

## Prerequisites

- Supabase project (Free, Pro, or Enterprise tier)
- Node.js and npm installed
- Supabase CLI installed (`npm install -g supabase`)
- Access to your Supabase project credentials

## Step 1: Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PROJECT_REF=your_project_ref

# Monitoring Configuration
CRON_SECRET=generate_a_random_secret_here

# Alert Configuration (Optional)
ALERT_EMAIL_ENABLED=false
ALERT_FROM_EMAIL=alerts@yourdomain.com
ALERT_TO_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Webhook Alerts (Optional)
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
ALERT_WEBHOOK_HEADERS={"Authorization":"Bearer your_token"}

# Backup Configuration
BACKUP_DIR=./backups
RETENTION_DAYS=30
```

## Step 2: Apply Database Migrations

Run the monitoring functions migration:

```bash
# Navigate to your project root
cd /path/to/fitness-app-website

# Apply the migration
supabase db push

# Or if using remote database
supabase db push --db-url your_database_url
```

This will create all necessary monitoring functions in your database.

## Step 3: Enable pg_stat_statements (Optional but Recommended)

For advanced query performance monitoring, enable the `pg_stat_statements` extension:

1. Go to Supabase Dashboard → Database → Extensions
2. Search for "pg_stat_statements"
3. Click "Enable"

Or run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

## Step 4: Set Up Automated Backups

### Option A: Using Cron (Linux/Mac)

1. Make the backup script executable:
```bash
chmod +x scripts/backup-database.sh
```

2. Edit your crontab:
```bash
crontab -e
```

3. Add a daily backup at 2 AM:
```bash
0 2 * * * cd /path/to/fitness-app-website && ./scripts/backup-database.sh >> /var/log/supabase-backup.log 2>&1
```

### Option B: Using Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task → "Supabase Daily Backup"
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `bash.exe`
   - Arguments: `/path/to/scripts/backup-database.sh`
   - Start in: `/path/to/fitness-app-website`

### Option C: Using Vercel Cron (Recommended for Production)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Step 5: Set Up Monitoring Cron Job

### Using Vercel Cron (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monitor",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs the monitoring check every 15 minutes.

### Using External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **AWS EventBridge**

Configure it to call:
```
GET https://your-domain.com/api/cron/monitor
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

## Step 6: Test the Setup

### Test Database Health Check

```bash
curl http://localhost:3000/api/health/database
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "45ms",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "checks": {
    "connectivity": "pass",
    "responseTime": "pass"
  }
}
```

### Test Monitoring Endpoint

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/monitor
```

### Test Backup Script

```bash
cd scripts
./backup-database.sh
```

Check the `backups/` directory for the generated backup file.

### Verify Backup

```bash
./scripts/verify-backup.sh backups/fitness_app_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Step 7: Configure Alerts

### Email Alerts

1. Set up an SMTP service (Gmail, SendGrid, AWS SES, etc.)
2. Update environment variables with SMTP credentials
3. Set `ALERT_EMAIL_ENABLED=true`
4. Test by triggering a warning condition

### Webhook Alerts

1. Set up a webhook endpoint (Slack, Discord, PagerDuty, etc.)
2. Add `ALERT_WEBHOOK_URL` to environment variables
3. Test by triggering a warning condition

### Slack Integration Example

Create a Slack webhook:
1. Go to https://api.slack.com/apps
2. Create a new app → Incoming Webhooks
3. Add webhook to workspace
4. Copy webhook URL
5. Set `ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

## Monitoring Dashboard

Access monitoring metrics programmatically:

```typescript
import { databaseMonitor } from '@/lib/monitoring/databaseMonitor';
import { connectionPoolMonitor } from '@/lib/monitoring/connectionPool';

// Get database metrics
const metrics = await databaseMonitor.getMetrics();
console.log('Connection count:', metrics.connectionCount);
console.log('Slow queries:', metrics.slowQueries.length);

// Check connection pool
const poolStatus = await connectionPoolMonitor.checkPoolStatus();
console.log('Pool usage:', poolStatus.percentage + '%');

// Run health check
const health = await databaseMonitor.checkHealth();
console.log('Healthy:', health.healthy);
console.log('Issues:', health.issues);
```

## Maintenance Tasks

### Daily
- ✅ Automated backup runs (via cron)
- ✅ Monitoring checks run (every 15 minutes)
- ✅ Alerts sent if issues detected

### Weekly
- Review slow query reports
- Check backup logs for failures
- Verify backup file sizes
- Review connection pool usage trends

### Monthly
- Test backup restoration
- Review and update alert thresholds
- Check database size growth
- Review unused indexes
- Update documentation

### Quarterly
- Disaster recovery drill
- Review and update runbooks
- Audit RLS policies
- Performance optimization review

## Troubleshooting

### Backups Not Running

1. Check cron logs: `tail -f /var/log/supabase-backup.log`
2. Verify Supabase CLI is installed: `supabase --version`
3. Check environment variables are set
4. Verify disk space is available
5. Test manual backup: `./scripts/backup-database.sh`

### Monitoring Endpoint Returns 401

1. Verify `CRON_SECRET` is set in environment
2. Check Authorization header format: `Bearer YOUR_SECRET`
3. Ensure secret matches in both `.env.local` and cron configuration

### No Alerts Being Sent

1. Check alert configuration in environment variables
2. Verify SMTP credentials (for email alerts)
3. Test webhook URL manually
4. Check application logs for alert errors
5. Verify alerting service is initialized

### High Connection Count Warnings

1. Review application connection pooling
2. Check for connection leaks
3. Identify long-running queries
4. Consider upgrading Supabase plan
5. Optimize query performance

### Slow Query Alerts

1. Review slow query list in monitoring
2. Add missing indexes
3. Optimize JSONB queries
4. Review RLS policy complexity
5. Consider query caching

## Best Practices

1. **Test Backups Regularly**: Schedule monthly restoration tests
2. **Monitor Trends**: Track metrics over time to identify patterns
3. **Set Appropriate Thresholds**: Adjust alert thresholds based on your usage
4. **Document Incidents**: Keep a log of issues and resolutions
5. **Review Regularly**: Monthly review of monitoring data and alerts
6. **Keep Credentials Secure**: Never commit secrets to version control
7. **Plan for Growth**: Monitor database size and plan upgrades proactively

## Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Monitoring Guide](https://www.postgresql.org/docs/current/monitoring.html)
- [Full Monitoring Documentation](./supabase-backup-monitoring.md)

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review logs in `backups/backup.log`
- Consult the [full documentation](./supabase-backup-monitoring.md)
- Contact your database administrator

---

*Last Updated: January 2024*
