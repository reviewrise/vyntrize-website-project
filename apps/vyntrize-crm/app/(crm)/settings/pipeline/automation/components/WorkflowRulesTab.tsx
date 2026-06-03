'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleCondition {
  field: string;
  operator: string;
  value: string | number;
}

interface RuleAction {
  type: string;
  config: Record<string, unknown>;
}

interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  autonomyLevel: string;
  isActive: boolean;
  priority: number;
  lastExecutedAt?: string;
  lastExecutionStatus?: string;
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

const CRM_EVENTS = [
  { value: 'lead_created', label: 'When a new lead is created' },
  { value: 'lead_updated', label: 'When a lead is updated' },
  { value: 'stage_changed', label: 'When a lead moves to a new stage' },
  { value: 'email_opened', label: 'When an email is opened' },
  { value: 'email_clicked', label: 'When an email link is clicked' },
  { value: 'task_completed', label: 'When a task is completed' },
];

const CONDITION_FIELDS = [
  { value: 'score', label: 'Lead score' },
  { value: 'stage', label: 'Pipeline stage' },
  { value: 'daysInStage', label: 'Days in current stage' },
  { value: 'scoreChangedBy', label: 'Score recently changed by' },
  { value: 'assigneeId', label: 'Assigned User ID' },
  { value: 'source', label: 'Lead Source' },
];

const NUMERIC_OPERATORS = [
  { value: 'gt', label: 'is greater than' },
  { value: 'gte', label: 'is at least' },
  { value: 'lt', label: 'is less than' },
  { value: 'lte', label: 'is at most' },
  { value: 'eq', label: 'is exactly' },
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send an email' },
  { value: 'change_stage', label: 'Change lead stage' },
  { value: 'create_task', label: 'Create a task' },
  { value: 'assign_lead', label: 'Assign lead to user' },
  { value: 'notify_staff', label: 'Notify assigned staff via email' },
  { value: 'enroll_drip', label: 'Enroll in drip sequence' },
  { value: 'schedule_meeting', label: 'Schedule Meeting & Send Invite' },
];

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

// ─── ConditionBuilder ─────────────────────────────────────────────────────────

