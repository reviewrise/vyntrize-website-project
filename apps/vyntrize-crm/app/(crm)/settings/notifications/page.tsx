'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Info } from 'lucide-react';
import type { TriggerConfig } from '@/app/api/settings/notification-triggers/route';

// ─── Metadata ────────────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; description: string; recipientOptions: string[] }> = {
  LEAD_CREATED: {
    label: 'New lead created',
    description: 'Fires when a new lead is added to the CRM.',
    recipientOptions: ['assignee', 'admins', 'both'],
  },
  STAGE_CHANGED: {
    label: 'Lead stage changed',
    description: 'Fires when a lead moves to a different pipeline stage.',
    recipientOptions: ['assignee', 'admins', 'both'],
  },
  TASK_CREATED: {
    label: 'Task assigned',
    description: 'Fires when a task is created and assigned to a user.',
    recipientOptions: ['assignee'],
  },
  TASK_COMPLETED: {
    label: 'Task completed',
    description: 'Fires when a task is marked as completed.',
    recipientOptions: ['assignee'],
  },
  CALENDAR_EVENT_CREATED: {
    label: 'Calendar event created',
    description: 'Fires when a new calendar event is created.',
    recipientOptions: ['assignee'],
  },
  CALENDAR_EVENT_UPDATED: {
    label: 'Calendar event updated',
    description: 'Fires when a calendar event is modified.',
    recipientOptions: ['assignee'],
  },
  AGENT_ACTION_PENDING: {
    label: 'AI agent action pending',
    description: 'Fires when an AI agent drafts an action needing admin approval.',
    recipientOptions: ['admins'],
  },
  MEETING_ATTENDED: {
    label: 'Meeting attended',
    description: 'Fires when a calendar event is marked as attended.',
    recipientOptions: ['assignee'],
  },
  MEETING_MISSED: {
    label: 'Meeting missed',
    description: 'Fires when a calendar event passes without attendance.',
    recipientOptions: ['assignee'],
  },
};

const RECIPIENT_LABELS: Record<string, string> = {
  assignee: 'Assigned user only',
  admins:   'All admins',
  both:     'Assigned user + all admins',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationTriggersPage() {
  const [configs, setConfigs]   = useState<TriggerConfig[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  const loadConfigs = useCallback(async () => {
    try {
      const res  = await fetch('/api/settings/notification-triggers');
      const data = await res.json();
      setConfigs(data.configs ?? []);
    } catch {
      showToast('error', 'Failed to load trigger configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  function toggleEnabled(eventType: string) {
    setConfigs((prev) => prev.map((c) =>
      c.eventType === eventType ? { ...c, isEnabled: !c.isEnabled } : c,
    ));
    setDirty(true);
  }

  function changeRecipients(eventType: string, recipients: TriggerConfig['recipients']) {
    setConfigs((prev) => prev.map((c) =>
      c.eventType === eventType ? { ...c, recipients } : c,
    ));
    setDirty(true);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notification-triggers', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ configs }),
      });
      if (!res.ok) throw new Error('Save failed');
      setDirty(false);
      showToast('success', 'Notification triggers saved');
    } catch {
      showToast('error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}>
            <Bell className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            Notification Event Triggers
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Control which CRM events generate notifications system-wide and who receives them.
            Changes apply to all users — individual channel preferences (email/SMS) are
            still controlled per-user in Notification Settings.
          </p>
        </div>

        {dirty && (
          <button
            onClick={saveChanges}
            disabled={saving}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border p-4"
           style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Disabling an event here means <strong>no one</strong> receives that notification,
          regardless of their personal preferences. Re-enabling restores delivery for all
          users who have it enabled in their own settings.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Event
              </th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Recipients
              </th>
              <th className="px-4 py-3 text-center font-medium w-24" style={{ color: 'var(--color-text-muted)' }}>
                Enabled
              </th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config, idx) => {
              const meta    = EVENT_META[config.eventType];
              const isLast  = idx === configs.length - 1;
              return (
                <tr
                  key={config.eventType}
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                    opacity: config.isEnabled ? 1 : 0.5,
                  }}
                >
                  {/* Event label + description */}
                  <td className="px-4 py-4">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {meta?.label ?? config.eventType}
                    </p>
                    {meta?.description && (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {meta.description}
                      </p>
                    )}
                  </td>

                  {/* Recipients dropdown */}
                  <td className="px-4 py-4">
                    {meta && meta.recipientOptions.length > 1 ? (
                      <select
                        value={config.recipients}
                        onChange={(e) =>
                          changeRecipients(config.eventType, e.target.value as TriggerConfig['recipients'])
                        }
                        disabled={!config.isEnabled}
                        className="rounded-lg border px-3 py-1.5 text-xs disabled:cursor-not-allowed"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {meta.recipientOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {RECIPIENT_LABELS[opt]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {RECIPIENT_LABELS[config.recipients]}
                      </span>
                    )}
                  </td>

                  {/* Toggle */}
                  <td className="px-4 py-4 text-center">
                    <label className="inline-flex cursor-pointer items-center">
                      <span className="sr-only">
                        {config.isEnabled ? 'Disable' : 'Enable'} {meta?.label}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={config.isEnabled}
                        onChange={() => toggleEnabled(config.eventType)}
                        aria-label={`Toggle ${meta?.label ?? config.eventType}`}
                      />
                      <span
                        className="relative inline-block h-5 w-9 rounded-full transition-colors"
                        style={{
                          backgroundColor: config.isEnabled
                            ? 'var(--color-primary, #6366f1)'
                            : 'var(--color-border, #d1d5db)',
                        }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: config.isEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                        />
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
