'use client';

import { useState } from 'react';
import { Phone, Users, FileText, CheckSquare, X, Loader2, ChevronDown } from 'lucide-react';

type ActivityType = 'CALL' | 'MEETING' | 'NOTE' | 'TASK_COMPLETE';

interface ActivityLoggerProps {
  leadId: string;
  onLogged?: () => void;
}

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'CALL', label: 'Log Call', icon: Phone, color: '#6366f1' },
  { type: 'MEETING', label: 'Log Meeting', icon: Users, color: '#8b5cf6' },
  { type: 'NOTE', label: 'Add Note', icon: FileText, color: '#0ea5e9' },
  { type: 'TASK_COMPLETE', label: 'Mark Task Done', icon: CheckSquare, color: '#10b981' },
];

const OUTCOMES = ['Positive', 'Neutral', 'No Answer', 'Left Voicemail', 'Scheduled Follow-up'];

export default function ActivityLogger({ leadId, onLogged }: ActivityLoggerProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedConfig = ACTIVITY_TYPES.find(a => a.type === selectedType);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          notes,
          outcome: outcome || undefined,
          durationMinutes: duration ? parseInt(duration) : undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSelectedType(null);
          setNotes('');
          setOutcome('');
          setDuration('');
          setSuccess(false);
          onLogged?.();
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to log activity', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all"
        style={{
          backgroundColor: 'var(--color-raised)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <FileText className="h-3.5 w-3.5" />
        Log Activity
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Log Activity
              </p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Activity type selector */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  ACTIVITY TYPE
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_TYPES.map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all"
                      style={{
                        backgroundColor: selectedType === type ? `${color}18` : 'var(--color-raised)',
                        border: `1px solid ${selectedType === type ? color : 'var(--color-border)'}`,
                        color: selectedType === type ? color : 'var(--color-text)',
                      }}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional fields */}
              {selectedType && (selectedType === 'CALL' || selectedType === 'MEETING') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Outcome
                    </label>
                    <select
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      className="crm-input text-sm"
                    >
                      <option value="">Select...</option>
                      {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 15"
                      className="crm-input text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedType && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {selectedType === 'NOTE' ? 'Note' : 'Additional Notes'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      selectedType === 'CALL' ? 'What was discussed...' :
                      selectedType === 'MEETING' ? 'Meeting summary and next steps...' :
                      selectedType === 'TASK_COMPLETE' ? 'Task completion notes...' :
                      'Write your note...'
                    }
                    rows={3}
                    className="crm-input text-sm resize-none"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!selectedType || submitting || success}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: success ? '#10b981' : (selectedConfig?.color || 'var(--color-primary)'),
                }}
              >
                {success ? '✓ Logged!' : submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Logging...</>
                ) : (
                  <>
                    {selectedConfig && <selectedConfig.icon className="h-4 w-4" />}
                    {selectedConfig ? `Log ${selectedConfig.label.replace('Log ', '').replace('Add ', '').replace('Mark Task ', '')}` : 'Select an activity type'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
