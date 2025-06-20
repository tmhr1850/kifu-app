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
        
        beforeSend(event) {
          if (event.exception) {
            analytics.trackError(
              new Error(event.exception.values?.[0]?.value || 'Unknown error'),
              { sentryEventId: event.event_id }
            );
          }
          return event;
        },

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

    analytics.trackError(error, errorContext);
    trackPerformanceError(error);
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
    if (!this.initialized) {
      console.log(`[${level}]`, message);
      return;
    }

    Sentry.captureMessage(message, level, {
      extra: {
        ...this.userContext,
        ...context,
      },
    });
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

  startTransaction(name: string, op: string = 'navigation') {
    if (!this.initialized) {
      return null;
    }

    return Sentry.startSpan({
      name,
      op,
    }, () => {});
  }

  measurePerformance<T>(
    name: string,
    operation: () => T | Promise<T>
  ): T | Promise<T> {
    const startTime = performance.now();
    const transaction = this.startTransaction(name, 'function');

    const finish = (result: T) => {
      const duration = performance.now() - startTime;
      
      if (transaction) {
        transaction.finish();
      }

      analytics.trackEvent({
        category: 'performance',
        action: 'operation',
        label: name,
        value: Math.round(duration),
      });

      if (duration > 1000) {
        this.captureMessage(
          `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
          'warning',
          { operation: name, duration }
        );
      }

      return result;
    };

    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result.then(finish).catch((error) => {
          if (transaction) {
            transaction.finish();
          }
          this.captureException(error, { operation: name });
          throw error;
        });
      }
      
      return finish(result);
    } catch (error) {
      if (transaction) {
        transaction.finish();
      }
      this.captureException(error as Error, { operation: name });
      throw error;
    }
  }

  withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  ) {
    if (!this.initialized) {
      return Component;
    }

    return Sentry.withErrorBoundary(Component, {
      fallback,
      showDialog: false,
      onError: (error) => {
        this.captureException(error, {
          component: Component.displayName || Component.name || 'Unknown',
        });
      },
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

export function captureException(error: Error, context?: Record<string, unknown>) {
  monitoring.captureException(error, context);
}

export function captureMessage(
  message: string, 
  level: Sentry.SeverityLevel = 'info', 
  context?: Record<string, unknown>
) {
  monitoring.captureMessage(message, level, context);
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

export function measurePerformance<T>(
  name: string,
  operation: () => T | Promise<T>
): T | Promise<T> {
  return monitoring.measurePerformance(name, operation);
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return monitoring.withErrorBoundary(Component, fallback);
}