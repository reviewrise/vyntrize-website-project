'use client';

import { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import EmailComposer from '@/components/EmailComposer';
import EmailHistory from '@/components/EmailHistory';

interface LeadDetailClientProps {
  leadId: string;
  contactEmail: string;
  contactName: string;
}

export default function LeadDetailClient({
  leadId,
  contactEmail,
  contactName,
}: LeadDetailClientProps) {
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsEmailComposerOpen(true)}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <EnvelopeIcon className="h-4 w-4" />
        Send Email
      </button>

      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        defaultTo={contactEmail}
        defaultToName={contactName}
        leadId={leadId}
        onSuccess={() => {
          // Refresh the page to show new email in history
          window.location.reload();
        }}
      />
    </>
  );
}

// Separate export for EmailHistory section
export function LeadEmailHistory({ leadId }: { leadId: string }) {
  return <EmailHistory id={leadId} type="lead" />;
}
