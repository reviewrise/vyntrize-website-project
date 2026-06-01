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

const stepColors = [
  { bar: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-200' },
  { bar: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200' },
  { bar: '#a855f7', bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-200' },
  { bar: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-600', ring: 'ring-pink-200' },
  { bar: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-200' },
];

export default function FunnelChart({ steps, overallConversionRate }: FunnelChartProps) {
  if (!steps || steps.length === 0) {
    return (
      <EmptyState
        title="No funnel data available"
        message="Start tracking visitor behavior to see your conversion funnel"
        icon={<FunnelIcon className="h-8 w-8 text-gray-300" />}
      />
    );
  }

  const maxCount = steps[0]?.count || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Visitors', value: steps[0]?.count?.toLocaleString() ?? '0', color: 'text-indigo-600' },
          { label: 'Conversions', value: steps[steps.length - 1]?.count?.toLocaleString() ?? '0', color: 'text-emerald-600' },
          { label: 'Overall Rate', value: `${overallConversionRate.toFixed(2)}%`, color: 'text-primary-600' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Funnel rows */}
      <div className="space-y-3 pt-2">
        {steps.map((step, index) => {
          const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const color = stepColors[index % stepColors.length];
          const prevStep = steps[index - 1];
          const lost = prevStep ? prevStep.count - step.count : 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className="space-y-2"
            >
              {/* Drop-off connector */}
              {index > 0 && lost > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="flex items-center gap-2 pl-2"
                >
                  <ArrowDownIcon className="h-3.5 w-3.5 text-gray-300" />
                  <span className="text-[11px] font-medium text-gray-400">
                    {step.dropOffRate.toFixed(1)}% drop-off
                    <span className="text-gray-300 mx-1.5">·</span>
                    {lost.toLocaleString()} lost
                  </span>
                </motion.div>
              )}

              {/* Bar row */}
              <div className="flex items-center gap-4">
                {/* Step number */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ${color.ring} ${color.bg} ${color.text}`}>
                  {index + 1}
                </div>

                {/* Label + bar */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{step.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{step.count.toLocaleString()}</span>
                      {index > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                          {step.conversionRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color.bar }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 2)}%` }}
                      transition={{ delay: 0.25 + index * 0.1, duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
