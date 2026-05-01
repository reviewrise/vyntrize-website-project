'use client';

import { useState } from 'react';

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

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onChange({
      ...value,
      [field]: value,
      label: 'Custom',
    } as DateRange);
  };

  return (
    <div className="flex items-center gap-4">
      <div>
        <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
          Date Range
        </label>
        <select
          id="dateRange"
          value={isCustom ? 'custom' : value.label}
          onChange={handlePresetChange}
          className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {presetRanges.map((range) => (
            <option key={range.label} value={range.label}>
              {range.label}
            </option>
          ))}
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {isCustom && (
        <>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={value.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={value.endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
