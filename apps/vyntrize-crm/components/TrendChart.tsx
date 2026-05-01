'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    sessions: number;
    pageViews: number;
    conversions: number;
  }>;
  type?: 'line' | 'bar';
  metrics?: ('sessions' | 'pageViews' | 'conversions')[];
}

export default function TrendChart({
  data,
  type = 'line',
  metrics = ['sessions', 'pageViews', 'conversions'],
}: TrendChartProps) {
  const metricConfig = {
    sessions: { color: '#3b82f6', label: 'Sessions' },
    pageViews: { color: '#10b981', label: 'Page Views' },
    conversions: { color: '#f59e0b', label: 'Conversions' },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formattedData = data.map((item) => ({
    ...item,
    date: formatDate(item.date),
  }));

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {metrics.map((metric) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={metricConfig[metric].color}
              name={metricConfig[metric].label}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {metrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={metricConfig[metric].color}
            name={metricConfig[metric].label}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
