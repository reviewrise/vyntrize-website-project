'use client';

import { toast } from 'sonner';
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS, 
  NotificationEventTypeValue,
} from './notification-icons';
import type { ClientNotification } from './NotificationItem';

/**
 * Fire a bottom-right toast for a newly-received notification.
 * Call this from NotificationBell when an SSE new_notification event arrives.
 */
export function showNotificationToast(notification: ClientNotification) {
  const Icon  = NOTIFICATION_ICONS[notification.eventType] ?? NOTIFICATION_ICONS['LEAD_CREATED'];
  const color = NOTIFICATION_COLORS[notification.eventType] ?? '#6366f1';

  toast.custom(
    (t) => (
      <div
        style={{
          display:       'flex',
          alignItems:    'flex-start',
          gap:           '12px',
          background:    'var(--color-surface, #ffffff)',
          border:        `1px solid ${color}30`,
          borderLeft:    `4px solid ${color}`,
          borderRadius:  '12px',
          padding:       '14px 16px',
          boxShadow:     '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          minWidth:      '320px',
          maxWidth:      '380px',
          position:      'relative',
          cursor:        'pointer',
        }}
        onClick={() => toast.dismiss(t)}
      >
        {/* Icon bubble */}
        <span
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '36px',
            height:          '36px',
            borderRadius:    '50%',
            background:      `${color}18`,
            flexShrink:      0,
            marginTop:       '1px',
          }}
        >
          <Icon style={{ width: '16px', height: '16px', color }} />
        </span>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin:     0,
              fontSize:   '13px',
              fontWeight: 600,
              color:      'var(--color-text-primary, #111827)',
              lineHeight: 1.4,
            }}
          >
            {notification.title}
          </p>
          {notification.body && (
            <p
              style={{
                margin:     '3px 0 0',
                fontSize:   '12px',
                color:      'var(--color-text-secondary, #6b7280)',
                lineHeight: 1.4,
                overflow:   'hidden',
                display:    '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {notification.body}
            </p>
          )}
          <p
            style={{
              margin:    '6px 0 0',
              fontSize:  '11px',
              color:     'var(--color-text-tertiary, #9ca3af)',
            }}
          >
            Just now
          </p>
        </div>

        {/* Dismiss × */}
        <button
          aria-label="Dismiss"
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }}
          style={{
            position:   'absolute',
            top:        '10px',
            right:      '10px',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            padding:    '2px',
            color:      'var(--color-text-tertiary, #9ca3af)',
            lineHeight: 1,
            fontSize:   '16px',
          }}
        >
          ×
        </button>
      </div>
    ),
    {
      duration: 6000,
      position: 'bottom-right',
    }
  );
}
