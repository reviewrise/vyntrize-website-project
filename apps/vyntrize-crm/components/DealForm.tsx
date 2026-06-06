'use client';

import { useState, useTransition } from 'react';
import { DealStatus } from '@platform/vyntrize-db/src/generated/client';
import { createDeal, updateDeal } from '@/lib/actions/deals';
import { X, Briefcase } from 'lucide-react';

export type DealLeadOption = {
  id: string;
  title: string;
  contactId: string;
  companyId: string | null;
  contact: { firstName: string; lastName: string };
};

interface DealFormProps {
  leadId?: string;
  contactId?: string;
  companyId?: string;
  leads?: DealLeadOption[];
  /** If provided, the form is in edit mode */
  deal?: {
    id: string;
    title: string;
    value: number | string;
    currency: string;
    status: DealStatus;
    notes?: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: 'OPEN',    label: 'Open' },
  { value: 'WON',     label: 'Won' },
  { value: 'LOST',    label: 'Lost' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

export function DealForm({ leadId, contactId, companyId, leads, deal, onClose, onSuccess }: DealFormProps) {
  const isEdit = !!deal;
  const needsLeadPicker = !isEdit && !leadId;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState(leadId ?? '');

  const selectedLead = leads?.find((l) => l.id === selectedLeadId);
  const resolvedLeadId = leadId ?? selectedLeadId;
  const resolvedContactId = contactId ?? selectedLead?.contactId;
  const resolvedCompanyId = companyId ?? selectedLead?.companyId ?? undefined;

  const [form, setForm] = useState({
    title:    deal?.title    ?? '',
    value:    deal?.value    ? String(deal.value) : '',
    currency: deal?.currency ?? 'USD',
    status:   deal?.status   ?? ('OPEN' as DealStatus),
    notes:    deal?.notes    ?? '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError('Title is required');
    if (!form.value || isNaN(Number(form.value))) return setError('Valid amount is required');
    if (needsLeadPicker && !resolvedLeadId) return setError('Select a lead for this deal');

    startTransition(async () => {
      try {
        if (isEdit && deal) {
          await updateDeal(deal.id, {
            title: form.title,
            value: parseFloat(form.value),
            currency: form.currency,
            status: form.status,
            notes: form.notes || undefined,
          });
        } else {
          await createDeal({
            title: form.title,
            leadId: resolvedLeadId,
            contactId: resolvedContactId,
            companyId: resolvedCompanyId,
            value: parseFloat(form.value),
            currency: form.currency,
            status: form.status,
            notes: form.notes || undefined,
          });
        }
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
          maxWidth: '28rem',
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
            <Briefcase style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              {isEdit ? 'Edit Deal' : 'New Deal'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
              borderRadius: '0.375rem',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {needsLeadPicker && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                Lead *
              </label>
              {leads && leads.length > 0 ? (
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  required
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
                  <option value="">Select a lead…</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.title} — {lead.contact.firstName} {lead.contact.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  No leads yet. Create a lead from the pipeline first.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Deal Title *
            </label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. VyntRise Pro — Annual Plan"
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

          {/* Value + Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                Deal Value *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                placeholder="0.00"
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
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--color-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
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
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Additional context..."
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

          {error && (
            <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || (needsLeadPicker && (!leads || leads.length === 0))}
              className="btn-primary"
              style={{ fontSize: '0.875rem', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
