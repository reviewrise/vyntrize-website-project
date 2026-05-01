'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExportButtonProps {
  onExport: () => Promise<void> | void;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export default function ExportButton({
  onExport,
  label = 'Export CSV',
  variant = 'secondary',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const baseClasses =
    'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          Exporting...
        </>
      ) : (
        <>
          <ArrowDownTrayIcon className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
