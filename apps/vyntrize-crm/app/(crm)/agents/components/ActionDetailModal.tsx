'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, CheckCircle, XCircle, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { AgentTypeBadge } from './AgentTypeBadge';
import type { AgentAction } from '@/types/agent-dashboard';

interface ActionDetailModalProps {
  action: AgentAction;
  onClose: () => void;
  onApprove: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
}

type RejectStep = 'confirm' | 'correct';

export function ActionDetailModal({ action, onClose, onApprove, onReject }: ActionDetailModalProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feedback / correction state
  const [rejectStep, setRejectStep] = useState<RejectStep>('confirm');
  const [correctedSubject, setCorrectedSubject] = useState('');
  const [correctedBody, setCorrectedBody] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Pre-fill from AI draft in metadata if this is an email action
  useEffect(() => {
    const meta = action.metadata as Record<string, any> | null;
    if (meta?.emailDraft) {
      setCorrectedSubject(meta.emailDraft.subject ?? '');
      setCorrectedBody(meta.emailDraft.body ?? '');
    }
  }, [action]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Trap focus within modal
  useEffect(() => {
    const modal = document.getElementById('action-detail-modal');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) { e.preventDefault(); lastElement?.focus(); }
      } else {
        if (document.activeElement === lastElement) { e.preventDefault(); firstElement?.focus(); }
      }
    };

    modal.addEventListener('keydown', handleTab as any);
    firstElement?.focus();
    return () => modal.removeEventListener('keydown', handleTab as any);
  }, []);

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      await onApprove(action.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve action');
    } finally {
      setApproving(false);
    }
  };

  // Step 1: First "Reject" click — show correction UI for email actions
  const handleRejectClick = () => {
    const isEmailAction =
      action.actionType === 'EMAIL_SEND' || action.agentType === 'EMAIL_GENERATION';
    if (isEmailAction) {
      setRejectStep('correct');
    } else {
      handleRejectFinal();
    }
  };

  // Step 2: Actually reject (without correction)
  const handleRejectFinal = async () => {
    setRejecting(true);
    setError(null);
    try {
      await onReject(action.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject action');
    } finally {
      setRejecting(false);
    }
  };

  // Submit correction + reject
  const handleSaveFeedback = async () => {
    setSavingFeedback(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/actions/${action.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctedSubject, correctedBody }),
      });
      if (!res.ok) throw new Error('Failed to save feedback');
      setFeedbackSaved(true);
      // Feedback route already marks as REJECTED; call parent to refresh list
      await onReject(action.id).catch(() => {});
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        id="action-detail-modal"
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {rejectStep === 'correct' ? '✏️ Correct AI Email' : 'Action Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-raised)' }}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── CORRECTION STEP ──────────────────────────────────────────── */}
          {rejectStep === 'correct' ? (
            feedbackSaved ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>
                  Feedback saved!
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  The AI will use your correction to personalise future emails.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#6366f1' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Help the AI learn your style
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Edit the AI draft below. Your version will be used as a few-shot example for future emails — the more you correct, the better the AI gets at sounding like you.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={correctedSubject}
                    onChange={(e) => setCorrectedSubject(e.target.value)}
                    placeholder="Enter corrected subject line..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm"
                    style={{
                      backgroundColor: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Email Body
                  </label>
                  <textarea
                    rows={10}
                    value={correctedBody}
                    onChange={(e) => setCorrectedBody(e.target.value)}
                    placeholder="Paste or type the corrected email body..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm resize-y"
                    style={{
                      backgroundColor: 'var(--color-raised)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      minHeight: '200px',
                    }}
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback || (!correctedSubject && !correctedBody)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#6366f1' }}
                  >
                    <Send className="h-4 w-4" />
                    {savingFeedback ? 'Saving...' : 'Save Feedback & Reject'}
                  </button>
                  <button
                    onClick={handleRejectFinal}
                    disabled={rejecting}
                    className="px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    Skip & Reject
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              {/* ── NORMAL VIEW ────────────────────────────────────────────── */}

              <div className="flex items-center gap-3">
                <AgentTypeBadge type={action.agentType} />
                <StatusBadge status={action.status} />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Lead</h3>
                <Link
                  href={`/leads/${action.leadId}`}
                  className="flex items-center gap-2 text-base font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {action.lead.contactName}
                  <ExternalLink className="h-4 w-4" />
                </Link>
                {action.lead.company && (
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{action.lead.company}</p>
                )}
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Stage: {action.lead.stage}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Action Type</h3>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{formatActionType(action.actionType)}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Reasoning</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{action.reasoning}</p>
              </div>

              {action.metadata && Object.keys(action.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Metadata</h3>
                  <div className="p-4 rounded-lg font-mono text-xs overflow-x-auto" style={{ backgroundColor: 'var(--color-raised)' }}>
                    <pre style={{ color: 'var(--color-text)' }}>{JSON.stringify(action.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Created</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>{new Date(action.createdAt).toLocaleString()}</p>
                </div>
                {action.executedAt && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Executed</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{new Date(action.executedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {action.approvedByUser && (
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Approved By</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {action.approvedByUser.displayName} ({action.approvedByUser.email})
                  </p>
                  {action.approvedAt && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(action.approvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
                </div>
              )}

              {action.status === 'PENDING' && (
                <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button
                    onClick={handleApprove}
                    disabled={approving || rejecting}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approving ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleRejectClick}
                    disabled={approving || rejecting}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    <XCircle className="h-4 w-4" />
                    {rejecting ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatActionType(type: string): string {
  return type.split('_').map(word =>
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}
