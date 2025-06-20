import * as Sentry from '@sentry/nextjs';

interface MonitoringConfig {
  dsn?: string;
  environment?: string;
  debug?: boolean;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

class MonitoringService {
  private initialized = false;
  private userContext: Record<string, unknown> = {};

  initialize(config: MonitoringConfig = {}) {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    const dsn = config.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN;
    
    if (!dsn) {
      console.warn('Sentry DSN not configured. Error monitoring disabled.');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: config.environment || process.env.NODE_ENV,
        debug: config.debug || false,
        tracesSampleRate: config.tracesSampleRate || 1.0,
        replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1,
        replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
        
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
      });

      this.initialized = true;
      console.log('Monitoring service initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  }

  captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.initialized) {
      console.error('Monitoring not initialized:', error);
      return;
    }

    const errorContext = {
      ...this.userContext,
      ...context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    Sentry.captureException(error, {
      extra: errorContext,
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    if (!this.initialized) {
      console.log(`[${level}]`, message);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  setUserContext(user: { id: string; email?: string; username?: string }) {
    this.userContext = user;
    
    if (this.initialized) {
      Sentry.setUser(user);
    }
  }

  clearUserContext() {
    this.userContext = {};
    
    if (this.initialized) {
      Sentry.setUser(null);
    }
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, unknown>;
  }) {
    if (!this.initialized) {
      return;
    }

    Sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: Date.now() / 1000,
    });
  }

  flush(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) {
      return Promise.resolve(true);
    }

    return Sentry.flush(timeout);
  }

  close(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) {
      return Promise.resolve(true);
    }

    return Sentry.close(timeout);
  }
}

export const monitoring = new MonitoringService();

// Convenience functions
export function captureException(error: Error, context?: Record<string, unknown>) {
  monitoring.captureException(error, context);
}

export function captureMessage(
  message: string, 
  level: Sentry.SeverityLevel = 'info'
) {
  monitoring.captureMessage(message, level);
}

export function setUserContext(user: { id: string; email?: string; username?: string }) {
  monitoring.setUserContext(user);
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}) {
  monitoring.addBreadcrumb(breadcrumb);
}