# Database Backup and Monitoring System

## Overview

This directory contains the complete backup and monitoring infrastructure for the AI Nutrition Engine's Supabase database. The system provides automated backups, real-time health monitoring, alerting, and comprehensive operational documentation.

## 📁 File Structure

```
fitness-app-website/
├── docs/
│   ├── supabase-backup-monitoring.md    # Complete technical documentation
│   ├── monitoring-setup-guide.md        # Quick setup guide
│   └── MONITORING_README.md             # This file
├── scripts/
│   ├── backup-database.sh               # Automated backup script
│   └── verify-backup.sh                 # Backup verification script
├── src/
│   ├── lib/monitoring/
│   │   ├── databaseMonitor.ts           # Core monitoring service
│   │   ├── connectionPool.ts            # Connection pool monitoring
│   │   └── alerting.ts                  # Alert management
│   └── app/api/
│       ├── health/database/route.ts     # Health check endpoint
│       └── cron/monitor/route.ts        # Monitoring cron job
└── supabase/migrations/
    └── 20240101000003_create_monitoring_functions.sql
```

## 🚀 Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `CRON_SECRET`

### 2. Apply Database Migrations

```bash
supabase db push
```

### 3. Set Up Automated Backups

```bash
chmod +x scripts/backup-database.sh
crontab -e
# Add: 0 2 * * * cd /path/to/project && ./scripts/backup-database.sh
```

### 4. Test the System

```bash
# Test health check
curl http://localhost:3000/api/health/database

# Test backup
./scripts/backup-database.sh

# Verify backup
./scripts/verify-backup.sh backups/fitness_app_backup_*.sql.gz
```

## 📊 Features

### Automated Backups
- ✅ Daily automated backups via cron
- ✅ Configurable retention policy (default: 30 days)
- ✅ Automatic compression (gzip)
- ✅ Backup verification and integrity checks
- ✅ Detailed logging

### Database Monitoring
- ✅ Connection pool monitoring
- ✅ Slow query detection
- ✅ Database size tracking
- ✅ RLS policy performance
- ✅ Index usage statistics

### Health Checks
- ✅ Database connectivity testing
- ✅ Response time monitoring
- ✅ Automated health checks every 15 minutes
- ✅ RESTful health check endpoint

### Alerting
- ✅ Email alerts (configurable)
- ✅ Webhook alerts (Slack, Discord, etc.)
- ✅ Console logging
- ✅ Configurable severity levels
- ✅ Alert batching

## 🔧 Configuration

### Backup Configuration

```bash
# Environment variables
BACKUP_DIR=./backups           # Backup storage location
RETENTION_DAYS=30              # How long to keep backups
SUPABASE_PROJECT_REF=xxx       # Your Supabase project reference
```

### Monitoring Configuration

```bash
# Cron job secret for security
CRON_SECRET=your_random_secret

# Alert thresholds (defaults in code)
CONNECTION_WARNING_THRESHOLD=80    # % of max connections
SLOW_QUERY_THRESHOLD=500          # milliseconds
```

### Alert Configuration

```bash
# Email alerts
ALERT_EMAIL_ENABLED=true
ALERT_FROM_EMAIL=alerts@yourdomain.com
ALERT_TO_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password

# Webhook alerts (Slack, Discord, etc.)
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## 📈 Monitoring Endpoints

### Health Check
```
GET /api/health/database
```

Returns database connectivity and response time.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "45ms",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Monitoring Cron
```
GET /api/cron/monitor
Authorization: Bearer YOUR_CRON_SECRET
```

Runs comprehensive health checks and sends alerts if needed.

## 🔍 Monitoring Metrics

### Connection Pool
- Total connections
- Active connections
- Idle connections
- Idle in transaction
- Connection percentage

### Query Performance
- Slow queries (>500ms)
- Average query time
- Maximum query time
- Total query count

### Database Size
- Total database size
- Table sizes
- Growth rate
- Storage quota usage

### RLS Performance
- Policy execution time
- Policy complexity
- Access patterns

## 🚨 Alert Conditions

| Metric | Warning | Critical |
|--------|---------|----------|
| Connection Pool | >80% | >95% |
| Query Time | >500ms | >2s |
| Database Size | >80% quota | >95% quota |
| Error Rate | >5% | >10% |
| Response Time | >1s | >3s |

## 📚 Documentation

- **[Complete Documentation](./supabase-backup-monitoring.md)**: Comprehensive technical guide with runbooks
- **[Setup Guide](./monitoring-setup-guide.md)**: Step-by-step setup instructions
- **[Supabase Integration](./supabase-integration.md)**: Database schema and integration details

## 🛠️ Maintenance

### Daily (Automated)
- Backup creation and verification
- Health checks every 15 minutes
- Alert notifications

### Weekly (Manual)
- Review slow query reports
- Check backup logs
- Verify backup integrity
- Review connection pool trends

### Monthly (Manual)
- Test backup restoration
- Review alert thresholds
- Check database size growth
- Optimize slow queries
- Review unused indexes

### Quarterly (Manual)
- Disaster recovery drill
- Update runbooks
- Audit RLS policies
- Performance optimization

## 🐛 Troubleshooting

### Backups Failing
1. Check Supabase CLI installation: `supabase --version`
2. Verify credentials in `.env.local`
3. Check disk space: `df -h`
4. Review logs: `tail -f backups/backup.log`

### Monitoring Not Working
1. Verify migrations applied: `supabase db diff`
2. Check API endpoint: `curl http://localhost:3000/api/health/database`
3. Verify CRON_SECRET is set
4. Check application logs

### No Alerts Received
1. Verify alert configuration in `.env.local`
2. Test SMTP credentials
3. Check webhook URL
4. Review alerting service logs

## 📞 Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [complete documentation](./supabase-backup-monitoring.md)
3. Check application logs
4. Contact your database administrator

## 🔐 Security

- Never commit `.env.local` to version control
- Use strong, random values for `CRON_SECRET`
- Restrict access to backup files
- Use service role key only in backend
- Regularly rotate credentials
- Monitor access logs

## 📝 License

This monitoring system is part of the AI-Powered Fitness Web Application.

---

**Status**: ✅ Implemented and Ready for Use  
**Last Updated**: January 2024  
**Maintained By**: Development Team
