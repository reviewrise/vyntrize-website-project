'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, Send, Users, Mail, Calendar, CheckCircle } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
}

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

interface CampaignBuilderProps {
  contacts: Contact[];
  templates: Template[];
}

type Step = 'details' | 'audience' | 'content' | 'schedule' | 'review';

export default function CampaignBuilder({ contacts, templates }: CampaignBuilderProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign data
  const [campaignName, setCampaignName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'details', label: 'Details', icon: Mail },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'content', label: 'Content', icon: Mail },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'review', label: 'Review', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
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

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate
      if (!campaignName) {
        setError('Campaign name is required');
        setLoading(false);
        return;
      }

      // Create draft campaign
      const response = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          subject: subject || 'Untitled',
          body: body || '',
          templateId: selectedTemplate,
          status: 'DRAFT',
          recipients: Array.from(selectedContacts),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const data = await response.json();
      router.push(`/campaigns/${data.campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setLoading(false);
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

      if (selectedContacts.size === 0) {
        setError('Please select at least one recipient');
        setLoading(false);
        return;
      }

      // Prepare scheduled date if needed
      let scheduledAt = null;
      if (scheduleType === 'later' && scheduledDate && scheduledTime) {
        scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
      }

      // Send campaign
      const selectedContactsData = contacts.filter(c => selectedContacts.has(c.id));
      
      const response = await fetch('/api/email/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          subject,
          body,
          templateId: selectedTemplate,
          scheduledAt,
          recipients: selectedContactsData.map(c => ({
            contactId: c.id,
            email: c.email,
            name: `${c.firstName} ${c.lastName}`,
            variables: {
              firstName: c.firstName,
              lastName: c.lastName,
              companyName: c.companyName || '',
            },
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }

      const data = await response.json();
      router.push(`/campaigns/${data.campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return campaignName.trim().length > 0;
      case 'audience':
        return selectedContacts.size > 0;
      case 'content':
        return subject.trim().length > 0 && body.trim().length > 0;
      case 'schedule':
        return scheduleType === 'now' || (scheduledDate && scheduledTime);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <ArrowLeft className="h-3 w-3" /> Campaigns
          </Link>
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={loading || !campaignName}
          className="btn-secondary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
          Create Campaign
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Build and send your email campaign
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p
                  className={`text-xs mt-2 font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                  style={{ marginTop: '-20px' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="crm-card p-6 min-h-[400px]">
        {currentStep === 'details' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Campaign Details
            </h2>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Monthly Newsletter - January 2026"
                className="crm-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                This name is for internal use only and won't be seen by recipients
              </p>
            </div>
          </div>
        )}

        {currentStep === 'audience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Select Audience
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Select All ({contacts.length})
                </span>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
            </p>
            <div className="border rounded-lg" style={{ borderColor: 'var(--color-border)', maxHeight: '400px', overflowY: 'auto' }}>
              {contacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={() => toggleContact(contact.id)}
                    className="cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {contact.email}
                      {contact.companyName && ` · ${contact.companyName}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'content' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Email Content
            </h2>
            
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Use Template (Optional)
                </label>
                <select
                  value={selectedTemplate || ''}
                  onChange={(e) => handleTemplateSelect(Number(e.target.value))}
                  className="crm-input"
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

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="crm-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body (HTML supported)"
                rows={12}
                className="crm-input font-mono text-sm"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                You can use HTML tags. Variables: {'{'}{'{'} firstName {'}'}{'}'}, {'{'}{'{'} lastName {'}'}{'}'}, {'{'}{'{'} companyName {'}'}{'}'}, etc.
              </p>
            </div>
          </div>
        )}

        {currentStep === 'schedule' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Schedule Campaign
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleType === 'now'}
                  onChange={() => setScheduleType('now')}
                  className="cursor-pointer"
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Send Now
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Campaign will be sent immediately
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleType === 'later'}
                  onChange={() => setScheduleType('later')}
                  className="cursor-pointer mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                    Schedule for Later
                  </p>
                  {scheduleType === 'later' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                          Date
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="crm-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                          Time
                        </label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="crm-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Review Campaign
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Campaign Name
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{campaignName}</p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Recipients
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Subject
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{subject}</p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Schedule
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {scheduleType === 'now'
                    ? 'Send immediately'
                    : `Scheduled for ${scheduledDate} at ${scheduledTime}`}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Email Preview
                </p>
                <div
                  className="rounded-lg p-4 text-sm overflow-auto max-h-64 preview-content"
                  style={{
                    backgroundColor: 'var(--color-raised)',
                    border: '1px solid var(--color-border)',
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName.toLowerCase() === 'a') {
                      e.preventDefault();
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0 || loading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {currentStep === 'review' ? (
            <button
              onClick={handleSend}
              disabled={loading || !canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {scheduleType === 'now' ? 'Sending...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
