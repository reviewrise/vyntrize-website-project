'use client';

import { useState } from 'react';
import { EnvelopeIcon, ChatBubbleLeftIcon, CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import EmailComposer from '@/components/EmailComposer';
import EmailHistory from '@/components/EmailHistory';
import { SendMeetingLinkButton } from '@/components/SendMeetingLinkButton';
import SmsComposer from '@/components/SmsComposer';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ContactDetailClientProps {
  contactId: string;
  contactEmail: string;
  contactName: string;
  contactPhone?: string | null;
  /** bookingSlug of the session user (or the contact's most-recent lead assignee) */
  bookingSlug?: string | null;
}

export default function ContactDetailClient({
  contactId,
  contactEmail,
  contactName,
  contactPhone,
  bookingSlug,
}: ContactDetailClientProps) {
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span>Send...</span>
            <ChevronDownIcon className="h-4 w-4" />
          </Menu.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsEmailComposerOpen(true)}
                      className={`${
                        active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm`}
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Email
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsMeetingOpen(true)}
                      className={`${
                        active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm`}
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                      Schedule Meeting
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsSmsOpen(true)}
                      className={`${
                        active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm`}
                    >
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      SMS
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
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

      <SendMeetingLinkButton
        to={contactEmail}
        toName={contactName}
        contactId={contactId}
        bookingSlug={bookingSlug}
        isOpen={isMeetingOpen}
        onClose={() => setIsMeetingOpen(false)}
      />

      <SmsComposer
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        defaultTo={contactPhone || ''}
        defaultToName={contactName}
        contactId={contactId}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}

// Separate export for EmailHistory section
export function ContactEmailHistory({ contactId }: { contactId: string }) {
  return <EmailHistory id={contactId} type="contact" />;
}
