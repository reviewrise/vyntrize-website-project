'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from './notification-icons';
import { NotificationPanel } from './NotificationPanel';
import type { ClientNotification } from './NotificationItem';

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_BACKOFF_MS      = 5_000;
const MAX_BACKOFF_MS          = 60_000;
const POLL_INTERVAL_MS        = 30_000;

type SSEStatus = 'connecting' | 'open' | 'closed' | 'polling';

export function NotificationBell() {
  const [unreadCount, setUnreadCount]           = useState(0);
  const [panelOpen, setPanelOpen]               = useState(false);
  const [sseStatus, setSseStatus]               = useState<SSEStatus>('connecting');
  const [latestNotification, setLatestNotification] = useState<ClientNotification | undefined>();

  const sourceRef         = useRef<EventSource | null>(null);
  const pollingRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch unread count ────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  // ─── Start polling fallback ────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already polling
    setSseStatus('polling');
    pollingRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
  }, [fetchUnreadCount]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ─── SSE connection ────────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    setSseStatus('connecting');
    const es = new EventSource('/api/notifications/stream');
    sourceRef.current = es;

    es.onopen = () => {
      setSseStatus('open');
      reconnectAttempts.current = 0;
      stopPolling();
      // Reconcile missed notifications after reconnect
      fetchUnreadCount();
    };

    es.addEventListener('new_notification', (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data) as ClientNotification;
        setUnreadCount((c) => c + 1);
        setLatestNotification(notification);
      } catch {
        // ignore malformed events
      }
    });

    es.onerror = () => {
      es.close();
      sourceRef.current = null;
      setSseStatus('closed');
      startPolling();

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const backoff = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, reconnectAttempts.current),
          MAX_BACKOFF_MS,
        );
        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(connectSSE, backoff);
      }
    };
  }, [fetchUnreadCount, startPolling, stopPolling]);

  // ─── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchUnreadCount();
    // Connect SSE in all environments — Next.js App Router handles long-lived
    // streaming connections fine in dev. Falls back to polling on error.
    connectSSE();

    return () => {
      if (sourceRef.current)     sourceRef.current.close();
      if (pollingRef.current)    clearInterval(pollingRef.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [fetchUnreadCount, connectSSE, startPolling]);

  // ─── Callbacks for child panel ─────────────────────────────────────────────
  function decrementCount(_id: string) {
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  // ─── Badge label ───────────────────────────────────────────────────────────
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="relative">
      <button
        onClick={() => setPanelOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${badgeLabel} unread` : ''}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface-hover,rgba(0,0,0,0.06))] focus:outline-none focus-visible:ring-2"
      >
        <Bell className="h-4 w-4" style={{ color: 'var(--color-text-secondary, #6b7280)' }} />

        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: 'var(--color-primary, #6366f1)', lineHeight: '16px' }}
            aria-hidden="true"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {panelOpen && (
        <NotificationPanel
          onClose={() => setPanelOpen(false)}
          onRead={decrementCount}
          latestNotification={latestNotification}
        />
      )}

      {/* Invisible status indicator for debugging — only in dev */}
      {process.env.NODE_ENV === 'development' && sseStatus === 'polling' && (
        <span className="sr-only">SSE offline — polling</span>
      )}
    </div>
  );
}
