/**
 * Alerting Service
 * 
 * Handles sending alerts for database monitoring issues via email,
 * webhooks, or other notification channels.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  severity: AlertSeverity;
  metric: string;
  value: number | string;
  threshold: number | string;
  message: string;
  timestamp?: Date;
}

export interface AlertChannel {
  type: 'email' | 'webhook' | 'console';
  enabled: boolean;
  config?: Record<string, unknown>;
}

export class AlertingService {
  private channels: AlertChannel[] = [];

  constructor() {
    this.initializeChannels();
  }

  /**
   * Initialize alert channels based on environment configuration
   */
  private initializeChannels() {
    // Console logging (always enabled for development)
    this.channels.push({
      type: 'console',
      enabled: true,
    });

    // Email alerts (if configured)
    if (process.env.ALERT_EMAIL_ENABLED === 'true') {
      this.channels.push({
        type: 'email',
        enabled: true,
        config: {
          from: process.env.ALERT_FROM_EMAIL,
          to: process.env.ALERT_TO_EMAIL,
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER,
          smtpPass: process.env.SMTP_PASS,
        },
      });
    }

    // Webhook alerts (if configured)
    if (process.env.ALERT_WEBHOOK_URL) {
      this.channels.push({
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: process.env.ALERT_WEBHOOK_HEADERS
            ? JSON.parse(process.env.ALERT_WEBHOOK_HEADERS)
            : {},
        },
      });
    }
  }

  /**
   * Send an alert through all enabled channels
   */
  async sendAlert(alert: Alert): Promise<void> {
    const alertWithTimestamp = {
      ...alert,
      timestamp: alert.timestamp || new Date(),
    };

    const promises = this.channels
      .filter((channel) => channel.enabled)
      .map((channel) => this.sendToChannel(channel, alertWithTimestamp));

    await Promise.allSettled(promises);
  }

  /**
   * Send alert to a specific channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          this.sendToConsole(alert);
          break;
        case 'email':
          await this.sendToEmail(alert, channel.config);
          break;
        case 'webhook':
          await this.sendToWebhook(alert, channel.config);
          break;
      }
    } catch (error) {
      console.error(`Failed to send alert via ${channel.type}:`, error);
    }
  }

  /**
   * Log alert to console
   */
  private sendToConsole(alert: Alert): void {
    const prefix = this.getSeverityPrefix(alert.severity);
    const message = `${prefix} [${alert.metric}] ${alert.message}`;
    
    switch (alert.severity) {
      case 'critical':
        console.error(message, alert);
        break;
      case 'warning':
        console.warn(message, alert);
        break;
      default:
        console.info(message, alert);
    }
  }

  /**
   * Send alert via email
   */
  private async sendToEmail(alert: Alert, config?: Record<string, unknown>): Promise<void> {
    if (!config) {
      throw new Error('Email configuration not provided');
    }

    // Note: In production, you would use a service like nodemailer, SendGrid, or AWS SES
    // For now, this is a placeholder implementation
    console.log('Email alert would be sent:', {
      to: config.to,
      subject: `[${alert.severity.toUpperCase()}] Database Alert: ${alert.metric}`,
      body: this.formatEmailBody(alert),
    });

    // TODO: Implement actual email sending
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });
  }

  /**
   * Send alert via webhook
   */
  private async sendToWebhook(alert: Alert, config?: Record<string, unknown>): Promise<void> {
    if (!config?.url) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(config.url as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers as Record<string, string>),
      },
      body: JSON.stringify({
        severity: alert.severity,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        message: alert.message,
        timestamp: alert.timestamp?.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }
  }

  /**
   * Format email body for alert
   */
  private formatEmailBody(alert: Alert): string {
    return `
Database Alert Notification

Severity: ${alert.severity.toUpperCase()}
Metric: ${alert.metric}
Current Value: ${alert.value}
Threshold: ${alert.threshold}
Message: ${alert.message}
Time: ${alert.timestamp?.toISOString() || new Date().toISOString()}

Please investigate this issue as soon as possible.

---
This is an automated alert from the Fitness App Database Monitoring System.
    `.trim();
  }

  /**
   * Get severity prefix for console output
   */
  private getSeverityPrefix(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '🚨 CRITICAL';
      case 'warning':
        return '⚠️  WARNING';
      case 'info':
        return 'ℹ️  INFO';
    }
  }

  /**
   * Send multiple alerts in batch
   */
  async sendBatchAlerts(alerts: Alert[]): Promise<void> {
    await Promise.allSettled(alerts.map((alert) => this.sendAlert(alert)));
  }

  /**
   * Create and send a connection pool alert
   */
  async sendConnectionPoolAlert(
    count: number,
    maxConnections: number,
    percentage: number
  ): Promise<void> {
    const severity: AlertSeverity = percentage >= 95 ? 'critical' : 'warning';
    
    await this.sendAlert({
      severity,
      metric: 'Connection Pool Usage',
      value: `${count}/${maxConnections} (${percentage.toFixed(1)}%)`,
      threshold: `${severity === 'critical' ? 95 : 80}%`,
      message: `Database connection pool is at ${percentage.toFixed(1)}% capacity. Consider scaling or optimizing queries.`,
    });
  }

  /**
   * Create and send a slow query alert
   */
  async sendSlowQueryAlert(queryCount: number, threshold: number): Promise<void> {
    await this.sendAlert({
      severity: 'warning',
      metric: 'Slow Queries',
      value: queryCount,
      threshold,
      message: `${queryCount} slow queries detected exceeding ${threshold}ms threshold. Review and optimize these queries.`,
    });
  }

  /**
   * Create and send a database size alert
   */
  async sendDatabaseSizeAlert(currentSize: string, percentUsed: number): Promise<void> {
    const severity: AlertSeverity = percentUsed >= 90 ? 'critical' : 'warning';
    
    await this.sendAlert({
      severity,
      metric: 'Database Size',
      value: currentSize,
      threshold: `${severity === 'critical' ? 90 : 80}%`,
      message: `Database is at ${percentUsed.toFixed(1)}% of quota. Consider archiving old data or upgrading storage.`,
    });
  }
}

// Export singleton instance
export const alertingService = new AlertingService();
