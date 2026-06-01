'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Page {
  url: string;
  title: string;
  views: number;
  sessions: number;
  bounceRate?: number;
}

interface TopPagesTableProps {
  pages: Page[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

export default function TopPagesTable({ pages, pagination, onPageChange }: TopPagesTableProps) {
  const [filter, setFilter] = useState('');

  const filtered = pages.filter(
    (p) =>
      p.url.toLowerCase().includes(filter.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(filter.toLowerCase())
  );

  const maxViews = filtered[0]?.views || 1;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter pages..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
        />
      </div>

      {/* Page list */}
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No pages found</div>
        ) : (
          filtered.map((page, i) => {
            const pct = (page.views / maxViews) * 100;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <span className="text-xs font-bold text-gray-300 w-5 shrink-0 text-center">
                  {i + 1}
                </span>

                {/* URL + bar */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {page.url}
                  </p>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-300 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Views */}
                <div className="flex items-center gap-1 text-xs font-bold text-gray-600 shrink-0">
                  <EyeIcon className="h-3 w-3 text-gray-400" />
                  {page.views.toLocaleString()}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && onPageChange && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
