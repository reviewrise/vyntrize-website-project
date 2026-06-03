'use client';

import { useState, useTransition } from 'react';
import { recordPayment } from '@/lib/actions/invoices';
import { X, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  invoiceId: string;
  remaining: number;
  currency: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'other', label: 'Other' },
];

export function PaymentForm({ invoiceId, remaining, currency, onClose, onSuccess }: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(String(remaining.toFixed(2)));
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError('Enter a valid amount');
    if (amt > remaining + 0.001) return setError(`Amount exceeds outstanding balance (${currency} ${remaining.toFixed(2)})`);

    startTransition(async () => {
      try {
        await recordPayment(
          invoiceId,
          amt,
          method,
          reference || undefined,
          notes || undefined,
          paidAt ? new Date(paidAt) : undefined,
        );
        onSuccess?.();
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '26rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              Record Payment
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem', borderRadius: '0.375rem' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Remaining badge */}
        <div style={{ padding: '0.75rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Outstanding balance:</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f59e0b' }}>
            {currency} {remaining.toFixed(2)}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Amount ({currency}) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Method */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Payment Method *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Payment Date
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Reference */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Reference / Transaction ID
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize: '0.875rem' }}>Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary" style={{ fontSize: '0.875rem', opacity: isPending ? 0.6 : 1 }}>
              {isPending ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
