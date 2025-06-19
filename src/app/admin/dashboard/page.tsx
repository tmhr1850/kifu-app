'use client';

import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { trackUserAction } from '@/utils/analytics';
import { Card } from '@/components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceData {
  webVitals: {
    lcp: WebVitalMetric[];
    fid: WebVitalMetric[];
    cls: WebVitalMetric[];
    fcp: WebVitalMetric[];
    ttfb: WebVitalMetric[];
  };
  errors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
  pageViews: Array<{
    path: string;
    count: number;
    avgDuration: number;
  }>;
  userActions: Array<{
    action: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceData['webVitals']>('lcp');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const mockData: PerformanceData = {
        webVitals: {
          lcp: generateMockWebVitalData('LCP', 2500),
          fid: generateMockWebVitalData('FID', 100),
          cls: generateMockWebVitalData('CLS', 0.1),
          fcp: generateMockWebVitalData('FCP', 1800),
          ttfb: generateMockWebVitalData('TTFB', 800),
        },
        errors: [
          { message: 'Failed to fetch game data', count: 12, lastOccurred: '2024-01-20T10:30:00Z' },
          { message: 'WebSocket connection timeout', count: 8, lastOccurred: '2024-01-20T09:45:00Z' },
          { message: 'Invalid move attempted', count: 5, lastOccurred: '2024-01-20T11:00:00Z' },
        ],
        pageViews: [
          { path: '/', count: 1234, avgDuration: 3200 },
          { path: '/kifu', count: 890, avgDuration: 4500 },
          { path: '/online', count: 567, avgDuration: 8900 },
          { path: '/analysis', count: 345, avgDuration: 12000 },
        ],
        userActions: [
          { action: 'start_game', count: 456 },
          { action: 'save_kifu', count: 234 },
          { action: 'analyze_position', count: 189 },
          { action: 'share_game', count: 78 },
        ],
      };
      
      setPerformanceData(mockData);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
    };

    fetchData();
    trackUserAction('view_admin_dashboard');
  }, [timeRange]);

  const generateMockWebVitalData = (name: string, baseValue: number): WebVitalMetric[] => {
    const now = Date.now();
    const points = 24;
    
    return Array.from({ length: points }, (_, i) => {
      const variance = Math.random() * 0.5 + 0.75;
      const value = baseValue * variance;
      const timestamp = now - (points - i) * 3600000;
      
      let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
      if (name === 'LCP' && value > 4000) rating = 'poor';
      else if (name === 'LCP' && value > 2500) rating = 'needs-improvement';
      else if (name === 'FID' && value > 300) rating = 'poor';
      else if (name === 'FID' && value > 100) rating = 'needs-improvement';
      else if (name === 'CLS' && value > 0.25) rating = 'poor';
      else if (name === 'CLS' && value > 0.1) rating = 'needs-improvement';
      
      return { name, value, rating, timestamp };
    });
  };

  const getWebVitalChartData = () => {
    if (!performanceData) return null;

    const metrics = performanceData.webVitals[selectedMetric];
    const labels = metrics.map(m => new Date(m.timestamp).toLocaleTimeString());
    
    return {
      labels,
      datasets: [
        {
          label: selectedMetric.toUpperCase(),
          data: metrics.map(m => m.value),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getPageViewsChartData = () => {
    if (!performanceData) return null;

    return {
      labels: performanceData.pageViews.map(p => p.path),
      datasets: [
        {
          label: 'Page Views',
          data: performanceData.pageViews.map(p => p.count),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'Avg Duration (ms)',
          data: performanceData.pageViews.map(p => p.avgDuration),
          backgroundColor: 'rgba(251, 146, 60, 0.8)',
        },
      ],
    };
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-500';
      case 'needs-improvement': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Dashboard</h1>
        <p className="text-muted-foreground">Monitor application performance and user behavior</p>
      </div>

      <div className="flex gap-4 mb-6">
        {(['1h', '24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {performanceData && Object.entries(performanceData.webVitals).map(([key, metrics]) => {
          const latest = metrics[metrics.length - 1];
          const average = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
          
          return (
            <Card key={key} className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {key.toUpperCase()}
              </h3>
              <p className="text-2xl font-bold mb-1">
                {key === 'cls' ? average.toFixed(3) : Math.round(average)}
                {key === 'cls' ? '' : 'ms'}
              </p>
              <p className={`text-sm ${getRatingColor(latest.rating)}`}>
                {latest.rating.replace('-', ' ')}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Web Vitals Trend</h2>
          <div className="mb-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as keyof PerformanceData['webVitals'])}
              className="px-4 py-2 rounded-lg border bg-background"
            >
              <option value="lcp">Largest Contentful Paint (LCP)</option>
              <option value="fid">First Input Delay (FID)</option>
              <option value="cls">Cumulative Layout Shift (CLS)</option>
              <option value="fcp">First Contentful Paint (FCP)</option>
              <option value="ttfb">Time to First Byte (TTFB)</option>
            </select>
          </div>
          {getWebVitalChartData() && (
            <Line
              data={getWebVitalChartData()!}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Page Performance</h2>
          {getPageViewsChartData() && (
            <Bar
              data={getPageViewsChartData()!}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
          <div className="space-y-3">
            {performanceData?.errors.map((error, index) => (
              <div key={index} className="flex justify-between items-start py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{error.message}</p>
                  <p className="text-sm text-muted-foreground">
                    Last occurred: {new Date(error.lastOccurred).toLocaleString()}
                  </p>
                </div>
                <span className="text-red-500 font-semibold">{error.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Actions</h2>
          <div className="space-y-3">
            {performanceData?.userActions.map((action, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                <span className="font-medium">{action.action.replace('_', ' ')}</span>
                <span className="text-primary font-semibold">{action.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}