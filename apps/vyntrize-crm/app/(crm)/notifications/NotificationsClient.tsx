'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { NotificationItem, type ClientNotification } from '@/components/notifications/NotificationItem';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { Drawer } from '@/components/Drawer';
import { Bell } from '@/components/notifications/notification-icons';

// Client-safe event type mirror (no @platform/vyntrize-db import)
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

const PAGE_SIZE = 25;

const EVENT_TYPE_LABELS: Record<string, string> = {
  [NotificationEventType.LEAD_CREATED]:           'Lead created',
  [NotificationEventType.STAGE_CHANGED]:          'Stage changed',
  [NotificationEventType.TASK_CREATED]:           'Task created',
  [NotificationEventType.TASK_COMPLETED]:         'Task completed',
  [NotificationEventType.CALENDAR_EVENT_CREATED]: 'Calendar event created',
  [NotificationEventType.CALENDAR_EVENT_UPDATED]: 'Calendar event updated',
  [NotificationEventType.AGENT_ACTION_PENDING]:   'AI agent action',
  [NotificationEventType.MEETING_ATTENDED]:       'Meeting attended',
  [NotificationEventType.MEETING_MISSED]:         'Meeting missed',
};

interface NotificationsClientProps {
  initialNotifications: ClientNotification[];
  initialTotalCount:    number;
}

export function NotificationsClient({
  initialNotifications,
  initialTotalCount,
}: NotificationsClientProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [notifications, setNotifications]     = useState<ClientNotification[]>(initialNotifications as ClientNotification[]);
  const [totalCount, setTotalCount]           = useState(initialTotalCount);
  const [loading, setLoading]                 = useState(false);
  const [prefsOpen, setPrefsOpen]             = useState(false);

  // Dismissal modal state
  const [confirmDismissAll, setConfirmDismissAll] = useState(false);
  const [dismissing, setDismissing]               = useState(false);
  const [dismissError, setDismissError]           = useState<string | null>(null);

  // Derive filter + page from URL
  const filter = searchParams.get('filter') ?? 'all';
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ─── Fetch whenever filter or page changes ────────────────────────────────
  const fetchNotifications = useCallback(async (f: string, p: number) => {
    setLoading(true);
    setDismissError(null);
    try {
      let url = `/api/notifications?pageSize=${PAGE_SIZE}&page=${p}`;
      if (f === 'unread')                            url += '&isRead=false';
      else if (f !== 'all' && f in NotificationEventType) url += `&eventType=${f}`;

      const res  = await fetch(url);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setNotifications((data.data ?? []) as ClientNotification[]);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Skip initial fetch — we already have server-side data for page=1, filter=all
  const isInitialLoad = filter === 'all' && page === 1;
  useEffect(() => {
    if (isInitialLoad) return;
    fetchNotifications(filter, page);
  }, [filter, page, isInitialLoad, fetchNotifications]);

  // ─── URL helpers ──────────────────────────────────────────────────────────
  function setFilter(f: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', f);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  // ─── Dismiss all ─────────────────────────────────────────────────────────
  async function handleDismissAll() {
    setDismissing(true);
    setDismissError(null);
    try {
      const res = await fetch('/api/notifications/dismiss-all', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to dismiss');
      setNotifications([]);
      setTotalCount(0);
      setConfirmDismissAll(false);
    } catch {
      setDismissError('Failed to dismiss notifications. Please try again.');
    } finally {
      setDismissing(false);
    }
  }

  function handleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true, readAt: new Date() } as ClientNotification : n),
    );
  }

  function handleDismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
  }

  const ALL_FILTERS = [
    { value: 'all',    label: 'All' },
    { value: 'unread', label: 'Unread' },
    ...Object.values(NotificationEventType).map((et) => ({
      value: et,
      label: EVENT_TYPE_LABELS[et] ?? et,
    })),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary, #111827)' }}>
          Notifications
        </h1>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <button
              onClick={() => setConfirmDismissAll(true)}
              className="text-sm hover:underline"
              style={{ color: 'var(--color-text-secondary, #6b7280)' }}
            >
              Dismiss all
            </button>
          )}
          <button
            onClick={() => setPrefsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-surface-hover,rgba(0,0,0,0.04))]"
            style={{ borderColor: 'var(--color-border, #e5e7eb)', color: 'var(--color-text-secondary, #6b7280)' }}
          >
            <Settings className="h-3.5 w-3.5" />
            Notification Settings
          </button>
        </div>
      </div>

      {/* Dismiss error */}
      {dismissError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {dismissError}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor:      filter === f.value ? 'var(--color-primary, #6366f1)' : 'var(--color-border, #e5e7eb)',
              backgroundColor:  filter === f.value ? 'var(--color-primary, #6366f1)' : 'transparent',
              color:            filter === f.value ? '#ffffff' : 'var(--color-text-secondary, #6b7280)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: 'var(--color-border, #e5e7eb)', backgroundColor: 'var(--color-surface, #ffffff)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-[var(--color-text-tertiary,#9ca3af)]">Loading…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Bell className="h-8 w-8 text-[var(--color-text-tertiary,#9ca3af)]" />
            <span className="text-sm text-[var(--color-text-secondary,#6b7280)]">
              {filter === 'all'    ? "You're all caught up"   :
               filter === 'unread' ? 'No unread notifications' :
               'No notifications for this filter'}
            </span>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={handleRead}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
          >
            Previous
          </button>
          <span className="text-sm text-[var(--color-text-secondary,#6b7280)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Confirm dismiss-all modal */}
      {confirmDismissAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm dismiss all notifications"
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
          >
            <h2 className="mb-2 text-base font-semibold"
                style={{ color: 'var(--color-text-primary, #111827)' }}>
              Dismiss all notifications?
            </h2>
            <p className="mb-6 text-sm text-[var(--color-text-secondary,#6b7280)]">
              This will remove all notifications from your feed. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDismissAll(false)}
                className="rounded-lg border px-4 py-2 text-sm"
                style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDismissAll}
                disabled={dismissing}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#ef4444' }}
              >
                {dismissing ? 'Dismissing…' : 'Dismiss all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences drawer */}
      <Drawer
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title="Notification Settings"
      >
        <NotificationPreferences />
      </Drawer>
    </div>
  );
}
