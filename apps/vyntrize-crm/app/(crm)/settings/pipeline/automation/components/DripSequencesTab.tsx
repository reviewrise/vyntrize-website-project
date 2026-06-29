'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DripStep {
  stepOrder: number;
  delayHours: number;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  smsBodyTemplate?: string;
  branchCondition: 'opened' | 'not_opened' | 'clicked' | 'always';
}

interface DripSequence {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  stopConditions: Record<string, unknown>;
  autonomyLevel: string;
  isActive: boolean;
  stepCount?: number;
  activeEnrollmentCount?: number;
}

interface Enrollment {
  id: string;
  leadId: string;
  currentStepIndex: number;
  enrolledAt: string;
  lastStepSentAt?: string;
  lead?: { title?: string };
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

const BRANCH_CONDITIONS: Record<string, string> = {
  always: 'Always send this step',
  opened: 'Only if they OPENED the previous email',
  not_opened: 'Only if they DID NOT OPEN the previous email',
  clicked: 'Only if they CLICKED a link in previous email',
};

// ─── DripStepPreview ──────────────────────────────────────────────────────────

function DripStepPreview({ steps }: { steps: DripStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="space-y-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
        Sequence Timeline
      </p>
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'var(--color-border)', minHeight: 24 }} />
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100" style={{ color: 'var(--color-text-muted)' }}>
                 Wait {step.delayHours}h
              </span>
              {step.branchCondition !== 'always' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  {BRANCH_CONDITIONS[step.branchCondition]}
                </span>
              )}
            </div>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text)' }}>
              {step.emailSubjectTemplate ? `Subject: ${step.emailSubjectTemplate}` : '(No Email defined)'} {step.smsBodyTemplate ? '| 📱 SMS included' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DripStepBuilder ─────────────────────────────────────────────────────────

function DripStepBuilder({ steps, onChange }: { steps: DripStep[]; onChange: (s: DripStep[]) => void }) {
  const addStep = () => {
    onChange([...steps, {
      stepOrder: steps.length,
      delayHours: 24,
      emailSubjectTemplate: '',
      emailBodyTemplate: '',
      smsBodyTemplate: '',
      branchCondition: 'always',
    }]);
  };

  const removeStep = (i: number) => {
    onChange(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepOrder: idx })));
  };

  const updateStep = (i: number, patch: Partial<DripStep>) => {
    onChange(steps.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };

  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.map((s, idx) => ({ ...s, stepOrder: idx })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            Campaign Steps ({steps.length})
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Define the emails and/or SMS messages to send and how long to wait between them.
          </p>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="text-xs px-3 py-1.5 rounded-lg font-bold transition-colors hover:bg-gray-50"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-surface)' }}
        >
          + Add Step
        </button>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 space-y-4 shadow-sm"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{i + 1}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Campaign Step</span>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} title="Move step up"
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:opacity-30" style={{ color: 'var(--color-text-muted)' }}>↑</button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} title="Move step down"
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:opacity-30" style={{ color: 'var(--color-text-muted)' }}>↓</button>
                <div className="w-px h-4 my-auto mx-1 bg-gray-200"></div>
                <button type="button" onClick={() => removeStep(i)} title="Remove this step"
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-red-50" style={{ color: '#dc2626' }}>✕</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>Wait before sending</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} value={step.delayHours}
                    onChange={(e) => updateStep(i, { delayHours: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 rounded-xl text-sm text-center font-semibold"
                    style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>hours</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>Sending rule</label>
                <select
                  value={step.branchCondition}
                  onChange={(e) => updateStep(i, { branchCondition: e.target.value as DripStep['branchCondition'] })}
                  className="w-full px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                >
                  <option value="always">{BRANCH_CONDITIONS.always}</option>
                  <option value="opened">{BRANCH_CONDITIONS.opened}</option>
                  <option value="not_opened">{BRANCH_CONDITIONS.not_opened}</option>
                  <option value="clicked">{BRANCH_CONDITIONS.clicked}</option>
                </select>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                {/* Email Section */}
                <div className="space-y-4 pr-4 border-r" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✉️</span>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Email Channel</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>Subject</label>
                    <input
                      type="text" value={step.emailSubjectTemplate || ''}
                      onChange={(e) => updateStep(i, { emailSubjectTemplate: e.target.value })}
                      placeholder="e.g. Following up on {{leadTitle}}"
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <label className="block text-xs font-bold" style={{ color: 'var(--color-text)' }}>Body</label>
                    </div>
                    <textarea
                      value={step.emailBodyTemplate || ''}
                      onChange={(e) => updateStep(i, { emailBodyTemplate: e.target.value })}
                      rows={5}
                      placeholder="Hi {{firstName}}, ..."
                      className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                {/* SMS Section */}
                <div className="space-y-4 pl-0 md:pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>SMS Channel</h4>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Sent instantly with the email. Use {'{{firstName}}'}. Leave blank to skip.</p>
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <label className="block text-xs font-bold" style={{ color: 'var(--color-text)' }}>Text Message</label>
                    </div>
                    <textarea
                      value={step.smsBodyTemplate || ''}
                      onChange={(e) => updateStep(i, { smsBodyTemplate: e.target.value })}
                      rows={5}
                      placeholder="Hey {{firstName}}, I just sent you an email!"
                      className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>
              </div>
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="rounded-2xl p-6 text-center border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-2xl mb-2">🚀</p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>No steps in this sequence yet.</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>Add your first step to get started.</p>
          <button
            type="button"
            onClick={addStep}
            className="text-xs px-4 py-2 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Add First Email
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DripSequenceDrawer ───────────────────────────────────────────────────────

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

function DripSequenceDrawer({
  sequence,
  onClose,
  onSaved,
}: {
  sequence: DripSequence | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(sequence?.name ?? '');
  const [description, setDescription] = useState(sequence?.description ?? '');
  const [triggerType, setTriggerType] = useState(sequence?.triggerType ?? 'stage_entered');
  const [triggerStage, setTriggerStage] = useState((sequence?.triggerConfig?.stage as string) ?? 'NEW');
  const [triggerScore, setTriggerScore] = useState((sequence?.triggerConfig?.scoreThreshold as number) ?? 70);
  const [triggerDays, setTriggerDays] = useState((sequence?.triggerConfig?.inactivityDays as number) ?? 7);
  const [stopStage, setStopStage] = useState((sequence?.stopConditions?.onStageReached as string) ?? '');
  const [stopScore, setStopScore] = useState((sequence?.stopConditions?.onScoreExceeds as number | undefined));
  const [autonomyLevel, setAutonomyLevel] = useState(sequence?.autonomyLevel ?? 'FULLY_AUTONOMOUS');
  const [steps, setSteps] = useState<DripStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please provide a name for this sequence.'); return; }
    if (steps.length === 0) { setError('You need to add at least one email step.'); return; }

    const triggerConfig =
      triggerType === 'stage_entered' ? { stage: triggerStage }
      : triggerType === 'score_threshold' ? { scoreThreshold: triggerScore }
      : { inactivityDays: triggerDays };

    const stopConditions: Record<string, unknown> = {};
    if (stopStage) stopConditions.onStageReached = stopStage;
    if (stopScore !== undefined) stopConditions.onScoreExceeds = stopScore;

    setSaving(true);
    setError(null);
    try {
      const url = sequence ? `/api/automation/drip-sequences/${sequence.id}` : '/api/automation/drip-sequences';
      const method = sequence ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, triggerType, triggerConfig, stopConditions, autonomyLevel, steps }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save sequence');
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
    <div
      className="fixed inset-0 z-50 flex"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ml-auto h-full w-full max-w-2xl overflow-y-auto p-6 md:p-8 space-y-8"
        style={{ backgroundColor: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {sequence ? 'Edit Drip Sequence' : 'Create Drip Sequence'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Automate a series of emails to nurture leads over time.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: 'var(--color-text-muted)' }}>✕</button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <div className="space-y-8">
          <div className="p-5 rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
             <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>General Information</h3>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>Sequence Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Lead Welcome Series"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the goal of this sequence?"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }} />
            </div>
          </div>

          <div className="p-5 rounded-2xl shadow-sm space-y-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Enrollment & Rules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>When should a lead start this?</label>
                  <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-medium mb-3"
                    style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
                    <option value="stage_entered">When they enter a specific stage</option>
                    <option value="score_threshold">When their score gets high enough</option>
                    <option value="inactivity_days">When they've been inactive</option>
                  </select>
                  
                  {triggerType === 'stage_entered' && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Which stage?</label>
                      <select value={triggerStage} onChange={(e) => setTriggerStage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_ICONS[s]} {friendlyStage(s)}</option>)}
                      </select>
                    </div>
                  )}
                  {triggerType === 'score_threshold' && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>What score threshold?</label>
                      <input type="number" value={triggerScore} onChange={(e) => setTriggerScore(parseInt(e.target.value) || 0)}
                        placeholder="e.g. 70" className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
                    </div>
                  )}
                  {triggerType === 'inactivity_days' && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>How many days inactive?</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={triggerDays} onChange={(e) => setTriggerDays(parseInt(e.target.value) || 0)}
                          placeholder="e.g. 7" className="w-20 px-3 py-2 rounded-lg text-sm text-center font-semibold"
                          style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>days</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>When should a lead be removed?</label>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Leads are automatically removed if they reply. You can add more rules:</p>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Stop if they reach stage</label>
                      <select value={stopStage} onChange={(e) => setStopStage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                        <option value="">— Don't stop based on stage —</option>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_ICONS[s]} {friendlyStage(s)}</option>)}
                      </select>
                    </div>
                    
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Stop if score reaches</label>
                      <input type="number" value={stopScore ?? ''} onChange={(e) => setStopScore(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="e.g. 90 (leave empty to ignore)"
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <label className="block text-sm font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>How should emails be sent?</label>
              <select value={autonomyLevel} onChange={(e) => setAutonomyLevel(e.target.value)}
                className="w-full sm:w-auto min-w-[250px] px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
                <option value="FULLY_AUTONOMOUS">Send automatically (No review)</option>
                <option value="SUGGEST_APPROVE">Draft them for me to approve</option>
              </select>
            </div>
          </div>

          <div className="p-5 rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <DripStepBuilder steps={steps} onChange={setSteps} />
            <DripStepPreview steps={steps} />
          </div>
        </div>

        <div className="flex gap-3 pt-6 pb-12">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-colors hover:opacity-90 shadow-md"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            {saving ? 'Saving sequence...' : 'Save Drip Sequence'}
          </button>
          <button onClick={onClose}
            className="px-6 py-3.5 rounded-xl text-sm font-bold transition-colors hover:bg-gray-50"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EnrollmentTable ──────────────────────────────────────────────────────────

function EnrollmentTable({ sequenceId }: { sequenceId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/automation/drip-sequences/${sequenceId}/enrollments`)
      .then((r) => r.json())
      .then((d) => setEnrollments(d.enrollments ?? []))
      .finally(() => setLoading(false));
  }, [sequenceId]);

  const handleUnenroll = async (enrollmentId: string) => {
    setUnenrolling(enrollmentId);
    try {
      await fetch(`/api/automation/drip-sequences/${sequenceId}/enrollments/${enrollmentId}`, { method: 'DELETE' });
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
    } finally {
      setUnenrolling(null);
    }
  };

  if (loading) return (
    <div className="py-4 text-center">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-2" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading leads...</p>
    </div>
  );
  
  if (enrollments.length === 0) return (
    <div className="py-6 text-center bg-gray-50 rounded-xl mt-2" style={{ backgroundColor: 'var(--color-bg)' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Nobody is currently receiving this sequence.</p>
    </div>
  );

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Currently Enrolled Leads</p>
      {enrollments.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              {e.lead?.title ?? 'Unknown Lead'}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>On Step {e.currentStepIndex + 1}</span>
              <span>·</span>
              <span>Started {new Date(e.enrolledAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            onClick={() => handleUnenroll(e.id)}
            disabled={unenrolling === e.id}
            className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors hover:bg-red-50"
            style={{ border: '1px solid var(--color-border)', color: '#dc2626', backgroundColor: 'var(--color-bg)' }}
          >
            {unenrolling === e.id ? 'Removing...' : 'Remove Lead'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── BulkEnrollModal ─────────────────────────────────────────────────────────

interface LeadOption {
  id: string;
  name: string;
  stage: string;
  email?: string;
}

const LEAD_STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'NEW', label: '🆕 New' },
  { value: 'CONTACTED', label: '📞 Contacted' },
  { value: 'QUALIFIED', label: '✅ Qualified' },
  { value: 'PROPOSAL_SENT', label: '📄 Proposal Sent' },
  { value: 'WON', label: '🏆 Won' },
  { value: 'LOST', label: '❌ Lost' },
];

function BulkEnrollModal({
  sequenceId,
  sequenceName,
  onClose,
  onDone,
}: {
  sequenceId: string;
  sequenceName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [leads, setLeads]             = useState<LeadOption[]>([]);
  const [loading, setLoading]         = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling]     = useState(false);
  const [result, setResult]           = useState<{ enrolled: number; skipped: number; errors: number } | null>(null);
  const searchRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    fetch('/api/crm/leads?limit=500&fields=id,title,stage,contact')
      .then((r) => r.json())
      .then((data) => {
        const items: LeadOption[] = (data.leads ?? []).map((l: any) => ({
          id:    l.id,
          name:  l.contact ? `${l.contact.firstName} ${l.contact.lastName}`.trim() : l.title,
          stage: l.stage,
          email: l.contact?.email,
        }));
        setLeads(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter((l) => {
    if (stageFilter && l.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || (l.email?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((l) => next.delete(l.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((l) => next.add(l.id)); return next; });
    }
  };

  const handleEnroll = async () => {
    if (selected.size === 0) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/automation/drip-sequences/${sequenceId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.summary);
      } else {
        alert(data.error ?? 'Enrollment failed');
      }
    } catch {
      alert('Network error — please try again');
    } finally {
      setEnrolling(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  };
  const modalStyle: React.CSSProperties = {
    width: '100%', maxWidth: 560, maxHeight: '85vh',
    borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && !enrolling && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Enroll Leads</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Select leads to add to <strong>{sequenceName}</strong>
              </p>
            </div>
            <button onClick={onClose} disabled={enrolling}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-muted)', lineHeight: 1, padding: 4 }}>
              ✕
            </button>
          </div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 13,
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
              {LEAD_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div style={{ padding: '12px 24px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
              ✅ Done! <strong>{result.enrolled}</strong> enrolled, <strong>{result.skipped}</strong> already active, <strong>{result.errors}</strong> errors.
            </p>
            <button onClick={onDone} style={{ marginTop: 8, fontSize: 13, fontWeight: 700,
              color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Close &amp; refresh →
            </button>
          </div>
        )}

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>Loading leads…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No leads match your filters.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <th style={{ width: 44, padding: '10px 16px' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th style={{ textAlign: 'left', padding: '10px 0 10px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Lead</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px 10px 0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Stage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id}
                    onClick={() => toggle(lead.id)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                      backgroundColor: selected.has(lead.id) ? 'rgba(99,102,241,0.05)' : 'transparent',
                      transition: 'background-color 0.1s' }}>
                    <td style={{ width: 44, padding: '10px 16px' }}>
                      <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggle(lead.id)}
                        onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '10px 0 10px 4px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{lead.name}</p>
                      {lead.email && <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>{lead.email}</p>}
                    </td>
                    <td style={{ padding: '10px 16px 10px 0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        {lead.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              {selected.size === 0 ? 'Select leads above' : <><strong>{selected.size}</strong> lead{selected.size !== 1 ? 's' : ''} selected</>}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} disabled={enrolling}
                style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                Cancel
              </button>
              <button onClick={handleEnroll} disabled={enrolling || selected.size === 0}
                style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                  border: 'none', backgroundColor: selected.size === 0 ? 'var(--color-border)' : 'var(--color-primary)',
                  color: '#fff', opacity: enrolling ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                {enrolling ? 'Enrolling…' : `Enroll ${selected.size > 0 ? selected.size : ''} Lead${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DripSequenceRow ──────────────────────────────────────────────────────────

function DripSequenceRow({
  sequence,
  onEdit,
  onDeleted,
  onToggled,
}: {
  sequence: DripSequence;
  onEdit: () => void;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const [expanded, setExpanded]     = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [enrollModal, setEnrollModal] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await fetch(`/api/automation/drip-sequences/${sequence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sequence.isActive }),
      });
      onToggled();
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    const activeCount = sequence.activeEnrollmentCount ?? 0;
    const msg = activeCount > 0
      ? `This sequence has ${activeCount} active lead(s). Deleting it will stop sending them emails. Are you sure?`
      : `Delete the sequence "${sequence.name}"?`;
    if (!confirm(msg)) return;
    setDeleting(true);
    try {
      await fetch(`/api/automation/drip-sequences/${sequence.id}?force=true`, { method: 'DELETE' });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  let triggerLabel = '';
  if (sequence.triggerType === 'stage_entered') {
    triggerLabel = `When lead reaches ${friendlyStage((sequence.triggerConfig?.stage as string) ?? '')}`;
  } else if (sequence.triggerType === 'score_threshold') {
    triggerLabel = `When score hits ${sequence.triggerConfig?.scoreThreshold}+`;
  } else {
    triggerLabel = `After ${sequence.triggerConfig?.inactivityDays} days of silence`;
  }

  const activeCount = sequence.activeEnrollmentCount ?? 0;

  return (
    <div className="transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: sequence.isActive ? 'transparent' : 'var(--color-bg)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
             <div className="space-y-1">
               <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold" style={{ color: sequence.isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{sequence.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                  style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                  {triggerLabel}
                </span>
                {sequence.autonomyLevel === 'SUGGEST_APPROVE' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                    style={{ backgroundColor: '#fef9c3', color: '#a16207', borderColor: '#fef08a' }}>
                    Needs Approval
                  </span>
                )}
              </div>
              {sequence.description && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{sequence.description}</p>
              )}
             </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <span>✉️</span> {sequence.stepCount ?? 0} Emails
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: activeCount > 0 ? '#10b981' : 'inherit' }}>👥 {activeCount} Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0">
          <button onClick={() => setExpanded(!expanded)} className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            {expanded ? 'Hide Leads' : 'View Leads'}
          </button>
          
          <button onClick={() => setEnrollModal(true)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
            title="Bulk-enroll leads into this sequence">
            + Enroll Leads
          </button>
          
          <button
            onClick={handleToggle} disabled={toggling} title={sequence.isActive ? 'Turn off sequence' : 'Turn on sequence'}
            className="flex-shrink-0"
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: toggling ? 'not-allowed' : 'pointer',
              backgroundColor: sequence.isActive ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative', transition: 'background-color 0.2s', opacity: toggling ? 0.6 : 1 }}>
            <span style={{ position: 'absolute', top: 2, left: sequence.isActive ? 22 : 2, width: 20, height: 20,
              borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          </button>
          
          <div className="h-6 w-px mx-1 bg-gray-200" style={{ backgroundColor: 'var(--color-border)' }}></div>
          
          <button onClick={onEdit} className="text-sm font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}>Edit</button>
          <button onClick={handleDelete} disabled={deleting} className="text-sm font-medium hover:underline disabled:opacity-50"
            style={{ color: '#dc2626' }}>
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-1 bg-gray-50 border-t" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <EnrollmentTable sequenceId={sequence.id} />
        </div>
      )}

      {enrollModal && (
        <BulkEnrollModal
          sequenceId={sequence.id}
          sequenceName={sequence.name}
          onClose={() => setEnrollModal(false)}
          onDone={() => { setEnrollModal(false); onToggled(); }}
        />
      )}
    </div>
  );
}

// ─── DripSequencesTab ─────────────────────────────────────────────────────────

export function DripSequencesTab() {
  const [sequences, setSequences] = useState<DripSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerSeq, setDrawerSeq] = useState<DripSequence | null | 'new'>(null);

  const fetchSequences = useCallback(async () => {
    try {
      const res = await fetch('/api/automation/drip-sequences');
      if (res.ok) {
        const data = await res.json();
        const sortedSeq = (data.sequences ?? []).sort((a: DripSequence, b: DripSequence) => {
           if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
           return 0;
        });
        setSequences(sortedSeq);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSequences(); }, [fetchSequences]);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Drip Sequences</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Send automated email campaigns to nurture leads over time.</p>
          </div>
          <button onClick={() => setDrawerSeq('new')}
            className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            + Create Sequence
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Loading sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          <div className="px-5 py-16 text-center max-w-md mx-auto">
             <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <span className="text-2xl">✉️</span>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>No drip sequences yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Keep your leads warm by sending them a series of helpful emails automatically. They'll stop receiving emails as soon as they reply.
            </p>
            <button onClick={() => setDrawerSeq('new')}
              className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Create your first sequence
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {sequences.map((seq) => (
              <DripSequenceRow
                key={seq.id}
                sequence={seq}
                onEdit={() => setDrawerSeq(seq)}
                onDeleted={fetchSequences}
                onToggled={fetchSequences}
              />
            ))}
          </div>
        )}
      </div>

      {drawerSeq !== null && (
        <DripSequenceDrawer
          sequence={drawerSeq === 'new' ? null : drawerSeq}
          onClose={() => setDrawerSeq(null)}
          onSaved={fetchSequences}
        />
      )}
    </div>
  );
}
