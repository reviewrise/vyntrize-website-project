'use client';

import { motion } from 'framer-motion';
import { FunnelIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import EmptyState from './EmptyState';

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

const gradients = [
  'from-primary-500 to-primary-600',
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-orange-500 to-orange-600',
];

export default function FunnelChart({ steps, overallConversionRate }: FunnelChartProps) {
  if (steps.length === 0) {
    return (
      <EmptyState
        title="No funnel data available"
        message="Start tracking visitor behavior to see your conversion funnel"
        icon={<FunnelIcon className="h-8 w-8 text-gray-400" />}
      />
    );
  }

  const maxCount = steps[0]?.count || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Overall Conversion Rate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-primary-900">Overall Conversion Rate</p>
            <p className="text-sm text-primary-700 mt-1">
              From first visit to final conversion
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
          >
            {overallConversionRate.toFixed(2)}%
          </motion.div>
        </div>
      </motion.div>

      {/* Funnel Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const widthPercentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const isFirst = index === 0;
          const gradient = gradients[index % gradients.length];

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="space-y-3"
            >
              {/* Step Bar */}
              <div className="relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(widthPercentage, 20)}%` }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
                  className={`bg-gradient-to-r ${gradient} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 mx-auto relative overflow-hidden`}
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  
                  <div className="relative z-10 flex items-center justify-between text-white">
                    <div>
                      <p className="text-lg font-bold">{step.name}</p>
                      <p className="text-sm opacity-90 mt-2 flex items-center gap-2">
                        <span className="text-2xl font-semibold">{step.count.toLocaleString()}</span>
                        <span>visitors</span>
                      </p>
                    </div>
                    {!isFirst && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1, type: 'spring' }}
                        className="text-right bg-white/20 rounded-lg px-4 py-3 backdrop-blur-sm"
                      >
                        <p className="text-3xl font-bold">{step.conversionRate.toFixed(1)}%</p>
                        <p className="text-xs opacity-90 mt-1">conversion rate</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Drop-off indicator */}
              {!isFirst && step.dropOffRate > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-center gap-3 text-sm"
                >
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
                    <ArrowDownIcon className="h-4 w-4" />
                    <span className="font-semibold">{step.dropOffRate.toFixed(1)}% drop-off</span>
                  </div>
                  <span className="text-gray-600">
                    ({(steps[index - 1].count - step.count).toLocaleString()} visitors lost)
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-gray-200"
      >
        <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <p className="text-3xl font-bold text-blue-900">
            {steps[0]?.count.toLocaleString() || 0}
          </p>
          <p className="text-sm font-medium text-blue-700 mt-2">Total Visitors</p>
        </div>
        <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <p className="text-3xl font-bold text-green-900">
            {steps[steps.length - 1]?.count.toLocaleString() || 0}
          </p>
          <p className="text-sm font-medium text-green-700 mt-2">Conversions</p>
        </div>
        <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <p className="text-3xl font-bold text-purple-900">
            {steps.length}
          </p>
          <p className="text-sm font-medium text-purple-700 mt-2">Funnel Steps</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
