'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import DateRangeSelector, { DateRange } from '@/components/DateRangeSelector';
import FunnelChart from '@/components/FunnelChart';
import SourcesTable from '@/components/SourcesTable';
import TopPagesTable from '@/components/TopPagesTable';
import ExportButton from '@/components/ExportButton';
import ErrorMessage from '@/components/ErrorMessage';
import { CSVExporter } from '@/lib/export/csv-exporter';
import { 
  FunnelIcon, 
  ArrowTrendingUpIcon, 
  DocumentChartBarIcon 
} from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const tabIcons = [
  <FunnelIcon key="funnel" className="h-5 w-5" />,
  <ArrowTrendingUpIcon key="sources" className="h-5 w-5" />,
  <DocumentChartBarIcon key="pages" className="h-5 w-5" />,
];

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
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [dateRange, currentPage]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
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

      if (!funnelRes.ok || !sourcesRes.ok || !pagesRes.ok) {
        throw new Error('Failed to fetch reports data');
      }

      const [funnel, sources, pages] = await Promise.all([
        funnelRes.json(),
        sourcesRes.json(),
        pagesRes.json(),
      ]);

      setFunnelData(funnel);
      setSourcesData(sources);
      setPagesData(pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Date Range Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ErrorMessage message={error} onRetry={fetchAllData} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Analytics Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Detailed reports on conversion funnel, traffic sources, and page performance
          </p>
        </div>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-2 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 p-2">
            {['Conversion Funnel', 'Traffic Sources', 'Top Pages'].map((label, index) => (
              <Tab
                key={label}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-3 px-4 text-sm font-semibold leading-5 transition-all duration-200',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2',
                    'flex items-center justify-center gap-2',
                    selected
                      ? 'bg-white text-primary-700 shadow-lg scale-105'
                      : 'text-primary-600 hover:bg-white/50 hover:text-primary-800'
                  )
                }
              >
                {tabIcons[index]}
                {label}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            <AnimatePresence mode="wait">
              {/* Funnel Panel */}
              <Tab.Panel
                as={motion.div}
                key="funnel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>
                {funnelData && (
                  <FunnelChart
                    steps={funnelData.steps}
                    overallConversionRate={funnelData.overallConversionRate}
                  />
                )}
              </Tab.Panel>

              {/* Sources Panel */}
              <Tab.Panel
                as={motion.div}
                key="sources"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Traffic Sources</h2>
                  <ExportButton onExport={handleExportSources} />
                </div>
                {sourcesData && <SourcesTable sources={sourcesData.sources} />}
              </Tab.Panel>

              {/* Pages Panel */}
              <Tab.Panel
                as={motion.div}
                key="pages"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Top Pages</h2>
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
            </AnimatePresence>
          </Tab.Panels>
        </Tab.Group>
      </motion.div>
    </motion.div>
  );
}
