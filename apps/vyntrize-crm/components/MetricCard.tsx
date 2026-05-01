'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'duration';
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  format = 'number',
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'duration':
        const minutes = Math.floor(val / 60);
        const seconds = val % 60;
        return `${minutes}m ${seconds}s`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center text-sm">
              {isPositive && (
                <>
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">
                    +{Math.abs(change).toFixed(1)}%
                  </span>
                </>
              )}
              {isNegative && (
                <>
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">
                    {change.toFixed(1)}%
                  </span>
                </>
              )}
              {change === 0 && (
                <span className="text-gray-500 font-medium">0%</span>
              )}
              {changeLabel && (
                <span className="text-gray-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
