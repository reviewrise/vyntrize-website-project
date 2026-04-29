'use client';

import { useState } from 'react';
import { runImport, ImportSummary } from '@/lib/actions/import';
import { Download, CheckCircle2, AlertCircle } from 'lucide-react';

export function ImportRunner() {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        setLoading(true);
        setError(null);
        setSummary(null);

        const result = await runImport();

        if (result.success && result.summary) {
            setSummary(result.summary);
        } else {
            setError(result.error ?? 'Import failed.');
        }

        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    This will read all unimported contact form submissions from the website and create CRM Contacts and Leads.
                    Submissions that have already been imported will be skipped automatically.
                </p>

                <button
                    onClick={handleImport}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    <Download className="h-4 w-4" />
                    {loading ? 'Importing...' : 'Run Import'}
                </button>
            </div>

            {error && (
                <div className="rounded-2xl p-5 flex items-start gap-3" style={{ backgroundColor: '#7f1d1d20', border: '1px solid #7f1d1d' }}>
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {summary && (
                <div
                    className="rounded-2xl p-6"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Import Complete
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}>
                            <p className="text-2xl font-extrabold text-emerald-400">{summary.contactsCreated}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Contacts Created</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}>
                            <p className="text-2xl font-extrabold" style={{ color: 'var(--color-primary)' }}>{summary.leadsCreated}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Leads Created</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}>
                            <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text-muted)' }}>{summary.skipped}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Skipped (duplicates)</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}>
                            <p className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>{summary.total}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Total Processed</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
