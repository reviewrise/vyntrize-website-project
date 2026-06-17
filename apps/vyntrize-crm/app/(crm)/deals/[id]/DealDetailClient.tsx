'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DealForm } from '@/components/DealForm';
import { InvoiceBuilder } from '@/components/InvoiceBuilder';
import { sendProposal } from '@/lib/actions/deals';
import { Pencil, Plus, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  value: number | string;
  currency: string;
  status: string;
  notes?: string | null;
  leadId: string;
  contactId?: string | null;
  companyId?: string | null;
}

interface Props {
  deal: Deal;
  mode: 'edit-button' | 'new-invoice-button' | 'send-proposal-button';
}

export function DealDetailClient({ deal, mode }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [proposalPending, startProposal] = useTransition();
  const [proposalStatus, setProposalStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [proposalError, setProposalError] = useState<string | null>(null);
  const router = useRouter();

  // ── Edit deal ───────────────────────────────────────────────────────────────
  if (mode === 'edit-button') {
    return (
      <>
        <button
          onClick={() => setShowEdit(true)}
          className="btn-ghost"
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Pencil style={{ width: 13, height: 13 }} />
          Edit
        </button>
        {showEdit && (
          <DealForm
            leadId={deal.leadId}
            deal={{
              id: deal.id,
              title: deal.title,
              value: deal.value,
              currency: deal.currency,
              status: deal.status as 'OPEN' | 'WON' | 'LOST' | 'ON_HOLD',
              notes: deal.notes,
            }}
            onClose={() => setShowEdit(false)}
            onSuccess={() => router.refresh()}
          />
        )}
      </>
    );
  }

  // ── New invoice ─────────────────────────────────────────────────────────────
  if (mode === 'new-invoice-button') {
    return (
      <>
        <button
          onClick={() => setShowInvoice(true)}
          className="btn-primary"
          style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          New Invoice
        </button>
        {showInvoice && (
          <InvoiceBuilder
            dealId={deal.id}
            onClose={() => setShowInvoice(false)}
            onSuccess={() => router.refresh()}
          />
        )}
      </>
    );
  }

  // ── Send proposal ───────────────────────────────────────────────────────────
  async function handleSendProposal() {
    setProposalError(null);
    setProposalStatus('idle');
    startProposal(async () => {
      try {
        await sendProposal(deal.id);
        setProposalStatus('sent');
        setTimeout(() => setProposalStatus('idle'), 4000);
      } catch (err: any) {
        setProposalStatus('error');
        setProposalError(err.message || 'Failed to send proposal.');
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Status feedback */}
      {proposalStatus === 'sent' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'rgb(22 101 52)',
            background: 'rgb(240 253 244)',
            border: '1px solid rgb(187 247 208)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
          }}
        >
          <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
          Proposal sent successfully!
        </div>
      )}
      {proposalStatus === 'error' && proposalError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'rgb(153 27 27)',
            background: 'rgb(254 242 242)',
            border: '1px solid rgb(254 202 202)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
          }}
        >
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          {proposalError}
        </div>
      )}

      <button
        onClick={handleSendProposal}
        disabled={proposalPending || proposalStatus === 'sent'}
        className="btn-primary"
        style={{
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          opacity: proposalPending ? 0.7 : 1,
        }}
      >
        {proposalPending
          ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
          : <Send style={{ width: 13, height: 13 }} />
        }
        {proposalPending ? 'Sending…' : proposalStatus === 'sent' ? 'Proposal Sent ✓' : 'Send Proposal'}
      </button>
    </div>
  );
}
