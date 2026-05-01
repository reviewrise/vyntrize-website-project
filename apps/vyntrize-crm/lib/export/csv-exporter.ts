// CSV Export Utility

export class CSVExporter {
  /**
   * Convert array of objects to CSV string
   */
  static toCSV<T extends Record<string, any>>(
    data: T[],
    columns?: { key: keyof T; label: string }[]
  ): string {
    if (data.length === 0) {
      return '';
    }

    // If columns not specified, use all keys from first object
    const cols =
      columns ||
      Object.keys(data[0]).map((key) => ({
        key: key as keyof T,
        label: key,
      }));

    // Create header row
    const header = cols.map((col) => this.escapeCSVValue(col.label)).join(',');

    // Create data rows
    const rows = data.map((row) =>
      cols
        .map((col) => {
          const value = row[col.key];
          return this.escapeCSVValue(value);
        })
        .join(',')
    );

    return [header, ...rows].join('\n');
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Download CSV file
   */
  static download(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Export data to CSV and download
   */
  static exportAndDownload<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
  ): void {
    const csv = this.toCSV(data, columns);
    this.download(csv, filename);
  }
}
