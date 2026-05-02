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
function MetricCard({ title, value, change, icon, gradient, format = 'number' }: any) {
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

  const cardClasses = gradient
    ? `bg-gradient-to-br ${gradient} text-white`
    : 'bg-white text-gray-900';

  return (
    <div className={`${cardClasses} rounded-xl shadow-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-sm font-medium ${gradient ? 'text-white/80' : 'text-gray-600'}`}>
          {title}
        </p>
        {icon && (
          <div className={`p-3 ${gradient ? 'bg-white/20' : 'bg-blue-50'} rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold">{formatValue(value)}</p>
      {change !== undefined && change !== 0 && (
        <p className={`text-sm mt-2 ${gradient ? 'text-white/80' : 'text-gray-600'}`}>
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
      const response = await fetch(
        `/api/analytics/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&granularity=day&includeComparison=true`
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Track website performance and visitor behavior</p>
        </div>
        <a
          href="/analytics/reports"
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 text-sm font-semibold shadow-lg"
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
          icon={<EyeIcon className="h-6 w-6 text-white" />}
          gradient="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Unique Visitors"
          value={data.metrics.uniqueVisitors}
          change={data.comparison?.changes.visitors}
          icon={<UserGroupIcon className="h-6 w-6 text-white" />}
          gradient="from-green-500 to-emerald-600"
        />
        <MetricCard
          title="Total Sessions"
          value={data.metrics.totalSessions}
          change={data.comparison?.changes.sessions}
          icon={<CursorArrowRaysIcon className="h-6 w-6 text-white" />}
          gradient="from-purple-500 to-purple-600"
        />
        <MetricCard
          title="Conversion Rate"
          value={data.metrics.conversionRate}
          change={data.comparison?.changes.conversionRate}
          format="percentage"
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-white" />}
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Avg. Session Duration"
          value={data.metrics.avgSessionDuration}
          format="duration"
          icon={<ClockIcon className="h-6 w-6 text-primary-600" />}
        />
        <MetricCard
          title="Bounce Rate"
          value={data.metrics.bounceRate}
          format="percentage"
          icon={<ArrowPathRoundedSquareIcon className="h-6 w-6 text-primary-600" />}
        />
      </div>

      {/* Empty State */}
      {data.trends.length === 0 && data.topSources.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-600">
            Analytics data will appear here once visitors interact with your website.
          </p>
        </div>
      )}

      {/* Top Sources */}
      {data.topSources.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Traffic Sources</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topSources.map((source: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{source.source}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{source.sessions.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-primary-600">
                      {source.conversionRate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
