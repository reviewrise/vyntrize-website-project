'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Plus, Pencil, Trash2, X, Save,
  Loader2, CheckCircle2, AlertCircle, FileText, Hash,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SmsTemplateType =
  | 'WELCOME' | 'INITIAL_OUTREACH' | 'FOLLOW_UP'
  | 'CONFIRMATION' | 'MEETING_INVITE' | 'RE_ENGAGEMENT' | 'GENERAL';

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  type: SmsTemplateType;
  variables: string[] | null;
  isShared: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SMS_CHAR_LIMIT = 160;

const TYPE_OPTIONS: { value: SmsTemplateType; label: string }[] = [
  { value: 'GENERAL',          label: 'General' },
  { value: 'WELCOME',          label: 'Welcome' },
  { value: 'INITIAL_OUTREACH', label: 'Initial Outreach' },
  { value: 'FOLLOW_UP',        label: 'Follow-up' },
  { value: 'CONFIRMATION',     label: 'Confirmation' },
  { value: 'MEETING_INVITE',   label: 'Meeting Invite' },
  { value: 'RE_ENGAGEMENT',    label: 'Re-engagement' },
];

const TYPE_COLORS: Record<SmsTemplateType, { color: string; bg: string }> = {
  GENERAL:          { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  WELCOME:          { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  INITIAL_OUTREACH: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  FOLLOW_UP:        { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  CONFIRMATION:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  MEETING_INVITE:   { color: '#1a73e8', bg: 'rgba(26,115,232,0.1)' },
  RE_ENGAGEMENT:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const COMMON_VARIABLES = ['{{firstName}}', '{{lastName}}', '{{companyName}}', '{{email}}', '{{phone}}'];

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', body: '', type: 'GENERAL' as SmsTemplateType };

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: SmsTemplate;
  onEdit: (t: SmsTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const badge = TYPE_COLORS[template.type] ?? TYPE_COLORS.GENERAL;
  const typeLabel = TYPE_OPTIONS.find((o) => o.value === template.type)?.label ?? template.type;
  const charCount = template.body.length;
  const segments = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 group"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
              {template.name}
            </p>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {typeLabel}
            </span>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#ef4444' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body preview */}
      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
        {template.body}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Hash className="h-3 w-3" />
          <span>{charCount} chars · {segments} seg</span>
        </div>
        {template.variables && template.variables.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {(template.variables as string[]).slice(0, 3).map((v) => (
              <span
                key={v}
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)' }}
              >
                {`{{${v}}}`}
              </span>
            ))}
            {template.variables.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                +{template.variables.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Template Form Modal ──────────────────────────────────────────────────────

function TemplateModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: SmsTemplate | null;
  onSave: (data: { name: string; body: string; type: SmsTemplateType }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, body: initial.body, type: initial.type }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const charCount = form.body.length;
  const isMulti   = charCount > SMS_CHAR_LIMIT;
  const segments  = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1;

  const insertVar = (v: string) => setForm((f) => ({ ...f, body: f.body + v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Template name is required.'); return; }
    if (!form.body.trim()) { setError('Message body is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(52,211,153,0.15)' }}>
              <FileText className="h-4 w-4" style={{ color: '#10b981' }} />
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              {initial ? 'Edit Template' : 'New SMS Template'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-raised)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              Template Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Follow-up after demo"
              disabled={saving}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SmsTemplateType }))}
              disabled={saving}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Quick variable insert */}
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>Insert Variable</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_VARIABLES.map((v) => (
                <button
                  key={v}
                  onClick={() => insertVar(v)}
                  disabled={saving}
                  className="text-xs px-2 py-1 rounded font-mono transition-colors"
                  style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                Message Body <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span
                className="text-xs font-mono font-medium"
                style={{ color: isMulti ? '#f59e0b' : 'var(--color-text-muted)' }}
              >
                {charCount} / {SMS_CHAR_LIMIT} · {segments} seg
              </span>
            </div>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Type your SMS message here…"
              rows={7}
              disabled={saving}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: 'var(--color-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
            />
            {isMulti && (
              <p className="mt-1 text-xs" style={{ color: '#f59e0b' }}>
                ⚠ Over 160 characters — will be split into {segments} segments.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.body.trim()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: '#10b981', opacity: saving || !form.name.trim() || !form.body.trim() ? 0.55 : 1 }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SmsTemplateManager() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [toast, setToast]         = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<SmsTemplate | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [filterType, setFilterType] = useState<SmsTemplateType | ''>('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sms/templates');
      if (!res.ok) throw new Error('Failed to load templates');
      setTemplates(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async (data: { name: string; body: string; type: SmsTemplateType }) => {
    if (editing) {
      const res = await fetch(`/api/sms/templates/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, body: data.body, type: data.type }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast('Template updated!');
    } else {
      const res = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast('Template created!');
    }
    setModalOpen(false);
    setEditing(null);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SMS template? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/sms/templates/${id}`, { method: 'DELETE' });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast('Template deleted.');
    } catch {
      showToast('Failed to delete template.');
    } finally {
      setDeleting(null);
    }
  };

  const openNew   = () => { setEditing(null); setModalOpen(true); };
  const openEdit  = (t: SmsTemplate) => { setEditing(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const filtered = filterType
    ? templates.filter((t) => t.type === filterType)
    : templates;

  // Group by type for display
  const grouped = TYPE_OPTIONS.reduce<Record<string, SmsTemplate[]>>((acc, o) => {
    const items = filtered.filter((t) => t.type === o.value);
    if (items.length) acc[o.label] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>SMS Templates</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Reusable message templates for manual and automated SMS sends
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: '#10b981' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Stats + Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <MessageSquare className="h-4 w-4" />
          <span><strong style={{ color: 'var(--color-text)' }}>{templates.length}</strong> templates</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SmsTemplateType | '')}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
        >
          <option value="">All Types</option>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <AlertCircle className="h-8 w-8" style={{ color: '#ef4444' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-raised)' }}>
            <MessageSquare className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>No SMS templates yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Create your first template to speed up outreach.</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white mt-2"
            style={{ backgroundColor: '#10b981' }}
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {group} <span className="ml-1 font-normal normal-case tracking-normal">({items.length})</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg z-50"
          style={{ backgroundColor: '#10b981', color: '#fff' }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TemplateModal
          initial={editing}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
