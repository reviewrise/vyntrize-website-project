'use client';

import { useState } from 'react';
import { DealForm, type DealLeadOption } from '@/components/DealForm';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  mode: 'new-button';
  leadId?: string;
  contactId?: string;
  companyId?: string;
  leads?: DealLeadOption[];
  hasLeads?: boolean;
  contactCount?: number;
}

export function DealsClient({ mode, leadId, contactId, companyId, leads, hasLeads = true, contactCount = 0 }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const canCreate = hasLeads || !!leadId;
  const disabledTitle = !canCreate
    ? contactCount === 0
      ? 'Add a contact and create a lead on Pipeline before creating a deal'
      : 'Create a lead on Pipeline before creating a deal'
    : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => canCreate && setShowForm(true)}
        disabled={!canCreate}
        title={disabledTitle}
        className="btn-primary"
        style={{
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          opacity: canCreate ? 1 : 0.5,
          cursor: canCreate ? 'pointer' : 'not-allowed',
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        New Deal
      </button>

      {showForm && (
        <DealForm
          leadId={leadId}
          contactId={contactId}
          companyId={companyId}
          leads={leads}
          onClose={() => setShowForm(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
