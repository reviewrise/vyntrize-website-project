'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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

const sourceIcons: Record<string, string> = {
  google: '🔍',
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  instagram: '📸',
  direct: '🔗',
  email: '✉️',
  referral: '🌐',
};

function getSourceIcon(source: string) {
  const key = source.toLowerCase();
  for (const [name, icon] of Object.entries(sourceIcons)) {
    if (key.includes(name)) return icon;
  }
  return '🌐';
}

function getRateColor(rate: number) {
  if (rate >= 5) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  if (rate >= 2) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  return 'bg-gray-50 text-gray-500 ring-1 ring-gray-200';
}

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

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return sortDirection === 'asc'
      ? <ArrowUpIcon className="h-3 w-3 text-indigo-500 inline ml-1" />
      : <ArrowDownIcon className="h-3 w-3 text-indigo-500 inline ml-1" />;
  };

  const filtered = sources.filter(
    (s) =>
      s.source.toLowerCase().includes(filter.toLowerCase()) ||
      s.medium.toLowerCase().includes(filter.toLowerCase()) ||
      s.campaign.toLowerCase().includes(filter.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number = a[sortField];
    let bVal: string | number = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const maxSessions = sorted[0]?.sessions || 1;

  const thClass = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors';

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter sources..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className={thClass} onClick={() => handleSort('source')}>
                Source <SortIndicator field="source" />
              </th>
              <th className={`${thClass} hidden md:table-cell`}>Medium</th>
              <th className={thClass} onClick={() => handleSort('sessions')}>
                Sessions <SortIndicator field="sessions" />
              </th>
              <th className={thClass} onClick={() => handleSort('conversions')}>
                Conv. <SortIndicator field="conversions" />
              </th>
              <th className={thClass} onClick={() => handleSort('conversionRate')}>
                Rate <SortIndicator field="conversionRate" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No sources data available
                </td>
              </tr>
            ) : (
              sorted.map((source, i) => {
                const pct = (source.sessions / maxSessions) * 100;
                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="group hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Source */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{getSourceIcon(source.source)}</span>
                        <span className="text-sm font-semibold text-gray-800">{source.source}</span>
                      </div>
                    </td>
                    {/* Medium */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {source.medium ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                          {source.medium}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    {/* Sessions with mini-bar */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-gray-900">{source.sessions.toLocaleString()}</span>
                        <div className="h-1 bg-gray-100 rounded-full w-20 overflow-hidden">
                          <motion.div
                            className="h-full bg-indigo-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </td>
                    {/* Conversions */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-700">{source.conversions.toLocaleString()}</span>
                    </td>
                    {/* Rate badge */}
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getRateColor(source.conversionRate)}`}>
                        {source.conversionRate.toFixed(2)}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-gray-400 pl-1">
          {sorted.length} of {sources.length} sources
        </p>
      )}
    </div>
  );
}
