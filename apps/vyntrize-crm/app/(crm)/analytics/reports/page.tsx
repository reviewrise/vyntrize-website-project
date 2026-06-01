'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    fetchAllData();
  }, [dateRange, currentPage]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      const endDateStr = endDate.toISOString();

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: endDateStr,
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

  // Stagger variants for the bento grid items
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <ErrorMessage message={error} onRetry={fetchAllData} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Header Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-500 bg-clip-text text-transparent tracking-tight">
            Analytics Reports
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Deep dive into your funnel, traffic sources, and top performing pages.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-2">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
      </motion.div>

      {/* Loading State or Bento Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px] animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
              <div className="h-64 bg-gray-100 rounded-xl"></div>
            </div>
            <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px] animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-100 rounded-xl"></div>
                <div className="h-12 bg-gray-100 rounded-xl"></div>
                <div className="h-12 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
            <div className="lg:col-span-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px] animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
              <div className="h-64 bg-gray-100 rounded-xl"></div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Conversion Funnel Bento */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="lg:col-span-7 bg-white rounded-3xl shadow-xl shadow-primary-500/5 p-8 border border-gray-100 relative overflow-hidden group"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-3 bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl text-primary-600 shadow-sm border border-white">
                  <FunnelIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Conversion Funnel</h2>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Visitor drop-off analysis</p>
                </div>
              </div>

              <div className="relative z-10">
                {funnelData ? (
                  <FunnelChart
                    steps={funnelData.steps}
                    overallConversionRate={funnelData.overallConversionRate}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400 font-medium">No funnel data</div>
                )}
              </div>
            </motion.div>

            {/* Top Pages Bento */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="lg:col-span-5 bg-white rounded-3xl shadow-xl shadow-primary-500/5 p-8 border border-gray-100 flex flex-col relative overflow-hidden group"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-100/40 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl text-indigo-600 shadow-sm border border-white">
                    <DocumentChartBarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Top Pages</h2>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Most viewed content</p>
                  </div>
                </div>
                <ExportButton onExport={handleExportPages} />
              </div>

              <div className="flex-1 relative z-10">
                {pagesData ? (
                  <TopPagesTable
                    pages={pagesData.pages}
                    pagination={pagesData.pagination}
                    onPageChange={setCurrentPage}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 font-medium">No page data</div>
                )}
              </div>
            </motion.div>

            {/* Traffic Sources Bento */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="lg:col-span-12 bg-white rounded-3xl shadow-xl shadow-primary-500/5 p-8 border border-gray-100 relative overflow-hidden group"
            >
               <div className="absolute top-1/2 left-1/2 w-full h-64 bg-gradient-to-r from-primary-50/50 via-transparent to-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl text-blue-600 shadow-sm border border-white">
                    <ArrowTrendingUpIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Traffic Sources</h2>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Where your users come from</p>
                  </div>
                </div>
                <ExportButton onExport={handleExportSources} />
              </div>

              <div className="relative z-10">
                {sourcesData ? (
                  <SourcesTable sources={sourcesData.sources} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400 font-medium">No sources data</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
