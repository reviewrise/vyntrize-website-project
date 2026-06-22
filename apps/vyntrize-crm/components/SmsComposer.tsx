'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2, Hash } from 'lucide-react';

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  type: string;
  variables: string[] | null;
}

interface SmsComposerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultToName?: string;
  contactId?: string;
  leadId?: string;
  onSuccess?: () => void;
}

const SMS_CHAR_LIMIT = 160;
const MMS_CHAR_LIMIT = 1600;

export default function SmsComposer({
  isOpen,
  onClose,
  defaultTo = '',
  defaultToName = '',
  contactId,
  leadId,
  onSuccess,
}: SmsComposerProps) {
  const [to, setTo] = useState(defaultTo);
  const [toName, setToName] = useState(defaultToName);
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const charCount = message.length;
  const isMultiSms = charCount > SMS_CHAR_LIMIT;
  const segmentCount = charCount === 0 ? 1 : Math.ceil(charCount / SMS_CHAR_LIMIT);

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen]);

  useEffect(() => {
    setTo(defaultTo);
    setToName(defaultToName);
  }, [defaultTo, defaultToName]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/sms/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch SMS templates:', err);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) { setMessage(''); return; }
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) setMessage(tpl.body);
  };

  const handleSend = async () => {
    setError(null);
    if (!to.trim()) { setError('Recipient phone number is required.'); return; }
    if (!message.trim()) { setError('Message body cannot be empty.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          toName: toName.trim() || undefined,
          message: message.trim(),
          contactId: contactId || undefined,
          leadId: leadId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');

      setStatus('sent');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1800);
    } catch (err: any) {
      setStatus('error');
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTo(defaultTo);
    setToName(defaultToName);
    setMessage('');
    setSelectedTemplateId('');
    setError(null);
    setStatus('idle');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(52,211,153,0.15)' }}
            >
              <MessageSquare className="h-4 w-4" style={{ color: '#10b981' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Send SMS</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {toName ? `to ${toName}` : to ? `to ${to}` : 'Compose a text message'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Status messages */}
          {status === 'sent' && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}
            >
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              SMS sent successfully!
            </div>
          )}
          {status === 'error' && error && (
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Phone number */}
          {!defaultTo && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="+15551234567"
                disabled={loading}
                className="w-full rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Must be E.164 format, e.g. +15551234567
              </p>
            </div>
          )}

          {/* Template selector */}
          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                Use Template <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
              >
                <option value="">— Select a template —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3" style={{ color: 'var(--color-text-muted)' }} />
                <span
                  className="text-xs font-mono font-medium"
                  style={{
                    color: charCount > MMS_CHAR_LIMIT
                      ? '#ef4444'
                      : isMultiSms
                      ? '#f59e0b'
                      : 'var(--color-text-muted)',
                  }}
                >
                  {charCount} / {SMS_CHAR_LIMIT}
                  {isMultiSms && ` · ${segmentCount} seg`}
                </span>
              </div>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Type your message… Use {{firstName}}, {{lastName}}, {{companyName}} as variables.`}
              rows={7}
              disabled={loading}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                backgroundColor: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5',
              }}
            />
            {isMultiSms && (
              <p className="mt-1 text-xs" style={{ color: '#f59e0b' }}>
                ⚠ Message exceeds 160 chars — will be split into {segmentCount} segments. Each may be charged separately.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2.5 px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || status === 'sent' || !message.trim() || !to.trim()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity"
            style={{
              backgroundColor: '#10b981',
              opacity: loading || status === 'sent' || !message.trim() || !to.trim() ? 0.55 : 1,
              cursor: loading || status === 'sent' ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : status === 'sent' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Sent!
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send SMS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
