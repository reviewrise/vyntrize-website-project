 'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StageProgressionTab } from './components/StageProgressionTab';
import { DripSequencesTab } from './components/DripSequencesTab';
import { WorkflowRulesTab } from './components/WorkflowRulesTab';

type Tab = 'stage-progression' | 'drip-sequences' | 'workflow-rules';

interface Summary {
  activeEnrollments: number;
  pendingApprovals: number;
  rulesFiredLast24h: number;
  emailsSentLast24h: number;
}

function AutomationPageHeader() {
  const [summary, setSummary] = useState<Summary | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/automation/summary');
      if (res.ok) setSummary(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Pipeline Automation
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Configure stage progression rules, drip sequences, and workflow automations.
        </p>
      </div>

      {summary && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Active enrollments', value: summary.activeEnrollments, color: '#6366f1' },
            { label: 'Pending approvals', value: summary.pendingApprovals, color: '#f59e0b' },
            { label: 'Rules fired (24h)', value: summary.rulesFiredLast24h, color: '#10b981' },
            { label: 'Emails sent (24h)', value: summary.emailsSentLast24h, color: '#06b6d4' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-2.5 text-center"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                minWidth: '110px',
              }}
            >
              <p className="text-xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'stage-progression', label: '📈 Stage Progression' },
  { id: 'drip-sequences', label: '✉️ Drip Sequences' },
  { id: 'workflow-rules', label: '⚡ Workflow Rules' },
];

export function PipelineAutomationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get('tab') as Tab) || 'stage-progression';

  const setTab = (tab: Tab) => {
    router.push(`/settings/pipeline/automation?tab=${tab}`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <AutomationPageHeader />

      {/* Tab navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit mb-8"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              activeTab === tab.id
                ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                : { color: 'var(--color-text-muted)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'stage-progression' && <StageProgressionTab />}
      {activeTab === 'drip-sequences' && <DripSequencesTab />}
      {activeTab === 'workflow-rules' && <WorkflowRulesTab />}
    </div>
  );
}
