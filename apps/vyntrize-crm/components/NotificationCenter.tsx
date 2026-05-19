'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Mail, TrendingUp, MessageSquare, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'email_opened' | 'email_clicked' | 'email_replied' | 'score_hot' | 'stage_changed';
  title: string;
  body: string;
  leadId: string;
  leadName: string;
  createdAt: string;
  read: boolean;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  email_opened: Mail,
  email_clicked: TrendingUp,
  email_replied: MessageSquare,
  score_hot: TrendingUp,
  stage_changed: TrendingUp,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  email_opened: '#6366f1',
  email_clicked: '#8b5cf6',
  email_replied: '#10b981',
  score_hot: '#f59e0b',
  stage_changed: '#0ea5e9',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative flex items-center justify-center rounded-lg p-2 transition-all"
        style={{
          backgroundColor: open ? 'var(--color-primary-soft)' : 'var(--color-raised)',
          border: '1px solid var(--color-border)',
          color: open ? 'var(--color-primary)' : 'var(--color-text-muted)',
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold"
            style={{
              backgroundColor: '#ef4444',
              fontSize: '9px',
              minWidth: '16px',
              height: '16px',
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                const color = NOTIFICATION_COLORS[n.type] || 'var(--color-primary)';
                return (
                  <Link
                    key={n.id}
                    href={`/leads/${n.leadId}`}
                    onClick={() => markRead(n.id)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-raised)] block"
                    style={{
                      borderBottom: i < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: n.read ? 'transparent' : `${color}08`,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
                        {n.title}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {n.body}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {/* Unread dot */}
                    {!n.read && (
                      <div
                        className="flex-shrink-0 h-2 w-2 rounded-full mt-2"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
