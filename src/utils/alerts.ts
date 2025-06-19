import { captureMessage } from './monitoring';

interface AlertThreshold {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  severity: 'warning' | 'error' | 'critical';
}

interface Alert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

class AlertManager {
  private thresholds: AlertThreshold[] = [
    // Web Vitals thresholds
    { metric: 'webvital.LCP', threshold: 4000, operator: 'gt', severity: 'error' },
    { metric: 'webvital.LCP', threshold: 2500, operator: 'gt', severity: 'warning' },
    { metric: 'webvital.FID', threshold: 300, operator: 'gt', severity: 'error' },
    { metric: 'webvital.FID', threshold: 100, operator: 'gt', severity: 'warning' },
    { metric: 'webvital.CLS', threshold: 0.25, operator: 'gt', severity: 'error' },
    { metric: 'webvital.CLS', threshold: 0.1, operator: 'gt', severity: 'warning' },
    { metric: 'webvital.TTFB', threshold: 1800, operator: 'gt', severity: 'error' },
    { metric: 'webvital.TTFB', threshold: 800, operator: 'gt', severity: 'warning' },
    
    // API performance thresholds
    { metric: 'api.slowRequest', threshold: 5000, operator: 'gt', severity: 'error' },
    { metric: 'api.slowRequest', threshold: 2000, operator: 'gt', severity: 'warning' },
    
    // Error rate thresholds
    { metric: 'error.rate', threshold: 10, operator: 'gt', severity: 'critical' },
    { metric: 'error.rate', threshold: 5, operator: 'gt', severity: 'error' },
    { metric: 'error.rate', threshold: 2, operator: 'gt', severity: 'warning' },
  ];

  private alerts: Alert[] = [];
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private errorCounts: Map<string, number> = new Map();
  private lastErrorReset = Date.now();

  checkMetric(metric: string, value: number) {
    const applicableThresholds = this.thresholds
      .filter(t => t.metric === metric)
      .sort((a, b) => {
        const severityOrder = { critical: 3, error: 2, warning: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    for (const threshold of applicableThresholds) {
      if (this.evaluateThreshold(value, threshold)) {
        this.createAlert(metric, value, threshold);
        break;
      }
    }
  }

  private evaluateThreshold(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.operator) {
      case 'gt': return value > threshold.threshold;
      case 'lt': return value < threshold.threshold;
      case 'gte': return value >= threshold.threshold;
      case 'lte': return value <= threshold.threshold;
      case 'eq': return value === threshold.threshold;
      default: return false;
    }
  }

  private createAlert(metric: string, value: number, threshold: AlertThreshold) {
    const alert: Alert = {
      id: `${metric}-${Date.now()}-${Math.random()}`,
      metric,
      value,
      threshold: threshold.threshold,
      severity: threshold.severity,
      message: this.generateAlertMessage(metric, value, threshold),
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.notifyAlert(alert);
    this.persistAlert(alert);
  }

  private generateAlertMessage(metric: string, value: number, threshold: AlertThreshold): string {
    const metricDisplayNames: Record<string, string> = {
      'webvital.LCP': 'Largest Contentful Paint',
      'webvital.FID': 'First Input Delay',
      'webvital.CLS': 'Cumulative Layout Shift',
      'webvital.TTFB': 'Time to First Byte',
      'webvital.FCP': 'First Contentful Paint',
      'api.slowRequest': 'API Request Duration',
      'error.rate': 'Error Rate',
    };

    const displayName = metricDisplayNames[metric] || metric;
    const unit = metric.includes('CLS') ? '' : metric.includes('rate') ? ' errors/min' : 'ms';

    return `${displayName} exceeded ${threshold.severity} threshold: ${value}${unit} (threshold: ${threshold.threshold}${unit})`;
  }

  private notifyAlert(alert: Alert) {
    this.alertCallbacks.forEach(callback => callback(alert));

    captureMessage(alert.message, alert.severity === 'critical' ? 'error' : alert.severity, {
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
    });

    if (typeof window !== 'undefined' && 'Notification' in window && alert.severity !== 'warning') {
      this.sendBrowserNotification(alert);
    }

    this.sendWebhookNotification(alert);
  }

  private async sendBrowserNotification(alert: Alert) {
    if (Notification.permission === 'granted') {
      new Notification('Performance Alert', {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.metric,
      });
    }
  }

  private async sendWebhookNotification(alert: Alert) {
    if (!process.env.NEXT_PUBLIC_ALERT_WEBHOOK) return;

    try {
      await fetch(process.env.NEXT_PUBLIC_ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'server',
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  private persistAlert(alert: Alert) {
    if (typeof window === 'undefined') return;

    const alerts = this.getPersistedAlerts();
    alerts.push(alert);
    
    const recentAlerts = alerts
      .filter(a => a.timestamp > Date.now() - 24 * 60 * 60 * 1000)
      .slice(-100);

    localStorage.setItem('performance_alerts', JSON.stringify(recentAlerts));
  }

  private getPersistedAlerts(): Alert[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('performance_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  trackError(error: Error) {
    const errorKey = `${error.name}:${error.message}`;
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    const now = Date.now();
    if (now - this.lastErrorReset > 60000) {
      const errorRate = Array.from(this.errorCounts.values()).reduce((sum, c) => sum + c, 0);
      this.checkMetric('error.rate', errorRate);
      
      this.errorCounts.clear();
      this.lastErrorReset = now;
    }
  }

  onAlert(callback: (alert: Alert) => void) {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.persistAlert(alert);
    }
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged && a.timestamp > Date.now() - 24 * 60 * 60 * 1000);
  }

  getAlertHistory(hours: number = 24): Alert[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const persisted = this.getPersistedAlerts();
    
    return [...persisted, ...this.alerts]
      .filter(a => a.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  addCustomThreshold(threshold: AlertThreshold) {
    this.thresholds.push(threshold);
  }

  removeCustomThreshold(metric: string) {
    this.thresholds = this.thresholds.filter(t => t.metric !== metric);
  }
}

export const alertManager = new AlertManager();

export function checkPerformanceMetric(metric: string, value: number) {
  alertManager.checkMetric(metric, value);
}

export function trackPerformanceError(error: Error) {
  alertManager.trackError(error);
}

export function onPerformanceAlert(callback: (alert: Alert) => void) {
  return alertManager.onAlert(callback);
}

export function getActiveAlerts() {
  return alertManager.getActiveAlerts();
}

export function acknowledgeAlert(alertId: string) {
  alertManager.acknowledgeAlert(alertId);
}