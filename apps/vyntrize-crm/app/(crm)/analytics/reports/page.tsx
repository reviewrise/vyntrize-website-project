'use client';

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import DateRangeSelector, { DateRange } from '@/components/DateRangeSelector';
import FunnelChart from '@/components/FunnelChart';
import SourcesTable from '@/components/SourcesTable';
import TopPagesTable from '@/components/TopPagesTable';
import ExportButton from '@/components/ExportButton';
import { CSVExporter } from '@/lib/export/csv-exporter';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AnalyticsReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    label: 'Last 30 days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [funnelData, setFunnelData] = useState<any>(null);
  const [sourcesData, setSourcesData] = useState<any>(null);
  const [pagesData, setPagesData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [dateRange, currentPage]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const [funnelRes, sourcesRes, pagesRes] = await Promise.all([
        fetch(`/api/analytics/funnel?${params}`),
        fetch(`/api/analytics/sources?${params}`),
        fetch(`/api/analytics/pages?${params}&page=${currentPage}`),
      ]);

      const [funnel, sources, pages] = await Promise.all([
        funnelRes.json(),
        sourcesRes.json(),
        pagesRes.json(),
      ]);

      setFunnelData(funnel);
      setSourcesData(sources);
      setPagesData(pages);
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSources = () => {
    if (!sourcesData?.sources) return;

    CSVExporter.exportAndDownload(
      sourcesData.sources,
      `traffic-sources-${dateRange.startDate}-to-${dateRange.endDate}.csv`,
      [
        { key: 'source', label: 'Source' },
        { key: 'medium', label: 'Medium' },
        { key: 'campaign', label: 'Campaign' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'conversions', label: 'Conversions' },
        { key: 'conversionRate', label: 'Conversion Rate (%)' },
      ]
    );
  };

  const handleExportPages = () => {
    if (!pagesData?.pages) return;

    CSVExporter.exportAndDownload(
      pagesData.pages,
      `top-pages-${dateRange.startDate}-to-${dateRange.endDate}.csv`,
      [
        { key: 'url', label: 'URL' },
        { key: 'title', label: 'Title' },
        { key: 'views', label: 'Views' },
        { key: 'sessions', label: 'Sessions' },
      ]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Detailed reports on conversion funnel, traffic sources, and page performance
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
              )
            }
          >
            Conversion Funnel
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
              )
            }
          >
            Traffic Sources
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
              )
            }
          >
            Top Pages
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-6">
          {/* Funnel Panel */}
          <Tab.Panel className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h2>
            {funnelData && (
              <FunnelChart
                steps={funnelData.steps}
                overallConversionRate={funnelData.overallConversionRate}
              />
            )}
          </Tab.Panel>

          {/* Sources Panel */}
          <Tab.Panel className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Traffic Sources</h2>
              <ExportButton onExport={handleExportSources} />
            </div>
            {sourcesData && <SourcesTable sources={sourcesData.sources} />}
          </Tab.Panel>

          {/* Pages Panel */}
          <Tab.Panel className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Pages</h2>
              <ExportButton onExport={handleExportPages} />
            </div>
            {pagesData && (
              <TopPagesTable
                pages={pagesData.pages}
                pagination={pagesData.pagination}
                onPageChange={setCurrentPage}
              />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
