import { InvoiceStatus } from '@platform/vyntrize-db/src/generated/client';

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; color: string }> = {
  DRAFT:          { label: 'Draft',           bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  SENT:           { label: 'Sent',            bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  PARTIALLY_PAID: { label: 'Partially Paid',  bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  PAID:           { label: 'Paid',            bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  OVERDUE:        { label: 'Overdue',         bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  CANCELLED:      { label: 'Cancelled',       bg: 'rgba(100,116,139,0.08)', color: '#94a3b8' },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

const dealStatusConfig: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:    { label: 'Open',    bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  WON:     { label: 'Won',     bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  LOST:    { label: 'Lost',    bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  ON_HOLD: { label: 'On Hold', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
};

export function DealStatusBadge({ status }: { status: string }) {
  const cfg = dealStatusConfig[status] ?? { label: status, bg: '#eee', color: '#333' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
