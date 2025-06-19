import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';
import { checkPerformanceMetric } from './alerts';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class Analytics {
  private metricsBuffer: PerformanceMetric[] = [];
  private eventBuffer: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializePerformanceObserver();
      this.startFlushInterval();
    }
  }

  private initializeWebVitals() {
    getCLS(this.sendWebVitalMetric);
    getFID(this.sendWebVitalMetric);
    getLCP(this.sendWebVitalMetric);
    getFCP(this.sendWebVitalMetric);
    getTTFB(this.sendWebVitalMetric);
  }

  private initializePerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming);
          } else if (entry.entryType === 'resource') {
            this.trackResourceTiming(entry as PerformanceResourceTiming);
          }
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource'] 
      });
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      domComplete: entry.domComplete - entry.domInteractive,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      this.trackMetric({
        name: `navigation.${name}`,
        value,
        rating: this.getMetricRating(name, value),
        timestamp: Date.now(),
      });
    });
  }

  private trackResourceTiming(entry: PerformanceResourceTiming) {
    if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
      const duration = entry.responseEnd - entry.startTime;
      if (duration > 1000) {
        this.trackMetric({
          name: 'api.slowRequest',
          value: duration,
          rating: 'poor',
          timestamp: Date.now(),
        });
      }
    }
  }

  private sendWebVitalMetric = (metric: { name: string; value: number; id: string; delta: number; rating: 'good' | 'needs-improvement' | 'poor' }) => {
    const rating = this.getWebVitalRating(metric.name, metric.value);
    
    this.trackMetric({
      name: `webvital.${metric.name}`,
      value: Math.round(metric.value),
      rating,
      timestamp: Date.now(),
    });

    // Check performance thresholds and trigger alerts if needed
    checkPerformanceMetric(`webvital.${metric.name}`, metric.value);

    if (rating === 'poor') {
      this.sendAlert({
        type: 'performance',
        metric: metric.name,
        value: metric.value,
        threshold: this.getWebVitalThreshold(metric.name),
      });
    }
  };

  private getWebVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      LCP: [2500, 4000],
      FCP: [1800, 3000],
      TTFB: [800, 1800],
    };

    const [good, poor] = thresholds[name] || [0, Infinity];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private getWebVitalThreshold(name: string): number {
    const thresholds: Record<string, number> = {
      CLS: 0.25,
      FID: 300,
      LCP: 4000,
      FCP: 3000,
      TTFB: 1800,
    };
    return thresholds[name] || 0;
  }

  private getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value < 100) return 'good';
    if (value < 500) return 'needs-improvement';
    return 'poor';
  }

  trackEvent(event: AnalyticsEvent) {
    this.eventBuffer.push({
      ...event,
      timestamp: Date.now(),
    });

    if (this.eventBuffer.length >= 10) {
      this.flush();
    }
  }

  trackMetric(metric: PerformanceMetric) {
    this.metricsBuffer.push(metric);

    if (this.metricsBuffer.length >= 10) {
      this.flush();
    }
  }

  trackPageView(path: string) {
    this.trackEvent({
      category: 'navigation',
      action: 'pageview',
      label: path,
    });
  }

  trackUserAction(action: string, label?: string, value?: number) {
    this.trackEvent({
      category: 'user',
      action,
      label,
      value,
    });
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    this.trackEvent({
      category: 'error',
      action: error.name,
      label: error.message,
    });

    if (context) {
      console.error('Error context:', context);
    }
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      if (this.metricsBuffer.length > 0 || this.eventBuffer.length > 0) {
        this.flush();
      }
    }, 30000);
  }

  private async flush() {
    if (this.metricsBuffer.length === 0 && this.eventBuffer.length === 0) {
      return;
    }

    const data = {
      metrics: [...this.metricsBuffer],
      events: [...this.eventBuffer],
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
    };

    this.metricsBuffer = [];
    this.eventBuffer = [];

    try {
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }
    } catch (error) {
      console.error('Failed to send analytics data:', error);
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async sendAlert(alert: { type: string; metric: string; value: number; threshold: number }) {
    try {
      if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK) {
        await fetch(process.env.NEXT_PUBLIC_ALERT_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...alert,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.flush();
  }
}

export const analytics = new Analytics();

export function trackEvent(category: string, action: string, label?: string, value?: number) {
  analytics.trackEvent({ category, action, label, value });
}

export function trackPageView(path: string) {
  analytics.trackPageView(path);
}

export function trackUserAction(action: string, label?: string, value?: number) {
  analytics.trackUserAction(action, label, value);
}

export function trackError(error: Error, context?: Record<string, unknown>) {
  analytics.trackError(error, context);
}