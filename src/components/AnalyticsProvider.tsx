'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics, trackPageView } from '@/utils/analytics';
import { monitoring } from '@/utils/monitoring';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    monitoring.initialize({
      environment: process.env.NODE_ENV,
      debug: process.env.NODE_ENV === 'development',
    });

    return () => {
      analytics.destroy();
    };
  }, []);

  useEffect(() => {
    trackPageView(pathname);
    
    monitoring.addBreadcrumb({
      message: `Navigated to ${pathname}`,
      category: 'navigation',
      level: 'info',
    });
  }, [pathname]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      monitoring.captureException(event.error || new Error(event.message), {
        source: 'window.error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      monitoring.captureException(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          source: 'unhandledrejection',
          reason: event.reason,
        }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}