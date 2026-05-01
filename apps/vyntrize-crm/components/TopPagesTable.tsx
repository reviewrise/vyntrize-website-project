'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Page {
  url: string;
  title: string;
  views: number;
  sessions: number;
  bounceRate: number;
}

interface TopPagesTableProps {
  pages: Page[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function TopPagesTable({ pages, pagination, onPageChange }: TopPagesTableProps) {
  const [filter, setFilter] = useState('');

  // Filter pages
  const filteredPages = pages.filter(
    (page) =>
      page.url.toLowerCase().includes(filter.toLowerCase()) ||
      page.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div>
        <input
          type="text"
          placeholder="Filter by URL or title..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sessions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                  No pages found
                </td>
              </tr>
            ) : (
              filteredPages.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900 truncate">{page.title}</p>
                      <p className="text-gray-500 truncate text-xs mt-1">{page.url}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.sessions.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} pages
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
