'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInstallmentPlan } from '@/lib/actions/invoices';
import { Plus, Trash2, Layers, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Installment {
  label: string;
  percentage: string;
  dueDate: string; // ISO date string YYYY-MM-DD
}

interface Props {
  dealId: string;
  dealValue: number;
  currency: string;
  alreadyInvoiced: number; // sum of existing invoices on this deal
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addDays(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  {
    label: '50 / 50',
    icon: '½',
    description: 'Deposit + final',
    items: [
      { label: 'Deposit (50%)', percentage: '50', dueDate: addDays(0) },
      { label: 'Final Payment (50%)', percentage: '50', dueDate: addDays(30) },
    ],
  },
  {
    label: '30 / 40 / 30',
    icon: '⅓',
    description: 'Deposit, milestone, completion',
    items: [
      { label: 'Deposit (30%)', percentage: '30', dueDate: addDays(0) },
      { label: 'Milestone (40%)', percentage: '40', dueDate: addDays(30) },
      { label: 'Completion (30%)', percentage: '30', dueDate: addDays(60) },
    ],
  },
  {
    label: '4 Equal Parts',
    icon: '¼',
    description: 'Monthly quarters',
    items: [
      { label: 'Quarter 1 (25%)', percentage: '25', dueDate: addDays(0) },
      { label: 'Quarter 2 (25%)', percentage: '25', dueDate: addDays(30) },
      { label: 'Quarter 3 (25%)', percentage: '25', dueDate: addDays(60) },
      { label: 'Quarter 4 (25%)', percentage: '25', dueDate: addDays(90) },
    ],
  },
  {
    label: '100% Upfront',
    icon: '1',
    description: 'Full payment now',
    items: [
      { label: 'Full Payment (100%)', percentage: '100', dueDate: addDays(0) },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function InstallmentPlan({ dealId, dealValue, currency, alreadyInvoiced }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'configure' | 'preview'>('configure');
  const invoicedPct = dealValue > 0 ? (alreadyInvoiced / dealValue) * 100 : 0;
  const remaining = dealValue - alreadyInvoiced;
  const remainingPct = 100 - invoicedPct;

  function getSmartPreset(items: Installment[]) {
    if (invoicedPct >= 100) return [];
    
    let skippedPct = 0;
    const smartItems: Installment[] = [];
    
    for (const it of items) {
      const pct = toNum(it.percentage);
      if (skippedPct + pct <= invoicedPct + 0.01) {
        skippedPct += pct;
      } else if (skippedPct < invoicedPct - 0.01) {
        const remainingForThisItem = (skippedPct + pct) - invoicedPct;
        smartItems.push({ ...it, percentage: remainingForThisItem.toString() });
        skippedPct = invoicedPct;
      } else {
        smartItems.push({ ...it });
      }
    }
    return smartItems;
  }

  const [installments, setInstallments] = useState<Installment[]>(() => {
    return getSmartPreset([{ label: 'Deposit (50%)', percentage: '50', dueDate: addDays(0) }, { label: 'Final Payment (50%)', percentage: '50', dueDate: addDays(30) }]);
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const router = useRouter();

  const baseAmount = dealValue;
  const totalPct = installments.reduce((s, i) => s + toNum(i.percentage), 0);
  const pctOk = Math.abs(totalPct - remainingPct) < 0.01;

  function applyPreset(items: Installment[]) {
    setInstallments(getSmartPreset(items));
    setStep('configure');
    setError(null);
  }

  function addInstallment() {
    setInstallments(prev => [
      ...prev,
      { label: `Installment ${prev.length + 1}`, percentage: '', dueDate: addDays(30) },
    ]);
  }

  function remove(idx: number) {
    setInstallments(prev => prev.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: keyof Installment, value: string) {
    setInstallments(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function validate() {
    if (!pctOk) return `Percentages must total ${fmt(remainingPct)}% of the deal. Currently: ${fmt(totalPct)}%`;
    for (const inst of installments) {
      if (!inst.label.trim()) return 'All installments must have a label.';
      if (toNum(inst.percentage) <= 0) return 'All percentages must be greater than 0.';
      if (!inst.dueDate) return 'All installments must have a due date.';
    }
    return null;
  }

  function handlePreview() {
    const err = validate();
    if (err) return setError(err);
    setError(null);
    setStep('preview');
  }

  function handleCreate() {
    startTransition(async () => {
      try {
        const payload = installments.map(inst => ({
          label: inst.label,
          amount: (toNum(inst.percentage) / 100) * baseAmount,
          dueDate: new Date(inst.dueDate),
          notes: `Installment plan: ${inst.label}`,
        }));

        await createInstallmentPlan(dealId, payload, currency);
        setCreatedCount(installments.length);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setStep('configure');
      }
    });
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.625rem',
    background: 'var(--color-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.4rem',
    color: 'var(--color-text)',
    fontSize: '0.8125rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
      }}
    >
      {/* Header toggle */}
      <button
        onClick={() => { setOpen(v => !v); setStep('configure'); }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'none',
          border: 'none',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Installment / Payment Plan</span>
          {alreadyInvoiced > 0 && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
              borderRadius: '9999px', background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)',
            }}>
              {currency} {fmt(remaining)} remaining
            </span>
          )}
        </div>
        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />
          : <ChevronDown style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />}
      </button>

      {open && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Success ── */}
          {createdCount !== null ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              padding: '2rem', textAlign: 'center',
            }}>
              <CheckCircle2 style={{ width: 40, height: 40, color: '#22c55e' }} />
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', margin: 0 }}>
                {createdCount} invoices created successfully!
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                They are now visible in the Invoices table above.
              </p>
              <button
                onClick={() => { setCreatedCount(null); setStep('configure'); setError(null); }}
                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Create another plan
              </button>
            </div>

          ) : step === 'preview' ? (
            /* ── Preview Step ── */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <button
                  onClick={() => setStep('configure')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: 0 }}
                >
                  ← Back
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  Review Payment Plan
                </span>
              </div>

              {/* Summary cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {installments.map((inst, idx) => {
                  const amount = (toNum(inst.percentage) / 100) * baseAmount;
                  const due = new Date(inst.dueDate);
                  const isToday = inst.dueDate === addDays(0);
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      background: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.625rem',
                      gap: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f6ef7, #7c5bf7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                        }}>{idx + 1}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                            {inst.label}
                          </p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            Due: {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isToday && <span style={{ marginLeft: '0.375rem', color: '#f59e0b', fontWeight: 600 }}>· Today</span>}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {currency} {fmt(amount)}
                        </p>
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {toNum(inst.percentage)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total line */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'rgba(79,110,247,0.06)',
                border: '1px solid rgba(79,110,247,0.2)',
                borderRadius: '0.5rem',
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  Total ({installments.length} invoices)
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {currency} {fmt(baseAmount)}
                </span>
              </div>

              {error && (
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.625rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
                  <AlertCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem', borderTop: '1px solid var(--color-border)' }}>
                <button onClick={() => setStep('configure')} className="btn-ghost" style={{ fontSize: '0.8125rem' }}>
                  Edit
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending}
                  className="btn-primary"
                  style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: isPending ? 0.6 : 1 }}
                >
                  {isPending ? 'Creating…' : `Confirm & Create ${installments.length} Invoices`}
                </button>
              </div>
            </>

          ) : (
            /* ── Configure Step ── */
            <>
              {/* Presets */}
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.625rem' }}>
                  Quick Presets
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset.items)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        background: 'var(--color-raised)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{preset.icon}</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text)' }}>{preset.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance reference */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.625rem 1rem',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                    {alreadyInvoiced > 0 ? 'Remaining Balance' : 'Deal Value'}
                  </p>
                  {alreadyInvoiced > 0 && (
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                      {currency} {fmt(dealValue)} deal · {currency} {fmt(alreadyInvoiced)} already invoiced
                    </p>
                  )}
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {currency} {fmt(baseAmount)}
                </span>
              </div>

              {/* Column header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 140px 32px',
                gap: '0.5rem', paddingBottom: '0.375rem',
                borderBottom: '1px solid var(--color-border)',
              }}>
                {['Label', '% of deal', 'Due Date', ''].map(h => (
                  <span key={h} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Installment rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {installments.map((inst, idx) => {
                  const amount = (toNum(inst.percentage) / 100) * baseAmount;
                  return (
                    <div key={idx}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px 32px', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          value={inst.label}
                          onChange={e => update(idx, 'label', e.target.value)}
                          placeholder="e.g. Deposit"
                          style={inputStyle}
                        />
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={inst.percentage}
                          onChange={e => update(idx, 'percentage', e.target.value)}
                          placeholder="%"
                          style={inputStyle}
                        />
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={e => update(idx, 'dueDate', e.target.value)}
                          style={inputStyle}
                        />
                        <button
                          onClick={() => remove(idx)}
                          disabled={installments.length === 1}
                          style={{
                            background: 'none', border: 'none', padding: '0.25rem',
                            cursor: installments.length === 1 ? 'not-allowed' : 'pointer',
                            color: installments.length === 1 ? 'var(--color-text-subtle)' : '#ef4444',
                            display: 'flex', alignItems: 'center',
                          }}
                        >
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                      {toNum(inst.percentage) > 0 && (
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)', paddingLeft: '0.125rem' }}>
                          = {currency} {fmt(amount)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add + total row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={addInstallment}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.75rem', color: 'var(--color-primary)',
                    background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  <Plus style={{ width: 13, height: 13 }} /> Add Installment
                </button>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 700,
                  color: pctOk ? '#22c55e' : '#f59e0b',
                }}>
                  {fmt(totalPct)}% {pctOk ? '✓' : `(must equal ${fmt(remainingPct)}%)`}
                </span>
              </div>

              {error && (
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.625rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
                  <AlertCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem', borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={handlePreview}
                  disabled={!pctOk}
                  className="btn-primary"
                  style={{
                    fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                    opacity: pctOk ? 1 : 0.5,
                    cursor: pctOk ? 'pointer' : 'not-allowed',
                  }}
                >
                  Preview Plan <ArrowRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
