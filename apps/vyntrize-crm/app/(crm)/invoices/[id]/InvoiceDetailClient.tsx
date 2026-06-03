'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendInvoice } from '@/lib/actions/invoices';
import { PaymentForm } from '@/components/PaymentForm';
import { InvoiceBuilder } from '@/components/InvoiceBuilder';
import { Send, Download, CreditCard, Pencil, Printer, Zap, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';

interface InvoiceSnap {
  id: string;
  status: string;
  currency: string;
  dealId: string;
  dueDate: Date | string;
  taxRate?: number | string | null;
  discount?: number | string | null;
  notes?: string | null;
  lineItems: { description: string; quantity: number | string; unitPrice: number | string }[];
  // Stripe fields
  stripeInvoiceId?: string | null;
  stripePaymentUrl?: string | null;
  stripeStatus?: string | null;
}

interface Props {
  invoice: InvoiceSnap;
  remaining: number;
}

export function InvoiceDetailClient({ invoice, remaining }: Props) {
  const [showPayment, setShowPayment] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [sendPending, startSend] = useTransition();
  const [stripePending, startStripe] = useTransition();
  const [refreshPending, startRefresh] = useTransition();
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripePaymentUrl, setStripePaymentUrl] = useState<string | null>(
    invoice.stripePaymentUrl ?? null
  );
  const [isSynced, setIsSynced] = useState(!!invoice.stripeInvoiceId);
  const router = useRouter();

  function handlePrint() {
    window.open(`/invoices/${invoice.id}/print`, '_blank');
  }

  async function handleSend() {
    startSend(async () => {
      await sendInvoice(invoice.id);
      router.refresh();
    });
  }

  async function handleStripeSync() {
    setStripeError(null);
    startStripe(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoice.id}/sync`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setStripeError(data.error ?? 'Failed to sync to Stripe');
          return;
        }
        setIsSynced(true);
        setStripePaymentUrl(data.paymentUrl ?? null);
        router.refresh();
      } catch {
        setStripeError('Network error. Please try again.');
      }
    });
  }

  async function handleStripeRefresh() {
    startRefresh(async () => {
      const res = await fetch(`/api/invoices/${invoice.id}/sync`);
      if (res.ok) router.refresh();
    });
  }

  const isDraft = invoice.status === 'DRAFT';
  const isPaid = invoice.status === 'PAID';
  const canSyncToStripe = !isSynced && (isDraft || invoice.status === 'SENT');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* ── Stripe Payment URL Banner ────────────────────────────────── */}
      {stripePaymentUrl && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 1rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          flexWrap: 'wrap',
        }}>
          <CheckCircle style={{ width: 15, height: 15, color: '#4ade80', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8', flex: 1 }}>
            Stripe invoice sent — client can pay online
          </span>
          <a
            href={stripePaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#60a5fa',
              textDecoration: 'none',
              padding: '0.375rem 0.75rem',
              background: 'rgba(59,130,246,0.15)',
              borderRadius: '0.375rem',
              border: '1px solid rgba(59,130,246,0.3)',
            }}
          >
            Open Payment Page
            <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
          <button
            onClick={handleStripeRefresh}
            disabled={refreshPending}
            title="Refresh status from Stripe"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: refreshPending ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {stripeError && (
        <div style={{
          padding: '0.5rem 0.875rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          color: '#b91c1c',
        }}>
          {stripeError}
        </div>
      )}

      {/* ── Action Buttons ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Edit — only for draft */}
        {isDraft && (
          <>
            <button
              onClick={() => setShowEdit(true)}
              className="btn-ghost"
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <Pencil style={{ width: 13, height: 13 }} />
              Edit
            </button>
            {showEdit && (
              <InvoiceBuilder
                dealId={invoice.dealId}
                invoice={invoice}
                onClose={() => setShowEdit(false)}
                onSuccess={() => router.refresh()}
              />
            )}
          </>
        )}

        {/* Mark as Sent — only for draft */}
        {isDraft && (
          <button
            onClick={handleSend}
            disabled={sendPending}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: sendPending ? 0.6 : 1 }}
          >
            <Send style={{ width: 13, height: 13 }} />
            {sendPending ? 'Sending…' : 'Mark as Sent'}
          </button>
        )}

        {/* Sync to Stripe */}
        {canSyncToStripe && (
          <button
            onClick={handleStripeSync}
            disabled={stripePending}
            className="btn-primary"
            style={{
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              opacity: stripePending ? 0.7 : 1,
              background: 'linear-gradient(135deg, #635bff, #0070f3)',
              border: 'none',
            }}
          >
            <Zap style={{ width: 13, height: 13 }} />
            {stripePending ? 'Syncing to Stripe…' : 'Send via Stripe'}
          </button>
        )}

        {/* Already synced badge */}
        {isSynced && !stripePaymentUrl && (
          <span style={{
            fontSize: '0.75rem',
            color: '#64748b',
            padding: '0.25rem 0.5rem',
            background: '#f1f5f9',
            borderRadius: '0.25rem',
            border: '1px solid #e2e8f0',
          }}>
            Synced to Stripe ✓
          </span>
        )}

        {/* Record Payment — only if not fully paid */}
        {!isPaid && remaining > 0 && (
          <>
            <button
              onClick={() => setShowPayment(true)}
              className="btn-ghost"
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <CreditCard style={{ width: 13, height: 13 }} />
              Record Payment
            </button>
            {showPayment && (
              <PaymentForm
                invoiceId={invoice.id}
                remaining={remaining}
                currency={invoice.currency}
                onClose={() => setShowPayment(false)}
                onSuccess={() => router.refresh()}
              />
            )}
          </>
        )}

        {/* Print / PDF */}
        <button
          onClick={handlePrint}
          className="btn-ghost"
          style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Printer style={{ width: 13, height: 13 }} />
          Print / PDF
        </button>
      </div>
    </div>
  );
}

