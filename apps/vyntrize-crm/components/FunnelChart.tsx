'use client';

import { FunnelIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface FunnelStep {
  name: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  overallConversionRate: number;
}

export default function FunnelChart({ steps, overallConversionRate }: FunnelChartProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-12">
        <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No funnel data available</p>
      </div>
    );
  }

  const maxCount = steps[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Overall Conversion Rate */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Overall Conversion Rate</p>
            <p className="text-xs text-blue-700 mt-1">
              From first visit to final conversion
            </p>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {overallConversionRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Funnel Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const widthPercentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const isFirst = index === 0;

          return (
            <div key={index} className="space-y-2">
              {/* Step Bar */}
              <div className="relative">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 shadow-md transition-all hover:shadow-lg"
                  style={{
                    width: `${Math.max(widthPercentage, 20)}%`,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="font-semibold">{step.name}</p>
                      <p className="text-sm opacity-90 mt-1">
                        {step.count.toLocaleString()} visitors
                      </p>
                    </div>
                    {!isFirst && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{step.conversionRate.toFixed(1)}%</p>
                        <p className="text-xs opacity-90">conversion</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drop-off indicator */}
              {!isFirst && step.dropOffRate > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                  <ArrowDownIcon className="h-4 w-4" />
                  <span className="font-medium">{step.dropOffRate.toFixed(1)}% drop-off</span>
                  <span className="text-gray-500">
                    ({(steps[index - 1].count - step.count).toLocaleString()} visitors lost)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {steps[0]?.count.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">Total Visitors</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {steps[steps.length - 1]?.count.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">Conversions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {steps.length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Funnel Steps</p>
        </div>
      </div>
    </div>
  );
}
