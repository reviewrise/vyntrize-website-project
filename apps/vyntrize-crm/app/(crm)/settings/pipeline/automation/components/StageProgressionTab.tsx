'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressionCriteria {
  minScore?: number;
  minEmailOpens?: number;
  minEmailClicks?: number;
  minCompletedTasks?: number;
  maxDaysInStage?: number;
}

interface StageProgressionRule {
  id: string;
  fromStage: string;
  toStage: string;
  criteria: ProgressionCriteria;
  autonomyLevel: string;
  isActive: boolean;
}

interface PendingAction {
  id: string;
  leadId: string;
  reasoning: string;
  metadata: Record<string, unknown>;
  lead?: { title?: string; contact?: { firstName: string; lastName: string } };
  createdAt: string;
}

// ─── Friendly labels ─────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New Lead',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL_SENT: 'Proposal Sent',
  WON: 'Won',
  LOST: 'Lost',
};

const STAGE_ICONS: Record<string, string> = {
  NEW: '🆕',
  CONTACTED: '📞',
  QUALIFIED: '✅',
  PROPOSAL_SENT: '📄',
  WON: '🏆',
  LOST: '❌',
};

function friendlyStage(stage: string): string {
  return STAGE_LABELS[stage] || stage;
}

// ─── CriteriaBuilder ─────────────────────────────────────────────────────────

