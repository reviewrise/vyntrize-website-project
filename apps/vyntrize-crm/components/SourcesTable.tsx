'use client';

import { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface Source {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
}

interface SourcesTableProps {
  sources: Source[];
  onExport?: () => void;
}

type SortField = 'source' | 'sessions' | 'conversions' | 'conversionRate';
type SortDirection = 'asc' | 'desc';

export default function SourcesTable({ sources, onExport }: SourcesTableProps) {
  const [sortField, setSortField] = useState<SortField>('sessions');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-blue-600" />
    );
  };

  // Filter sources
  const filteredSources = sources.filter(
    (source) =>
      source.source.toLowerCase().includes(filter.toLowerCase()) ||
      source.medium.toLowerCase().includes(filter.toLowerCase()) ||
      source.campaign.toLowerCase().includes(filter.toLowerCase())
  );

  // Sort sources
  const sortedSources = [...filteredSources].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Header with filter and export */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Filter by source, medium, or campaign..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-80 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('source')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Source
                  <SortIcon field="source" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medium
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th
                onClick={() => handleSort('sessions')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Sessions
                  <SortIcon field="sessions" />
                </div>
              </th>
              <th
                onClick={() => handleSort('conversions')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Conversions
                  <SortIcon field="conversions" />
                </div>
              </th>
              <th
                onClick={() => handleSort('conversionRate')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  Conv. Rate
                  <SortIcon field="conversionRate" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSources.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No sources found
                </td>
              </tr>
            ) : (
              sortedSources.map((source, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {source.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.medium}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.campaign}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {source.sessions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {source.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        source.conversionRate >= 5
                          ? 'bg-green-100 text-green-800'
                          : source.conversionRate >= 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {source.conversionRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {sortedSources.length} of {sources.length} sources
      </div>
    </div>
  );
}
