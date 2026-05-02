'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'duration';
  gradient?: string;
  sparklineData?: number[];
  loading?: boolean;
}

function AnimatedNumber({ value, format }: { value: number; format: string }) {
  const spring = useSpring(0, { duration: 1000 });
  const display = useTransform(spring, (current) => {
    switch (format) {
      case 'percentage':
        return `${current.toFixed(2)}%`;
      case 'duration':
        const minutes = Math.floor(current / 60);
        const seconds = Math.floor(current % 60);
        return `${minutes}m ${seconds}s`;
      case 'number':
      default:
        return Math.floor(current).toLocaleString();
    }
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-full h-8 mt-2" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-white/50"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
    </svg>
  );
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  format = 'number',
  gradient,
  sparklineData,
  loading = false,
}: MetricCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          {icon && <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>}
        </div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  const cardClasses = gradient
    ? `bg-gradient-to-br ${gradient} text-white`
    : 'bg-white text-gray-900';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`${cardClasses} rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 relative overflow-hidden`}
    >
      {/* Background decoration */}
      {gradient && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      )}

      <div className="relative z-10">
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

        <div className="mb-2">
          {mounted && typeof value === 'number' ? (
            <p className="text-3xl font-bold">
              <AnimatedNumber value={value} format={format} />
            </p>
          ) : (
            <p className="text-3xl font-bold">{formatValue(value)}</p>
          )}
        </div>

        {change !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center text-sm"
          >
            {isPositive && (
              <>
                <ArrowUpIcon className={`h-4 w-4 mr-1 ${gradient ? 'text-white' : 'text-green-500'}`} />
                <span className={`font-medium ${gradient ? 'text-white' : 'text-green-600'}`}>
                  +{Math.abs(change).toFixed(1)}%
                </span>
              </>
            )}
            {isNegative && (
              <>
                <ArrowDownIcon className={`h-4 w-4 mr-1 ${gradient ? 'text-white' : 'text-red-500'}`} />
                <span className={`font-medium ${gradient ? 'text-white' : 'text-red-600'}`}>
                  {change.toFixed(1)}%
                </span>
              </>
            )}
            {change === 0 && (
              <span className={`font-medium ${gradient ? 'text-white/80' : 'text-gray-500'}`}>
                0%
              </span>
            )}
            {changeLabel && (
              <span className={`ml-1 ${gradient ? 'text-white/70' : 'text-gray-500'}`}>
                {changeLabel}
              </span>
            )}
          </motion.div>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} />
        )}
      </div>
    </motion.div>
  );
}
