'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/Drawer';
import { updateContact, deleteContact } from '@/lib/actions/contacts';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  companyId: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface ContactEditDrawerProps {
  contact: Contact;
  companies: Company[];
}

export default function ContactEditDrawer({ contact, companies }: ContactEditDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await updateContact(formData);
    setSubmitting(false);
    setIsOpen(false);
    router.refresh();
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    const formData = new FormData(e.currentTarget);
    await deleteContact(formData);
    setIsDeleting(false);
    router.push('/contacts');
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>

      <Drawer open={isOpen} onClose={() => setIsOpen(false)} title="Edit Contact">
        <form onSubmit={handleUpdate} className="space-y-4">
          <input type="hidden" name="id" value={contact.id} />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                First Name *
              </label>
              <input
                name="firstName"
                type="text"
                defaultValue={contact.firstName}
                required
                className="crm-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Last Name *
              </label>
              <input
                name="lastName"
                type="text"
                defaultValue={contact.lastName}
                required
                className="crm-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Email *
            </label>
            <input
              name="email"
              type="email"
              defaultValue={contact.email}
              required
              className="crm-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={contact.phone ?? ''}
              className="crm-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Job Title
            </label>
            <input
              name="jobTitle"
              type="text"
              defaultValue={contact.jobTitle ?? ''}
              className="crm-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Company
            </label>
            <select
              name="companyId"
              defaultValue={contact.companyId ?? ''}
              className="crm-input"
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Delete Section */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Danger Zone
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Deleting this contact will permanently remove all associated data. This action cannot be undone.
          </p>
          <form onSubmit={handleDelete}>
            <input type="hidden" name="id" value={contact.id} />
            <input type="hidden" name="confirmed" value="true" />
            <button
              type="submit"
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Contact'}
            </button>
          </form>
        </div>
      </Drawer>
    </>
  );
}
