'use client';

import { useState, useEffect } from 'react';
import {
  EyeIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
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
  trends: Array<any>;
  topSources: Array<any>;
  topPages: Array<any>;
}

// Simple inline metric card to avoid import issues
function SimpleMetricCard({ title, value, icon, gradient }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white rounded-xl shadow-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}&granularity=day&includeComparison=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
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
      <div className="p-8">
        <div className="animate-pulse space-y-4">
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
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Track website performance and visitor behavior
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimpleMetricCard
          title="Page Views"
          value={data.metrics.totalPageViews.toLocaleString()}
          icon={<EyeIcon className="h-6 w-6 text-white" />}
          gradient="from-blue-500 to-blue-600"
        />
        <SimpleMetricCard
          title="Unique Visitors"
          value={data.metrics.uniqueVisitors.toLocaleString()}
          icon={<UserGroupIcon className="h-6 w-6 text-white" />}
          gradient="from-green-500 to-emerald-600"
        />
        <SimpleMetricCard
          title="Total Sessions"
          value={data.metrics.totalSessions.toLocaleString()}
          icon={<CursorArrowRaysIcon className="h-6 w-6 text-white" />}
          gradient="from-purple-500 to-purple-600"
        />
        <SimpleMetricCard
          title="Conversion Rate"
          value={`${data.metrics.conversionRate.toFixed(2)}%`}
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-white" />}
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Empty State Message */}
      {data.trends.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <EyeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-600">
            Analytics data will appear here once visitors interact with your website.
          </p>
        </div>
      )}
    </div>
  );
}
