'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Send, Users, MessageSquare,
  Calendar, CheckCircle, Hash, ChevronDown, Search, X,
  AlertCircle, Loader2, Building2,
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  companyName?: string | null;
}

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  type: string;
}

interface SmsCampaignBuilderProps {
  contacts: Contact[];
  templates: SmsTemplate[];
}

type Step = 'details' | 'audience' | 'message' | 'schedule' | 'review';

const SMS_CHAR_LIMIT = 160;
const MMS_CHAR_LIMIT = 1600;

const STEP_LIST: { id: Step; label: string; icon: any }[] = [
  { id: 'details',  label: 'Details',  icon: MessageSquare },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'message',  label: 'Message',  icon: MessageSquare },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'review',   label: 'Review',   icon: CheckCircle },
];

export default function SmsCampaignBuilder({ contacts, templates }: SmsCampaignBuilderProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign data
  const [campaignName, setCampaignName]           = useState('');
  const [selectedContacts, setSelectedContacts]   = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate]   = useState<string>('');
  const [message, setMessage]                     = useState('');
  const [scheduleType, setScheduleType]           = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate]         = useState('');
  const [scheduledTime, setScheduledTime]         = useState('');
  const [contactSearch, setContactSearch]         = useState('');

  // Filtered contacts (only those with phone numbers)
  const phoneContacts = contacts.filter(c => c.phone);
  const filteredContacts = phoneContacts.filter(c => {
    const q = contactSearch.toLowerCase();
    return !q
      || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
      || (c.companyName || '').toLowerCase().includes(q)
      || (c.phone || '').includes(q);
  });

  const currentStepIndex = STEP_LIST.findIndex(s => s.id === currentStep);
  const charCount = message.length;
  const isMultiSms = charCount > SMS_CHAR_LIMIT;
  const segmentCount = charCount === 0 ? 1 : Math.ceil(charCount / SMS_CHAR_LIMIT);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) setMessage(tpl.body);
  };

  const toggleContact = (id: string) => {
    const next = new Set(selectedContacts);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedContacts(next);
  };

  const toggleAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'details':  return campaignName.trim().length > 0;
      case 'audience': return selectedContacts.size > 0;
      case 'message':  return message.trim().length > 0;
      case 'schedule': return scheduleType === 'now' || (!!scheduledDate && !!scheduledTime);
      default:         return true;
    }
  };

  const handleSend = async () => {
    setError(null);
    setLoading(true);
    try {
      const scheduledAt = scheduleType === 'later' && scheduledDate && scheduledTime
        ? `${scheduledDate}T${scheduledTime}:00`
        : null;

      const selectedContactsData = phoneContacts.filter(c => selectedContacts.has(c.id));

      // 1. Create campaign
      const createRes = await fetch('/api/sms/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:       campaignName,
          message,
          templateId: selectedTemplate || null,
          targetType: 'manual',
          status:     scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduledAt,
          recipients: selectedContactsData.map(c => ({ contactId: c.id, phone: c.phone })),
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create campaign');
      const { campaignId } = await createRes.json();

      // 2. If sending now, trigger send
      if (!scheduledAt) {
        const sendRes = await fetch(`/api/sms/campaigns/${campaignId}/send`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            recipients: selectedContactsData.map(c => ({
              contactId: c.id,
              phone:     c.phone,
              name:      `${c.firstName} ${c.lastName}`,
            })),
          }),
        });

        if (!sendRes.ok) throw new Error('Failed to trigger send');
      }

      router.push(`/campaigns/sms/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderDetails = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Campaign Name <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="e.g. Summer Re-engagement SMS"
          className="crm-input w-full"
          autoFocus
        />
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Internal name — recipients won't see this.
        </p>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Select Recipients
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Only contacts with a phone number are shown ({phoneContacts.length} available)
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}
        >
          {selectedContacts.size} selected
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={contactSearch}
          onChange={e => setContactSearch(e.target.value)}
          placeholder="Search contacts..."
          className="crm-input pl-9 w-full"
        />
      </div>

      {/* Select all */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer"
        style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)' }}
        onClick={toggleAll}
      >
        <input
          type="checkbox"
          readOnly
          checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
          className="rounded"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          Select all ({filteredContacts.length})
        </span>
      </div>

      {/* Contact list */}
      <div
        className="rounded-xl overflow-hidden divide-y"
        style={{ border: '1px solid var(--color-border)', maxHeight: '320px', overflowY: 'auto' }}
      >
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Users className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No contacts with phone numbers found</p>
          </div>
        ) : filteredContacts.map(c => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
            style={{ backgroundColor: selectedContacts.has(c.id) ? 'rgba(79,70,229,0.05)' : 'transparent' }}
            onClick={() => toggleContact(c.id)}
            onMouseEnter={e => { if (!selectedContacts.has(c.id)) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-raised)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = selectedContacts.has(c.id) ? 'rgba(79,70,229,0.05)' : 'transparent'; }}
          >
            <input type="checkbox" readOnly checked={selectedContacts.has(c.id)} className="rounded flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {c.firstName} {c.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                {c.phone} {c.companyName ? `· ${c.companyName}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessage = () => (
    <div className="space-y-5">
      {/* Template picker */}
      {templates.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Start from a Template <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateSelect(e.target.value)}
            className="crm-input w-full"
          >
            <option value="">— Choose a template —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Message composer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Message <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-medium"
              style={{
                color: charCount > MMS_CHAR_LIMIT ? '#ef4444' : isMultiSms ? '#f59e0b' : 'var(--color-text-muted)',
              }}
            >
              {charCount}/{SMS_CHAR_LIMIT}
            </span>
            {isMultiSms && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
              >
                <Hash className="h-3 w-3" />{segmentCount} segments
              </span>
            )}
          </div>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
          placeholder="Write your SMS message here... Use {{firstName}}, {{lastName}}, {{companyName}} for personalization."
          className="crm-input w-full resize-none font-mono text-sm"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {['{{firstName}}', '{{lastName}}', '{{companyName}}'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setMessage(m => m + v)}
              className="px-2 py-1 rounded text-xs font-mono transition-colors"
              style={{
                backgroundColor: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: 'now',   label: 'Send Now',    desc: 'Campaign starts immediately' },
          { value: 'later', label: 'Schedule',     desc: 'Pick a date and time' },
        ].map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setScheduleType(opt.value as 'now' | 'later')}
            className="p-4 rounded-xl text-left transition-all"
            style={{
              border: `2px solid ${scheduleType === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
              backgroundColor: scheduleType === opt.value ? 'rgba(79,70,229,0.05)' : 'var(--color-surface)',
            }}
          >
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{opt.label}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{opt.desc}</p>
          </button>
        ))}
      </div>

      {scheduleType === 'later' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="crm-input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="crm-input w-full"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderReview = () => {
    const selectedContactsData = phoneContacts.filter(c => selectedContacts.has(c.id));
    return (
      <div className="space-y-4">
        {[
          { label: 'Campaign Name', value: campaignName },
          { label: 'Recipients',    value: `${selectedContacts.size} contacts` },
          {
            label: 'Schedule',
            value: scheduleType === 'now'
              ? 'Send immediately'
              : `Scheduled for ${scheduledDate} at ${scheduledTime}`,
          },
          {
            label: 'Message segments',
            value: `${segmentCount} SMS segment${segmentCount !== 1 ? 's' : ''} (${charCount} chars)`,
          },
        ].map(item => (
          <div key={item.label} className="flex items-start justify-between py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
            <p className="text-sm font-medium text-right max-w-xs" style={{ color: 'var(--color-text)' }}>{item.value}</p>
          </div>
        ))}

        {/* Message preview */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Message Preview</p>
          <div
            className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono"
            style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            {message || <span style={{ color: 'var(--color-text-muted)' }}>No message written</span>}
          </div>
        </div>

        {/* First 5 recipients preview */}
        {selectedContactsData.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Recipients Preview (showing {Math.min(5, selectedContactsData.length)} of {selectedContactsData.length})
            </p>
            <div className="space-y-1.5">
              {selectedContactsData.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {c.firstName[0]}
                  </div>
                  <span className="font-medium">{c.firstName} {c.lastName}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{c.phone}</span>
                </div>
              ))}
              {selectedContactsData.length > 5 && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  + {selectedContactsData.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const stepContent: Record<Step, () => React.ReactNode> = {
    details:  renderDetails,
    audience: renderAudience,
    message:  renderMessage,
    schedule: renderSchedule,
    review:   renderReview,
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-muted)'; }}
        >
          <ArrowLeft className="h-4 w-4" />
          Campaigns
        </Link>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span className="text-sm" style={{ color: 'var(--color-text)' }}>New SMS Campaign</span>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEP_LIST.map((step, i) => {
          const isDone    = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          const StepIcon  = step.icon;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isDone && setCurrentStep(step.id)}
                disabled={!isDone}
                className="flex flex-col items-center gap-1 group"
                style={{ cursor: isDone ? 'pointer' : 'default' }}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-all text-xs font-bold"
                  style={{
                    backgroundColor: isDone ? '#10b981' : isCurrent ? 'var(--color-primary)' : 'var(--color-raised)',
                    color:           isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                    border:          isCurrent ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <StepIcon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className="text-[10px] font-medium hidden sm:block"
                  style={{ color: isCurrent ? 'var(--color-primary)' : isDone ? '#10b981' : 'var(--color-text-muted)' }}
                >
                  {step.label}
                </span>
              </button>
              {i < STEP_LIST.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2"
                  style={{ backgroundColor: isDone ? '#10b981' : 'var(--color-border)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="crm-card">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            {STEP_LIST[currentStepIndex].label}
          </h2>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {stepContent[currentStep]()}
        </div>

        {/* Footer nav */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => setCurrentStep(STEP_LIST[currentStepIndex - 1].id)}
            disabled={currentStepIndex === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {currentStep === 'review' ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? 'Sending...' : scheduleType === 'later' ? 'Schedule Campaign' : 'Send Campaign'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(STEP_LIST[currentStepIndex + 1].id)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