function CriteriaBuilder({
  value,
  onChange,
}: {
  value: ProgressionCriteria;
  onChange: (c: ProgressionCriteria) => void;
}) {
  const fields: { key: keyof ProgressionCriteria; label: string; hint: string; placeholder: string }[] = [
    { key: 'minScore', label: 'Minimum lead score', hint: 'The lead must reach this score or higher', placeholder: 'e.g. 60' },
    { key: 'minEmailOpens', label: 'Minimum email opens', hint: 'How many emails must the lead have opened', placeholder: 'e.g. 2' },
    { key: 'minEmailClicks', label: 'Minimum link clicks', hint: 'How many email links must the lead have clicked', placeholder: 'e.g. 1' },
    { key: 'minCompletedTasks', label: 'Minimum completed tasks', hint: 'How many tasks must be done for this lead', placeholder: 'e.g. 1' },
    { key: 'maxDaysInStage', label: 'Maximum days in current stage', hint: 'Move automatically after this many days', placeholder: 'e.g. 14' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Requirements
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          All checked requirements must be met before the lead can progress.
        </p>
      </div>
      {fields.map(({ key, label, hint, placeholder }) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 flex-1">
              <input
                type="checkbox"
                checked={value[key] !== undefined}
                onChange={(e) => {
                  const next = { ...value };
                  if (e.target.checked) {
                    (next as Record<string, unknown>)[key] = 0;
                  } else {
                    delete next[key];
                  }
                  onChange(next);
                }}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
            </label>
            {value[key] !== undefined && (
              <input
                type="number"
                min={0}
                value={value[key] as number}
                onChange={(e) => onChange({ ...value, [key]: parseInt(e.target.value) || 0 })}
                placeholder={placeholder}
                className="w-24 px-2.5 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            )}
          </div>
          {value[key] !== undefined && (
            <p className="text-xs ml-6" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── StageProgressionRuleDrawer ───────────────────────────────────────────────

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

function StageProgressionRuleDrawer({
  rule,
  onClose,
  onSaved,
}: {
  rule: StageProgressionRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fromStage, setFromStage] = useState(rule?.fromStage ?? 'NEW');
  const [toStage, setToStage] = useState(rule?.toStage ?? 'CONTACTED');
  const [autonomyLevel, setAutonomyLevel] = useState(rule?.autonomyLevel ?? 'SUGGEST_APPROVE');
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [criteria, setCriteria] = useState<ProgressionCriteria>(rule?.criteria ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (fromStage === toStage) {
      setError('The starting and target stages must be different.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = rule
        ? `/api/automation/stage-progression/${rule.id}`
        : '/api/automation/stage-progression';
      const method = rule ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromStage, toStage, autonomyLevel, isActive, criteria }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ml-auto h-full w-full max-w-md overflow-y-auto p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {rule ? 'Edit Progression Rule' : 'New Progression Rule'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>✕</button>
        </div>

        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Define when a lead should automatically move from one pipeline stage to the next.
        </p>

        {error && (
          <p className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            {error}
          </p>
        )}

        <div className="space-y-4">
          {/* Stage selection with visual flow */}
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Stage Transition
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>When lead is in</label>
                <select
                  value={fromStage}
                  onChange={(e) => setFromStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  {STAGES.map((s) => <option key={s} value={s}>{STAGE_ICONS[s]} {friendlyStage(s)}</option>)}
                </select>
              </div>
              <span className="text-lg mt-4" style={{ color: 'var(--color-text-muted)' }}>→</span>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Move them to</label>
                <select
                  value={toStage}
                  onChange={(e) => setToStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  {STAGES.map((s) => <option key={s} value={s}>{STAGE_ICONS[s]} {friendlyStage(s)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              How should this run?
            </label>
            <select
              value={autonomyLevel}
              onChange={(e) => setAutonomyLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="SUGGEST_APPROVE">Ask for approval before moving</option>
              <option value="FULLY_AUTONOMOUS">Move automatically (no approval needed)</option>
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {autonomyLevel === 'SUGGEST_APPROVE'
                ? 'You\'ll be notified and can approve or reject each transition.'
                : 'Leads will move instantly when all requirements are met — no human review.'}
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>Enable this rule</span>
          </label>

          <CriteriaBuilder value={criteria} onChange={setCriteria} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {saving ? 'Saving…' : 'Save Rule'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StageProgressionRuleRow ──────────────────────────────────────────────────

function criteriaToSentence(c: ProgressionCriteria): string {
  const parts: string[] = [];
  if (c.minScore !== undefined) parts.push(`lead score reaches ${c.minScore}+`);
  if (c.minEmailOpens !== undefined) parts.push(`${c.minEmailOpens}+ email${c.minEmailOpens !== 1 ? 's' : ''} opened`);
  if (c.minEmailClicks !== undefined) parts.push(`${c.minEmailClicks}+ link${c.minEmailClicks !== 1 ? 's' : ''} clicked`);
  if (c.minCompletedTasks !== undefined) parts.push(`${c.minCompletedTasks}+ task${c.minCompletedTasks !== 1 ? 's' : ''} completed`);
  if (c.maxDaysInStage !== undefined) parts.push(`within ${c.maxDaysInStage} days`);

  if (parts.length === 0) return 'No requirements set — will always trigger';
  if (parts.length === 1) return `When ${parts[0]}`;
  const last = parts.pop();
  return `When ${parts.join(', ')} and ${last}`;
}

function StageProgressionRuleRow({
  rule,
  onEdit,
  onDeleted,
  onToggled,
}: {
  rule: StageProgressionRule;
  onEdit: () => void;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await fetch(`/api/automation/stage-progression/${rule.id}/toggle`, { method: 'PATCH' });
      onToggled();
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this progression rule? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/automation/stage-progression/${rule.id}`, { method: 'DELETE' });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{ borderBottom: '1px solid var(--color-border)', opacity: rule.isActive ? 1 : 0.55 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {STAGE_ICONS[rule.fromStage] || '📋'} {friendlyStage(rule.fromStage)}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>→</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {STAGE_ICONS[rule.toStage] || '📋'} {friendlyStage(rule.toStage)}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: rule.autonomyLevel === 'FULLY_AUTONOMOUS' ? '#dcfce7' : '#fef9c3',
              color: rule.autonomyLevel === 'FULLY_AUTONOMOUS' ? '#16a34a' : '#92400e',
            }}
          >
            {rule.autonomyLevel === 'FULLY_AUTONOMOUS' ? '⚡ Automatic' : '👤 Needs Approval'}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {criteriaToSentence(rule.criteria)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={rule.isActive ? 'Pause this rule' : 'Resume this rule'}
          style={{
            width: 36, height: 20, borderRadius: 10, border: 'none',
            cursor: toggling ? 'not-allowed' : 'pointer',
            backgroundColor: rule.isActive ? 'var(--color-primary)' : 'var(--color-border)',
            position: 'relative', transition: 'background-color 0.2s',
            opacity: toggling ? 0.6 : 1,
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: rule.isActive ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            backgroundColor: '#fff', transition: 'left 0.2s',
          }} />
        </button>

        <button
          onClick={onEdit}
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2.5 py-1 rounded-lg disabled:opacity-50"
          style={{ border: '1px solid #fecaca', color: '#dc2626' }}
        >
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── PendingApprovalsList ─────────────────────────────────────────────────────

function PendingApprovalsList({ onApproved }: { onApproved: () => void }) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/actions?status=PENDING&agentType=STAGE_PROGRESSION&limit=20');
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await fetch(`/api/agents/actions/${id}/approve`, { method: 'POST' });
      setActions((prev) => prev.filter((a) => a.id !== id));
      onApproved();
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await fetch(`/api/agents/actions/${id}/reject`, { method: 'POST' });
      setActions((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setProcessing(null);
    }
  };

  if (loading || actions.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid #fde68a' }}
    >
      <div className="px-5 py-3" style={{ backgroundColor: '#fef9c3', borderBottom: '1px solid #fde68a' }}>
        <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
          👤 Waiting for Your Approval ({actions.length})
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
          These leads are ready to move to the next stage. Review and approve or reject each one.
        </p>
      </div>
      {actions.map((action) => {
        const meta = action.metadata as Record<string, string>;
        const leadName = action.lead?.contact
          ? `${action.lead.contact.firstName} ${action.lead.contact.lastName}`
          : action.lead?.title ?? 'Unknown lead';
        return (
          <div
            key={action.id}
            className="px-5 py-4 flex items-start justify-between gap-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {leadName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Move from <strong>{friendlyStage(meta.fromStage)}</strong> → <strong>{friendlyStage(meta.toStage)}</strong>
              </p>
              <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>
                Reason: {action.reasoning}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleApprove(action.id)}
                disabled={processing === action.id}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#16a34a' }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReject(action.id)}
                disabled={processing === action.id}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                style={{ border: '1px solid #fecaca', color: '#dc2626' }}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── StageProgressionTab ──────────────────────────────────────────────────────

export function StageProgressionTab() {
  const [rules, setRules] = useState<StageProgressionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerRule, setDrawerRule] = useState<StageProgressionRule | null | 'new'>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/automation/stage-progression');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  return (
    <div className="space-y-6">
      <PendingApprovalsList onApproved={fetchRules} />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Stage Progression Rules
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Automatically move leads through your pipeline when they meet certain milestones.
            </p>
          </div>
          <button
            onClick={() => setDrawerRule('new')}
            className="text-sm px-4 py-2 rounded-xl font-semibold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + New Rule
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-3xl mb-2">📈</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              No progression rules yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Create your first rule to start moving leads through your pipeline automatically.
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <StageProgressionRuleRow
              key={rule.id}
              rule={rule}
              onEdit={() => setDrawerRule(rule)}
              onDeleted={fetchRules}
              onToggled={fetchRules}
            />
          ))
        )}
      </div>

      {drawerRule !== null && (
        <StageProgressionRuleDrawer
          rule={drawerRule === 'new' ? null : drawerRule}
          onClose={() => setDrawerRule(null)}
          onSaved={fetchRules}
        />
      )}
    </div>
  );
}
