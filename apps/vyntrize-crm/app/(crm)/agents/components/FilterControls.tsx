'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { FilterState, AgentType, ActionStatus } from '@/types/agent-dashboard';
import { AGENT_TYPES, ACTION_STATUSES } from '@/types/agent-dashboard';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export function FilterControls({ filters, onFilterChange }: FilterControlsProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  const activeFilterCount = [
    filters.agentType !== 'all',
    filters.status !== 'all',
    filters.search,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput('');
    onFilterChange({
      agentType: 'all',
      status: 'all',
      search: '',
      startDate: null,
      endDate: null,
      page: 1,
    });
  };

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: 'var(--color-primary)' }}
          >
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Agent Type
          </label>
          <select
            value={filters.agentType}
            onChange={(e) => onFilterChange({ agentType: e.target.value as any, page: 1 })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-raised)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="all">All Types</option>
            {AGENT_TYPES.map((type) => (
              <option key={type} value={type}>{formatAgentType(type)}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as any, page: 1 })}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-raised)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="all">All Statuses</option>
            {ACTION_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by lead name or company..."
              className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-raised)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatAgentType(type: string): string {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}