function ConditionBuilder({ conditions, onChange }: { conditions: RuleCondition[]; onChange: (c: RuleCondition[]) => void }) {
  const addCondition = () => onChange([...conditions, { field: 'score', operator: 'gte', value: 50 }]);
  const removeCondition = (i: number) => onChange(conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, patch: Partial<RuleCondition>) =>
    onChange(conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Conditions
          </p>
          <button type="button" onClick={addCondition}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}>
            + Add Condition
          </button>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Only run this rule if all of these conditions are met.
        </p>
      </div>

      {conditions.length === 0 && (
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--color-bg)', border: '1px dashed var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No conditions set. This rule will run every time the trigger happens.</p>
        </div>
      )}

      {conditions.map((cond, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <select value={cond.field} onChange={(e) => updateCondition(i, { field: e.target.value, value: (e.target.value === 'stage' || e.target.value === 'assigneeId' || e.target.value === 'source') ? '' : 0 })}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
            {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>

          {(cond.field === 'stage' || cond.field === 'assigneeId' || cond.field === 'source') ? (
            <>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>is</span>
              {cond.field === 'stage' ? (
                <select value={cond.value as string} onChange={(e) => updateCondition(i, { value: e.target.value })}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                  <option value="" disabled>Select stage...</option>
                  {STAGES.map((s) => <option key={s} value={s}>{STAGE_ICONS[s]} {friendlyStage(s)}</option>)}
                </select>
              ) : cond.field === 'source' ? (
                <input type="text" value={cond.value as string} onChange={(e) => updateCondition(i, { value: e.target.value })}
                  placeholder="e.g. website"
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
              ) : (
                <input type="text" value={cond.value as string} onChange={(e) => updateCondition(i, { value: e.target.value })}
                  placeholder="User ID"
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
              )}
            </>
          ) : (
            <>
              <select value={cond.operator} onChange={(e) => updateCondition(i, { operator: e.target.value })}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                {NUMERIC_OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
              <input type="number" value={cond.value as number} onChange={(e) => updateCondition(i, { value: parseFloat(e.target.value) || 0 })}
                className="w-20 px-2 py-1.5 rounded-lg text-xs text-center font-semibold"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
            </>
          )}

          <button type="button" onClick={() => removeCondition(i)} className="text-xs w-6 h-6 rounded flex items-center justify-center hover:bg-red-50" style={{ color: '#dc2626' }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── ActionBuilder ────────────────────────────────────────────────────────────

function ActionConfigFields({ action, onChange }: { action: RuleAction; onChange: (a: RuleAction) => void }) {
  const cfg = action.config;
  switch (action.type) {
    case 'change_stage':
      return (
        <select value={(cfg.targetStage as string) ?? 'CONTACTED'}
          onChange={(e) => onChange({ ...action, config: { targetStage: e.target.value } })}
          className="flex-1 px-2 py-1.5 rounded-lg text-xs"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_ICONS[s]} {friendlyStage(s)}</option>)}
        </select>
      );
    case 'create_task':
      return (
        <div className="flex-1 flex gap-2">
          <input type="text" value={(cfg.title as string) ?? ''} placeholder="Task title (e.g. Follow up with lead)"
            onChange={(e) => onChange({ ...action, config: { ...cfg, title: e.target.value } })}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Due in</span>
            <input type="number" value={(cfg.dueDaysOffset as number) ?? 1} min="0"
              onChange={(e) => onChange({ ...action, config: { ...cfg, dueDaysOffset: parseInt(e.target.value) || 0 } })}
              className="w-12 px-2 py-1.5 rounded-lg text-xs text-center"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>days</span>
          </div>
        </div>
      );
    case 'assign_lead':
      return (
        <div className="flex-1 flex gap-2">
          <select 
            value={(cfg.strategy as string) || 'specific'} 
            onChange={(e) => {
              const strategy = e.target.value;
              onChange({ ...action, config: { ...cfg, strategy, assigneeId: strategy === 'round-robin' ? undefined : '' } });
            }}
            className="w-1/2 px-2 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="specific">Specific User</option>
            <option value="round-robin">Round-Robin (Auto)</option>
          </select>
          {(!cfg.strategy || cfg.strategy === 'specific') && (
            <input type="text" value={(cfg.assigneeId as string) ?? ''} placeholder="User ID to assign to"
              onChange={(e) => onChange({ ...action, config: { ...cfg, assigneeId: e.target.value } })}
              className="w-1/2 px-2 py-1.5 rounded-lg text-xs"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
          )}
        </div>
      );
    case 'enroll_drip':
      return (
        <input type="text" value={(cfg.sequenceId as string) ?? ''} placeholder="Drip Sequence ID"
          onChange={(e) => onChange({ ...action, config: { sequenceId: e.target.value } })}
          className="flex-1 px-2 py-1.5 rounded-lg text-xs"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
      );
    case 'send_email':
      return (
        <input type="text" value={(cfg.templateHint as string) ?? ''} placeholder="Template name or prompt hint"
          onChange={(e) => onChange({ ...action, config: { templateHint: e.target.value } })}
          className="flex-1 px-2 py-1.5 rounded-lg text-xs"
          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
      );
    case 'notify_staff':
      return (
        <span className="flex-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Automatically emails the assigned staff member</span>
      );
    case 'schedule_meeting':
      return (
        <label className="flex-1 flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--color-text)' }}>
          <input 
            type="checkbox" 
            checked={!!cfg.generateMeetLink} 
            onChange={(e) => onChange({ ...action, config: { ...cfg, generateMeetLink: e.target.checked } })}
            className="rounded border-gray-300"
          />
          Generate Google Meet Link
        </label>
      );
    default:
      return <span className="flex-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>No config needed</span>;
  }
}

function ActionBuilder({ actions, onChange }: { actions: RuleAction[]; onChange: (a: RuleAction[]) => void }) {
  const addAction = () => onChange([...actions, { type: 'create_task', config: { title: '', dueDaysOffset: 1 } }]);
  const removeAction = (i: number) => onChange(actions.filter((_, idx) => idx !== i));
  const updateAction = (i: number, a: RuleAction) => onChange(actions.map((x, idx) => idx === i ? a : x));

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Actions to Perform
          </p>
          <button type="button" onClick={addAction}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}>
            + Add Action
          </button>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          These actions will run in order when the rule is triggered.
        </p>
      </div>

      {actions.length === 0 && (
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#fef2f2', border: '1px dashed #fecaca' }}>
          <p className="text-xs" style={{ color: '#dc2626' }}>You must add at least one action for this rule to do something.</p>
        </div>
      )}

      {actions.map((action, i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{i + 1}</span>
            <select value={action.type}
              onChange={(e) => updateAction(i, { type: e.target.value, config: {} })}
              className="w-40 px-2 py-1.5 rounded-lg text-xs font-medium"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
              {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--color-text-muted)' }}>→</span>
            <ActionConfigFields action={action} onChange={(a) => updateAction(i, a)} />
            <button type="button" onClick={() => removeAction(i)} className="text-xs w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 flex-shrink-0" style={{ color: '#dc2626' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WorkflowRuleDrawer ───────────────────────────────────────────────────────

function WorkflowRuleDrawer({
  rule,
  onClose,
  onSaved,
}: {
  rule: WorkflowRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(rule?.name ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  const [triggerEvent, setTriggerEvent] = useState(rule?.triggerEvent ?? 'lead_updated');
  const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions ?? []);
  const [actions, setActions] = useState<RuleAction[]>(rule?.actions ?? []);
  const [autonomyLevel, setAutonomyLevel] = useState(rule?.autonomyLevel ?? 'FULLY_AUTONOMOUS');
  const [priority, setPriority] = useState(rule?.priority ?? 100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please provide a name for this rule.'); return; }
    if (actions.length === 0) { setError('You need to add at least one action.'); return; }
    setSaving(true);
    setError(null);
    try {
      const url = rule ? `/api/automation/workflow-rules/${rule.id}` : '/api/automation/workflow-rules';
      const method = rule ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, triggerEvent, conditions, actions, autonomyLevel, priority }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save rule');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ml-auto h-full w-full max-w-xl overflow-y-auto p-6 space-y-6"
        style={{ backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {rule ? 'Edit Workflow Rule' : 'New Workflow Rule'}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Set up automated actions that run when specific events happen in the CRM.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: 'var(--color-text-muted)' }}>✕</button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Rule Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alert when high-value lead clicks link"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this rule do?"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
            </div>
          </div>

          <div className="p-4 rounded-xl space-y-4" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
             <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Trigger Event</label>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>What should kick off this rule?</p>
              <select value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                {CRM_EVENTS.map((e) => <option key={e.value} value={e.value}>⚡ {e.label}</option>)}
              </select>
            </div>
          </div>

          <ConditionBuilder conditions={conditions} onChange={setConditions} />
          
          <ActionBuilder actions={actions} onChange={setActions} />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Execution Mode</label>
              <select value={autonomyLevel} onChange={(e) => setAutonomyLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                <option value="FULLY_AUTONOMOUS">Run Automatically</option>
                <option value="SUGGEST_APPROVE">Ask for Approval First</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Priority</label>
              <input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 100)}
                title="Lower number means it runs first if multiple rules trigger at once"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {saving ? 'Saving...' : 'Save Workflow Rule'}
          </button>
          <button onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WorkflowRuleRow ──────────────────────────────────────────────────────────

function ruleConditionToSentence(cond: RuleCondition): string {
  const fieldLabel = CONDITION_FIELDS.find(f => f.value === cond.field)?.label || cond.field;
  
  if (cond.field === 'stage') {
    return `Lead is in ${friendlyStage(cond.value as string)}`;
  }
  if (cond.field === 'assigneeId') {
    return `Assigned to ${cond.value}`;
  }
  
  const opLabel = NUMERIC_OPERATORS.find(o => o.value === cond.operator)?.label || cond.operator;
  return `${fieldLabel} ${opLabel} ${cond.value}`;
}

function WorkflowRuleRow({
  rule,
  onEdit,
  onDeleted,
  onToggled,
}: {
  rule: WorkflowRule;
  onEdit: () => void;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await fetch(`/api/automation/workflow-rules/${rule.id}/toggle`, { method: 'PATCH' });
      onToggled();
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/automation/workflow-rules/${rule.id}`, { method: 'DELETE' });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  const eventLabel = CRM_EVENTS.find((e) => e.value === rule.triggerEvent)?.label ?? rule.triggerEvent;
  
  const conditionsText = rule.conditions.length > 0 
    ? `If ${rule.conditions.map(ruleConditionToSentence).join(' and ')}`
    : 'Always runs when triggered';
    
  const actionsCount = rule.actions.length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 transition-colors hover:bg-gray-50" 
         style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: rule.isActive ? 'transparent' : 'var(--color-bg)' }}>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
             <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold" style={{ color: rule.isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{rule.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                ⚡ {eventLabel}
              </span>
              {rule.autonomyLevel === 'SUGGEST_APPROVE' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                  style={{ backgroundColor: '#fef9c3', color: '#a16207', borderColor: '#fef08a' }}>
                  Needs Approval
                </span>
              )}
            </div>
            {rule.description && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{rule.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {conditionsText}
          </span>
          <span>→</span>
          <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
             Performs {actionsCount} action{actionsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0">
        <div className="text-right hidden sm:block mr-2">
          {rule.lastExecutedAt ? (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Last run {new Date(rule.lastExecutedAt).toLocaleDateString()}</p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Never run</p>
          )}
        </div>
        
        {/* Toggle */}
        <button onClick={handleToggle} disabled={toggling} title={rule.isActive ? 'Turn off this rule' : 'Turn on this rule'}
          className="flex-shrink-0"
          style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: toggling ? 'not-allowed' : 'pointer',
            backgroundColor: rule.isActive ? 'var(--color-primary)' : 'var(--color-border)',
            position: 'relative', transition: 'background-color 0.2s', opacity: toggling ? 0.6 : 1 }}>
          <span style={{ position: 'absolute', top: 2, left: rule.isActive ? 22 : 2, width: 20, height: 20,
            borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
        </button>
        <div className="h-6 w-px bg-gray-200" style={{ backgroundColor: 'var(--color-border)' }}></div>
        <button onClick={onEdit} className="text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}>Edit</button>
        <button onClick={handleDelete} disabled={deleting} className="text-sm font-medium hover:underline disabled:opacity-50"
          style={{ color: '#dc2626' }}>
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── WorkflowRulesTab ─────────────────────────────────────────────────────────

export function WorkflowRulesTab() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerRule, setDrawerRule] = useState<WorkflowRule | null | 'new'>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/automation/workflow-rules');
      if (res.ok) {
        const data = await res.json();
        
        // Normalize single-object conditions/actions from seed script
        const normalizedRules = (data.rules ?? []).map((r: any) => ({
          ...r,
          conditions: Array.isArray(r.conditions) ? r.conditions : (r.conditions ? [r.conditions] : []),
          actions: Array.isArray(r.actions) ? r.actions : (r.actions ? [r.actions] : []),
        }));

        // Sort active rules first, then by priority
        const sortedRules = normalizedRules.sort((a: WorkflowRule, b: WorkflowRule) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return a.priority - b.priority;
        });
        setRules(sortedRules);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Workflow Rules</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Automate tasks, emails, and lead assignments based on triggers.</p>
          </div>
          <button onClick={() => setDrawerRule('new')}
            className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            + Create Rule
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="px-5 py-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>No active rules yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Workflow rules let you automatically react to events in your CRM. You can automatically assign hot leads, send follow-up emails, or create tasks for your team.
            </p>
            <button onClick={() => setDrawerRule('new')}
              className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Create your first rule
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {rules.map((rule) => (
              <WorkflowRuleRow
                key={rule.id}
                rule={rule}
                onEdit={() => setDrawerRule(rule)}
                onDeleted={fetchRules}
                onToggled={fetchRules}
              />
            ))}
          </div>
        )}
      </div>

      {drawerRule !== null && (
        <WorkflowRuleDrawer
          rule={drawerRule === 'new' ? null : drawerRule}
          onClose={() => setDrawerRule(null)}
          onSaved={fetchRules}
        />
      )}
    </div>
  );
}
