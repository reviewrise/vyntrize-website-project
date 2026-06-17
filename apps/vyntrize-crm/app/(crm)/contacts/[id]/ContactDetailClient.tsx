'use client';

import { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import EmailComposer from '@/components/EmailComposer';
import EmailHistory from '@/components/EmailHistory';
import { SendMeetingLinkButton } from '@/components/SendMeetingLinkButton';

interface ContactDetailClientProps {
  contactId: string;
  contactEmail: string;
  contactName: string;
  /** bookingSlug of the session user (or the contact's most-recent lead assignee) */
  bookingSlug?: string | null;
}

export default function ContactDetailClient({
  contactId,
  contactEmail,
  contactName,
  bookingSlug,
}: ContactDetailClientProps) {
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Send Meeting Link */}
        <SendMeetingLinkButton
          to={contactEmail}
          toName={contactName}
          contactId={contactId}
          bookingSlug={bookingSlug}
        />

        {/* Send Email */}
        <button
          onClick={() => setIsEmailComposerOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <EnvelopeIcon className="h-4 w-4" />
          Send Email
        </button>
      </div>

      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        defaultTo={contactEmail}
        defaultToName={contactName}
        contactId={contactId}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}

// Separate export for EmailHistory section
export function ContactEmailHistory({ contactId }: { contactId: string }) {
  return <EmailHistory id={contactId} type="contact" />;
}
