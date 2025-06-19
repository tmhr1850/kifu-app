import * as Sentry from '@sentry/nextjs';

// Sentryの初期化は環境変数が設定されている場合のみ実行
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    tracesSampleRate: 1.0,
    
    replaysOnErrorSampleRate: 1.0,
    
    replaysSessionSampleRate: 0.1,
    
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    beforeSend(event) {
      if (event.request?.url) {
        const url = new URL(event.request.url);
        if (url.pathname.includes('/admin/')) {
          event.fingerprint = ['admin-error', event.exception?.values?.[0]?.type || 'unknown'];
        }
      }
      return event;
    },
  });
} else {
  console.warn('Sentry DSN not configured. Sentry monitoring is disabled.');
}