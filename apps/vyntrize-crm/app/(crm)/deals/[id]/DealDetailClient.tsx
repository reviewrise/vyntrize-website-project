'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DealForm } from '@/components/DealForm';
import { InvoiceBuilder } from '@/components/InvoiceBuilder';
import { Pencil, Plus } from 'lucide-react';

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
  mode: 'edit-button' | 'new-invoice-button';
}

export function DealDetailClient({ deal, mode }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const router = useRouter();

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
