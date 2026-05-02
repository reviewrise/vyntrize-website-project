'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MetricCard from '@/components/MetricCard';
import TrendChart from '@/components/TrendChart';
import DateRangeSelector, { DateRange } from '@/components/DateRangeSelector';
import ErrorMessage from '@/components/ErrorMessage';
import {
  EyeIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ArrowPathRoundedSquareIcon,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function WebsiteAnalyticsPage() {
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

      const response = await fetch(`/api/analytics/website/dashboard?${params}`);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Date Range Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center max-w-md">
          <EyeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600 mb-6">
            There's no analytics data available for the selected date range. Analytics data will appear here once visitors interact with vyntrize.com.
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Website Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track vyntrize.com performance and visitor behavior
          </p>
        </div>
        <motion.a
          href="/website/analytics/reports"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          View Detailed Reports
        </motion.a>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <div>
            <label htmlFor="granularity" className="block text-sm font-medium text-gray-700 mb-2">
              Granularity
            </label>
            <select
              id="granularity"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as any)}
              className="block w-full md:w-40 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Primary Metric Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Page Views"
            value={data.metrics.totalPageViews}
            change={data.comparison?.changes.pageViews}
            changeLabel="vs previous period"
            icon={<EyeIcon className="h-6 w-6 text-white" />}
            gradient="from-blue-500 to-blue-600"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Unique Visitors"
            value={data.metrics.uniqueVisitors}
            change={data.comparison?.changes.visitors}
            changeLabel="vs previous period"
            icon={<UserGroupIcon className="h-6 w-6 text-white" />}
            gradient="from-green-500 to-emerald-600"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Total Sessions"
            value={data.metrics.totalSessions}
            change={data.comparison?.changes.sessions}
            changeLabel="vs previous period"
            icon={<CursorArrowRaysIcon className="h-6 w-6 text-white" />}
            gradient="from-purple-500 to-purple-600"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Conversion Rate"
            value={data.metrics.conversionRate}
            change={data.comparison?.changes.conversionRate}
            changeLabel="vs previous period"
            format="percentage"
            icon={<ArrowTrendingUpIcon className="h-6 w-6 text-white" />}
            gradient="from-orange-500 to-orange-600"
          />
        </motion.div>
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Avg. Session Duration"
            value={data.metrics.avgSessionDuration}
            format="duration"
            icon={<ClockIcon className="h-6 w-6 text-primary-600" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Bounce Rate"
            value={data.metrics.bounceRate}
            format="percentage"
            icon={<ArrowPathRoundedSquareIcon className="h-6 w-6 text-primary-600" />}
          />
        </motion.div>
      </motion.div>

      {/* Trend Chart */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Traffic Trends</h2>
        <TrendChart data={data.trends} type="area" />
      </motion.div>

      {/* Top Sources and Top Pages */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top Sources */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Traffic Sources</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Conv. Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topSources.map((source, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-primary-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {source.source}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {source.sessions.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                      {source.conversionRate.toFixed(2)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top Pages */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Pages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topPages.map((page, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-primary-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-4 text-sm text-gray-900 truncate max-w-xs">
                      {page.url}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                      {page.views.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
