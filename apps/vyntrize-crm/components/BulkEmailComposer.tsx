'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Recipient {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

interface BulkEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  onSuccess?: () => void;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
}

export default function BulkEmailComposer({
  isOpen,
  onClose,
  recipients,
  onSuccess,
}: BulkEmailComposerProps) {
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/crm/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSend = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate
      if (!campaignName || !subject || !body) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (recipients.length === 0) {
        setError('No recipients selected');
        setLoading(false);
        return;
      }

      // Send bulk email
      const response = await fetch('/api/email/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignName,
          subject,
          body,
          templateId: selectedTemplate || undefined,
          recipients: recipients.map(r => ({
            contactId: r.id,
            email: r.email,
            name: r.name,
            variables: {
              firstName: r.firstName,
              lastName: r.lastName,
              companyName: r.companyName || '',
            },
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send bulk email');
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send bulk email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCampaignName('');
    setSubject('');
    setBody('');
    setSelectedTemplate(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Bulk Email</h2>
              <p className="text-sm text-gray-500 mt-1">
                Sending to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Success Message */}
            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-green-800">
                <p className="font-medium">✓ Bulk email campaign created successfully!</p>
                <p className="text-sm mt-1">Emails are being sent in the background.</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-800">
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Recipients Preview */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserGroupIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Recipients ({recipients.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {recipients.slice(0, 20).map((recipient) => (
                  <span
                    key={recipient.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {recipient.name}
                  </span>
                ))}
                {recipients.length > 20 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    +{recipients.length - 20} more
                  </span>
                )}
              </div>
            </div>

            {/* Template Selector */}
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use Template (Optional)
                </label>
                <select
                  value={selectedTemplate || ''}
                  onChange={(e) => handleTemplateSelect(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">-- Select a template --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Monthly Newsletter - January 2026"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body (HTML supported)"
                rows={12}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                You can use HTML tags. Variables: {'{'}{'{'} firstName {'}'}{'}'}, {'{'}{'{'} lastName {'}'}{'}'}, {'{'}{'{'} companyName {'}'}{'}'}, etc.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Each recipient will receive a personalized email with their own variables.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={loading || success}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send to {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
