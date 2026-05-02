'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon } from '@heroicons/react/24/outline';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presetRanges: DateRange[] = [
  {
    label: 'Today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    label: 'Yesterday',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    label: 'Last 7 days',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    label: 'Last 30 days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    label: 'Last 90 days',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    label: 'This month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    label: 'Last month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
      .toISOString()
      .split('T')[0],
  },
];

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    if (selectedLabel === 'custom') {
      setIsCustom(true);
      return;
    }

    const preset = presetRanges.find((r) => r.label === selectedLabel);
    if (preset) {
      onChange(preset);
      setIsCustom(false);
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
      label: 'Custom',
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4">
      <div className="flex-1">
        <label htmlFor="dateRange" className="block text-sm font-semibold text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary-600" />
            Date Range
          </div>
        </label>
        <select
          id="dateRange"
          value={isCustom ? 'custom' : value.label}
          onChange={handlePresetChange}
          className="block w-full md:w-56 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-medium transition-all duration-200 hover:border-primary-400"
        >
          {presetRanges.map((range) => (
            <option key={range.label} value={range.label}>
              {range.label}
            </option>
          ))}
          <option value="custom">Custom Range</option>
        </select>
      </div>

      <AnimatePresence>
        {isCustom && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col md:flex-row gap-4"
          >
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={value.startDate}
                onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                className="block w-full md:w-44 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm transition-all duration-200 hover:border-primary-400"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={value.endDate}
                onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                className="block w-full md:w-44 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm transition-all duration-200 hover:border-primary-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
