'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import TrendChart from '@/components/TrendChart';
import DateRangeSelector, { DateRange } from '@/components/DateRangeSelector';
import {
  ChartBarIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
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
  trends: Array<{
    date: string;
    sessions: number;
    pageViews: number;
    conversions: number;
  }>;
  topSources: Array<{
    source: string;
    sessions: number;
    conversions: number;
    conversionRate: number;
  }>;
  topPages: Array<{
    url: string;
    views: number;
    avgDuration: number;
  }>;
  comparison?: {
    current: any;
    previous: any;
    changes: {
      sessions: number;
      pageViews: number;
      visitors: number;
      conversionRate: number;
    };
  };
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    label: 'Last 30 days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [granularity, setGranularity] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, granularity]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        granularity,
        includeComparison: 'true',
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track website performance and visitor behavior
          </p>
        </div>
        <a
          href="/analytics/reports"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          View Detailed Reports
        </a>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <div>
            <label htmlFor="granularity" className="block text-sm font-medium text-gray-700 mb-1">
              Granularity
            </label>
            <select
              id="granularity"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as any)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={data.metrics.totalSessions}
          change={data.comparison?.changes.sessions}
          changeLabel="vs previous period"
          icon={<ChartBarIcon className="h-6 w-6 text-blue-600" />}
        />
        <MetricCard
          title="Page Views"
          value={data.metrics.totalPageViews}
          change={data.comparison?.changes.pageViews}
          changeLabel="vs previous period"
          icon={<EyeIcon className="h-6 w-6 text-green-600" />}
        />
        <MetricCard
          title="Unique Visitors"
          value={data.metrics.uniqueVisitors}
          change={data.comparison?.changes.visitors}
          changeLabel="vs previous period"
          icon={<UserGroupIcon className="h-6 w-6 text-purple-600" />}
        />
        <MetricCard
          title="Conversion Rate"
          value={data.metrics.conversionRate}
          change={data.comparison?.changes.conversionRate}
          changeLabel="vs previous period"
          format="percentage"
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-orange-600" />}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Avg. Session Duration"
          value={data.metrics.avgSessionDuration}
          format="duration"
        />
        <MetricCard
          title="Bounce Rate"
          value={data.metrics.bounceRate}
          format="percentage"
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Trends</h2>
        <TrendChart data={data.trends} type="line" />
      </div>

      {/* Top Sources and Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Traffic Sources</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conv. Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topSources.map((source, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {source.source}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {source.sessions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {source.conversions}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {source.conversionRate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topPages.map((page, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-xs">
                      {page.url}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {page.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
