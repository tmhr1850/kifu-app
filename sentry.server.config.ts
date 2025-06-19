import * as Sentry from '@sentry/nextjs';

// Sentryの初期化は環境変数が設定されている場合のみ実行
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    
    tracesSampleRate: 1.0,
    
    environment: process.env.NODE_ENV,
    
    beforeSend(event) {
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      return event;
    },
  });
} else {
  console.warn('Sentry DSN not configured. Server-side Sentry monitoring is disabled.');
}