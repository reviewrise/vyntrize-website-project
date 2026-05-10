'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ArrowPathRoundedSquareIcon,
  CursorArrowRaysIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
} from '@heroicons/react/24/outline';

interface DashboardData {
  metrics: {
    totalSessions: number;
    totalPageViews: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  trends: Array<any>;
  topSources: Array<any>;
  topPages: Array<any>;
  deviceStats: Array<{
    deviceType: string;
    sessions: number;
    pageViews: number;
    conversionRate: number;
  }>;
  browserStats: Array<{
    browser: string;
    sessions: number;
    percentage: number;
  }>;
  osStats: Array<{
    os: string;
    sessions: number;
    percentage: number;
  }>;
  comparison?: {
    changes: {
      sessions: number;
      pageViews: number;
      visitors: number;
      conversionRate: number;
    };
  };
}

// Inline MetricCard component
function MetricCard({ title, value, change, icon, format = 'number' }: any) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'duration':
        const minutes = Math.floor(val / 60);
        const seconds = val % 60;
        return `${minutes}m ${seconds}s`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          {title}
        </p>
        {icon && (
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>{formatValue(value)}</p>
      {change !== undefined && change !== 0 && (
        <p className="text-sm mt-2" style={{ color: change > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}% vs previous period
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Adjust end date to include the full day (23:59:59)
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      const endDateStr = endDate.toISOString();
      
      const url = `/api/analytics/dashboard?startDate=${dateRange.startDate}&endDate=${endDateStr}&granularity=day&includeComparison=true`;
      console.log('[Analytics Dashboard] Fetching data from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Analytics Dashboard] Error response:', errorText);
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      console.log('[Analytics Dashboard] Received data:', result);
      setData(result);
    } catch (err) {
      console.error('[Analytics Dashboard] Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Analytics Dashboard</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Track website performance and visitor behavior</p>
        </div>
        <a
          href="/analytics/reports"
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-md)' }}
        >
          View Detailed Reports
        </a>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Page Views"
          value={data.metrics.totalPageViews}
          change={data.comparison?.changes.pageViews}
          icon={<EyeIcon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Unique Visitors"
          value={data.metrics.uniqueVisitors}
          change={data.comparison?.changes.visitors}
          icon={<UserGroupIcon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Total Sessions"
          value={data.metrics.totalSessions}
          change={data.comparison?.changes.sessions}
          icon={<CursorArrowRaysIcon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Conversion Rate"
          value={data.metrics.conversionRate}
          change={data.comparison?.changes.conversionRate}
          format="percentage"
          icon={<ArrowTrendingUpIcon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Avg. Session Duration"
          value={data.metrics.avgSessionDuration}
          format="duration"
          icon={<ClockIcon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
        <MetricCard
          title="Bounce Rate"
          value={data.metrics.bounceRate}
          format="percentage"
          icon={<ArrowPathRoundedSquareIcon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />}
        />
      </div>

      {/* Empty State */}
      {data.trends.length === 0 && data.topSources.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '2px dashed var(--color-border)' }}>
          <ChartBarIcon className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>No Analytics Data Yet</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Analytics data will appear here once visitors interact with your website.
          </p>
        </div>
      )}

      {/* Top Sources */}
      {data.topSources.length > 0 && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Top Traffic Sources</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.topSources.map((source: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover:bg-opacity-50" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-raised)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="px-4 py-4 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{source.source}</td>
                    <td className="px-4 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{source.sessions.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {source.conversionRate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device & Browser Analytics */}
      {(data.deviceStats.length > 0 || data.browserStats.length > 0 || data.osStats.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Types */}
          {data.deviceStats.length > 0 && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Device Types</h2>
              <div className="space-y-4">
                {data.deviceStats.map((device, index) => {
                  const getDeviceIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case 'mobile':
                        return <DevicePhoneMobileIcon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />;
                      case 'tablet':
                        return <DeviceTabletIcon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />;
                      case 'desktop':
                      default:
                        return <ComputerDesktopIcon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />;
                    }
                  };

                  const totalSessions = data.deviceStats.reduce((sum, d) => sum + d.sessions, 0);
                  const percentage = totalSessions > 0 ? (device.sessions / totalSessions) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-raised)' }}>
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.deviceType)}
                        <div>
                          <p className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                            {device.deviceType}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {device.sessions.toLocaleString()} sessions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                          {percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {device.conversionRate.toFixed(1)}% conv.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browsers */}
          {data.browserStats.length > 0 && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Browsers</h2>
              <div className="space-y-3">
                {data.browserStats.map((browser, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {browser.browser}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                          {browser.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-raised)' }}>
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            width: `${browser.percentage}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {browser.sessions.toLocaleString()} sessions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operating Systems */}
          {data.osStats.length > 0 && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Operating Systems</h2>
              <div className="space-y-3">
                {data.osStats.map((os, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {os.os}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                          {os.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-raised)' }}>
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            width: `${os.percentage}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {os.sessions.toLocaleString()} sessions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
