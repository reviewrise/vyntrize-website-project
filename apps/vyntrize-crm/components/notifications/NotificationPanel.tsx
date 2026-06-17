'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from './notification-icons';
import { NotificationItem, type ClientNotification } from './NotificationItem';

interface NotificationPanelProps {
  onClose:             () => void;
  onRead:              (id: string) => void;
  latestNotification?: ClientNotification;
}

export function NotificationPanel({
  onClose,
  onRead,
  latestNotification,
}: NotificationPanelProps) {
  const panelRef                              = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications]     = useState<ClientNotification[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [markingAll, setMarkingAll]           = useState(false);

  // Fetch initial list on open
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res  = await fetch('/api/notifications?pageSize=20');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (!cancelled) setNotifications((data.data ?? []) as ClientNotification[]);
      } catch {
        // silently fail — panel shows empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Prepend new notifications received via SSE
  useEffect(() => {
    if (!latestNotification) return;
    setNotifications((prev) => {
      // Avoid duplicates if the same notification arrives twice
      if (prev.some((n) => n.id === latestNotification.id)) return prev;
      return [latestNotification, ...prev];
    });
  }, [latestNotification]);

  // Outside-click close
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() } as ClientNotification)),
      );
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false);
    }
  }

  function handleDismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true, readAt: new Date() } as ClientNotification : n),
    );
    onRead(id);
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl shadow-2xl"
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e5e7eb)',
      }}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3"
           style={{ borderColor: 'var(--color-border, #e5e7eb)' }}>
        <span className="text-sm font-semibold"
              style={{ color: 'var(--color-text-primary, #111827)' }}>
          Notifications
        </span>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs font-medium hover:underline disabled:opacity-50"
            style={{ color: 'var(--color-primary, #6366f1)' }}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-[var(--color-text-tertiary,#9ca3af)]">Loading…</span>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-2 py-10">
            <Bell className="h-8 w-8 text-[var(--color-text-tertiary,#9ca3af)]" />
            <span className="text-sm text-[var(--color-text-secondary,#6b7280)]">
              You&apos;re all caught up
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

      {/* Footer */}
      {notifications.length >= 20 && (
        <div
          className="border-t px-4 py-2 text-center"
          style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
        >
          <Link
            href="/notifications"
            onClick={onClose}
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--color-primary, #6366f1)' }}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
