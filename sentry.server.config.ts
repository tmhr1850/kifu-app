import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  environment: process.env.NODE_ENV,
  
  beforeSend(event) {
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    return event;
  },
});