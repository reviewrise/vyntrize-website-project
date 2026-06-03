'use client';

import { useState } from 'react';
import { DealForm } from '@/components/DealForm';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  mode: 'new-button';
  leadId?: string;
  contactId?: string;
  companyId?: string;
}

export function DealsClient({ mode, leadId = '', contactId, companyId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="btn-primary"
        style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        New Deal
      </button>

      {showForm && (
        <DealForm
          leadId={leadId}
          contactId={contactId}
          companyId={companyId}
          onClose={() => setShowForm(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
