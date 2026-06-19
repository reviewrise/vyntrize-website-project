'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Client-safe channel / event type constants ───────────────────────────────
// Mirror the Prisma enums without importing @platform/vyntrize-db (server-only).

const NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL:  'EMAIL',
  SMS:    'SMS',
} as const;
type NotificationChannelValue = typeof NotificationChannel[keyof typeof NotificationChannel];

const NotificationEventType = {
  LEAD_CREATED:           'LEAD_CREATED',
  STAGE_CHANGED:          'STAGE_CHANGED',
  TASK_CREATED:           'TASK_CREATED',
  TASK_COMPLETED:         'TASK_COMPLETED',
  CALENDAR_EVENT_CREATED: 'CALENDAR_EVENT_CREATED',
  CALENDAR_EVENT_UPDATED: 'CALENDAR_EVENT_UPDATED',
  AGENT_ACTION_PENDING:   'AGENT_ACTION_PENDING',
  MEETING_ATTENDED:       'MEETING_ATTENDED',
  MEETING_MISSED:         'MEETING_MISSED',
} as const;
type NotificationEventTypeValue = typeof NotificationEventType[keyof typeof NotificationEventType];

// ─── Types ────────────────────────────────────────────────────────────────────

type PreferenceMap = Record<NotificationEventTypeValue, Record<NotificationChannelValue, boolean>>;

const ALL_EVENT_TYPES = Object.values(NotificationEventType) as NotificationEventTypeValue[];

const EVENT_TYPE_LABELS: Record<NotificationEventTypeValue, string> = {
  [NotificationEventType.LEAD_CREATED]:           'New lead created',
  [NotificationEventType.STAGE_CHANGED]:          'Lead stage changed',
  [NotificationEventType.TASK_CREATED]:           'Task assigned to me',
  [NotificationEventType.TASK_COMPLETED]:         'Task I created completed',
  [NotificationEventType.CALENDAR_EVENT_CREATED]: 'Calendar event created',
  [NotificationEventType.CALENDAR_EVENT_UPDATED]: 'Calendar event updated',
  [NotificationEventType.AGENT_ACTION_PENDING]:   'AI agent action needs review',
  [NotificationEventType.MEETING_ATTENDED]:       'Meeting attended',
  [NotificationEventType.MEETING_MISSED]:         'Meeting missed',
};

// Default state per channel when no preference row exists
function defaultPrefs(): PreferenceMap {
  const map = {} as PreferenceMap;
  for (const et of ALL_EVENT_TYPES) {
    map[et] = {
      [NotificationChannel.IN_APP]: true,
      [NotificationChannel.EMAIL]:  false,
      [NotificationChannel.SMS]:    false,
    };
  }
  return map;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationPreferences() {
  const [prefs, setPrefs]       = useState<PreferenceMap>(defaultPrefs());
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the pre-change state for rollback on error
  const prevPrefsRef            = useRef<PreferenceMap>(defaultPrefs());

  // ─── Load preferences ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/notifications/preferences');
        if (!res.ok) throw new Error('Failed to load');
        const rows = await res.json() as Array<{
          eventType: NotificationEventTypeValue;
          channel:   NotificationChannelValue;
          isEnabled: boolean;
        }>;

        const map = defaultPrefs();
        for (const row of rows) {
          if (map[row.eventType]) {
            map[row.eventType][row.channel] = row.isEnabled;
          }
        }
        setPrefs(map);
        prevPrefsRef.current = map;
      } catch {
        showToast('error', 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  // ─── Handle toggle change (optimistic + debounced save) ──────────────────
  function handleToggle(eventType: NotificationEventTypeValue, channel: NotificationChannelValue) {
    setPrefs((prev) => {
      const next = {
        ...prev,
        [eventType]: {
          ...prev[eventType],
          [channel]: !prev[eventType][channel],
        },
      };

      // Debounce the save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => savePrefs(next, prev), 800);

      return next;
    });
  }

  async function savePrefs(next: PreferenceMap, snapshot: PreferenceMap) {
    // Build the preferences array
    const preferences = ALL_EVENT_TYPES.flatMap((et) =>
      [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS].map((ch) => ({
        eventType: et,
        channel:   ch,
        isEnabled: next[et][ch],
      })),
    );

    try {
      const res = await fetch('/api/notifications/preferences', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ preferences }),
      });
      if (!res.ok) throw new Error('Save failed');
      prevPrefsRef.current = next;
    } catch {
      // Revert to snapshot
      setPrefs(snapshot);
      showToast('error', 'Failed to save preferences. Changes reverted.');
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-[var(--color-text-secondary,#6b7280)]">Loading preferences…</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`mb-4 rounded-lg px-4 py-2 text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
              <th className="pb-2 text-left font-medium text-[var(--color-text-secondary,#6b7280)]">
                Event
              </th>
              <th className="pb-2 text-center font-medium text-[var(--color-text-secondary,#6b7280)]">
                In-App
              </th>
              <th className="pb-2 text-center font-medium text-[var(--color-text-secondary,#6b7280)]">
                Email
              </th>
              <th
                className="pb-2 text-center font-medium text-[var(--color-text-secondary,#6b7280)]"
              >
                SMS
              </th>
            </tr>
          </thead>
          <tbody>
            {ALL_EVENT_TYPES.map((et) => (
              <tr
                key={et}
                className="border-b"
                style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
              >
                <td className="py-3 pr-4 text-[var(--color-text-primary,#111827)]">
                  {EVENT_TYPE_LABELS[et]}
                </td>

                {/* IN_APP */}
                <td className="py-3 text-center">
                  <ToggleSwitch
                    checked={prefs[et][NotificationChannel.IN_APP]}
                    onChange={() => handleToggle(et, NotificationChannel.IN_APP)}
                    ariaLabel={`${EVENT_TYPE_LABELS[et]} in-app notifications`}
                  />
                </td>

                {/* EMAIL */}
                <td className="py-3 text-center">
                  <ToggleSwitch
                    checked={prefs[et][NotificationChannel.EMAIL]}
                    onChange={() => handleToggle(et, NotificationChannel.EMAIL)}
                    ariaLabel={`${EVENT_TYPE_LABELS[et]} email notifications`}
                  />
                </td>

                {/* SMS — now active */}
                <td className="py-3 text-center">
                  <ToggleSwitch
                    checked={prefs[et][NotificationChannel.SMS]}
                    onChange={() => handleToggle(et, NotificationChannel.SMS)}
                    ariaLabel={`${EVENT_TYPE_LABELS[et]} SMS notifications`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked:   boolean;
  onChange:  () => void;
  disabled?: boolean;
  ariaLabel: string;
}

function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: ToggleSwitchProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <span className="sr-only">{ariaLabel}</span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <span
        className="relative inline-block h-5 w-9 rounded-full transition-colors"
        style={{
          backgroundColor: checked && !disabled
            ? 'var(--color-primary, #6366f1)'
            : 'var(--color-border, #d1d5db)',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </span>
    </label>
  );
}
