'use client';

import { useState, useTransition } from 'react';
import { createInvoice, updateInvoice } from '@/lib/actions/invoices';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { X } from 'lucide-react';

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface InvoiceBuilderProps {
  dealId: string;
  /** If provided → edit mode */
  invoice?: {
    id: string;
    dueDate: Date | string;
    taxRate?: number | string | null;
    discount?: number | string | null;
    notes?: string | null;
    lineItems: { description: string; quantity: number | string; unitPrice: number | string }[];
  };
  onClose: () => void;
  onSuccess?: () => void;
}

function toNum(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function InvoiceBuilder({ dealId, invoice, onClose, onSuccess }: InvoiceBuilderProps) {
  const isEdit = !!invoice;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dueDateStr = invoice?.dueDate
    ? new Date(invoice.dueDate).toISOString().split('T')[0]
    : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [dueDate, setDueDate] = useState(dueDateStr);
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ? String(invoice.taxRate) : '');
  const [discount, setDiscount] = useState(invoice?.discount ? String(invoice.discount) : '');
  const [notes, setNotes] = useState(invoice?.notes ?? '');
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems.length
      ? invoice.lineItems.map((li) => ({
          description: li.description,
          quantity: String(li.quantity),
          unitPrice: String(li.unitPrice),
        }))
      : [{ description: '', quantity: '1', unitPrice: '' }],
  );

  function addLine() {
    setLineItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '' }]);
  }

  function removeLine(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof LineItem, value: string) {
    setLineItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, [field]: value } : li)));
  }

  // Live totals
  const subtotal = lineItems.reduce((s, li) => s + toNum(li.quantity) * toNum(li.unitPrice), 0);
  const discountAmt = toNum(discount);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxRate ? taxable * (toNum(taxRate) / 100) : 0;
  const total = taxable + taxAmt;

  function fmt(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedLines = lineItems.map((li) => ({
      description: li.description,
      quantity: toNum(li.quantity),
      unitPrice: toNum(li.unitPrice),
    }));

    if (parsedLines.some((li) => !li.description.trim() || li.quantity <= 0 || li.unitPrice <= 0)) {
      return setError('All line items need a description, quantity, and price');
    }
    if (!dueDate) return setError('Due date is required');

    startTransition(async () => {
      try {
        const payload = {
          dealId,
          dueDate: new Date(dueDate),
          lineItems: parsedLines,
          taxRate: taxRate ? parseFloat(taxRate) : undefined,
          discount: discount ? parseFloat(discount) : undefined,
          notes: notes || undefined,
        };

        if (isEdit && invoice) {
          await updateInvoice(invoice.id, payload);
        } else {
          await createInvoice(payload);
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '42rem',
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
            <Receipt style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              {isEdit ? 'Edit Invoice' : 'New Invoice'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem', borderRadius: '0.375rem' }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Due date + Tax + Discount row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="e.g. 16"
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
                Discount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
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
          </div>

          {/* Line Items */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Line Items
              </label>
              <button
                type="button"
                onClick={addLine}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                Add Line
              </button>
            </div>

            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 120px 36px',
                gap: '0.5rem',
                paddingBottom: '0.375rem',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '0.5rem',
              }}
            >
              {['Description', 'Qty', 'Unit Price', ''].map((h) => (
                <span key={h} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {lineItems.map((li, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 36px', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    value={li.description}
                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                    placeholder="Service description"
                    style={{
                      padding: '0.4rem 0.625rem',
                      background: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.4rem',
                      color: 'var(--color-text)',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={li.quantity}
                    onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                    style={{
                      padding: '0.4rem 0.625rem',
                      background: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.4rem',
                      color: 'var(--color-text)',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={li.unitPrice}
                    onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    style={{
                      padding: '0.4rem 0.625rem',
                      background: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.4rem',
                      color: 'var(--color-text)',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lineItems.length === 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                      color: lineItems.length === 1 ? 'var(--color-text-subtle)' : '#ef4444',
                      padding: '0.25rem',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div
            style={{
              marginLeft: 'auto',
              width: '14rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            {[
              { label: 'Subtotal', value: `$${fmt(subtotal)}` },
              ...(discountAmt > 0 ? [{ label: 'Discount', value: `-$${fmt(discountAmt)}` }] : []),
              ...(taxAmt > 0 ? [{ label: `Tax (${taxRate}%)`, value: `$${fmt(taxAmt)}` }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.375rem', borderTop: '1px solid var(--color-border)', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>Total</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>${fmt(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
              Notes / Terms
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Payment terms, bank details, etc."
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
              style={{ fontSize: '0.875rem', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
