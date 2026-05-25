'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, ExternalLink, MessageSquare, Send, X, Inbox } from 'lucide-react';
import { AgentTypeBadge } from './AgentTypeBadge';
import type { AgentAction, PaginationInfo } from '@/types/agent-dashboard';

interface InboxViewProps {
  actions: AgentAction[];
  pagination?: PaginationInfo;
  loading: boolean;
  onApprove: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
  onRefresh: () => void;
}

export function InboxView({ actions, pagination, loading, onApprove, onReject, onRefresh }: InboxViewProps) {
  // Only show actions that need human review
  const pendingActions = actions.filter(a => a.status === 'PENDING' && a.autonomyLevel === 'SUGGEST_APPROVE');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first item if nothing is selected
  useEffect(() => {
    if (pendingActions.length > 0 && !selectedId && !loading) {
      setSelectedId(pendingActions[0].id);
    } else if (pendingActions.length === 0 && !loading) {
      setSelectedId(null);
    }
  }, [pendingActions, selectedId, loading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (!selectedId || approving || rejecting) return;

      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        await handleAction(selectedId, 'approve');
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        await handleAction(selectedId, 'reject');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = pendingActions.findIndex(a => a.id === selectedId);
        if (currentIndex < pendingActions.length - 1) {
          setSelectedId(pendingActions[currentIndex + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = pendingActions.findIndex(a => a.id === selectedId);
        if (currentIndex > 0) {
          setSelectedId(pendingActions[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, pendingActions, approving, rejecting]);

  const handleAction = async (id: string, type: 'approve' | 'reject') => {
    if (type === 'approve') setApproving(true);
    else setRejecting(true);
    setError(null);

    try {
      if (type === 'approve') {
        await onApprove(id);
      } else {
        await onReject(id);
      }
      
      // Select the next available action
      const currentIndex = pendingActions.findIndex(a => a.id === id);
      if (pendingActions.length > 1) {
        // If it's the last item, select the one before it, otherwise select the next one
        const nextIndex = currentIndex === pendingActions.length - 1 ? currentIndex - 1 : currentIndex + 1;
        // Wait a tiny bit for the state to update from parent before setting new selection
        setTimeout(() => setSelectedId(pendingActions[nextIndex].id), 50);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${type} action`);
    } finally {
      setApproving(false);
      setRejecting(false);
    }
  };

  const selectedAction = pendingActions.find(a => a.id === selectedId);

  if (loading && pendingActions.length === 0) {
    return (
      <div className="flex h-[600px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="w-1/3 border-r p-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="w-2/3 p-8 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (pendingActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="h-24 w-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <Inbox className="h-10 w-10" style={{ color: 'var(--color-success)' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Inbox Zero!</h2>
        <p className="text-center max-w-md text-lg" style={{ color: 'var(--color-text-muted)' }}>
          There are no pending actions requiring your review. The AI is fully autonomous right now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[700px] rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      {/* ── Left Pane: Inbox List ── */}
      <div className="w-[35%] flex flex-col" style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="px-4 py-3 shrink-0 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Pending Review</h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
            {pendingActions.length} Actions
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pendingActions.map(action => {
            const isSelected = selectedId === action.id;
            return (
              <button
                key={action.id}
                onClick={() => setSelectedId(action.id)}
                className="w-full text-left p-3 rounded-xl transition-all"
                style={{
                  backgroundColor: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'transparent'}`,
                }}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <AgentTypeBadge type={action.agentType} />
                  <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                    {new Date(action.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-medium text-sm mb-1 line-clamp-1" style={{ color: 'var(--color-text)' }}>
                  {action.lead?.contactName || 'Unknown Lead'}
                </div>
                <div className="text-xs line-clamp-2" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {action.actionType.replace(/_/g, ' ')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right Pane: Action Details ── */}
      <div className="w-[65%] flex flex-col">
        {selectedAction ? (
          <>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                    {selectedAction.actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  <Link
                    href={`/leads/${selectedAction.leadId}`}
                    className="inline-flex items-center gap-1.5 text-sm hover:underline font-medium"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {selectedAction.lead?.contactName || 'Unknown Lead'}
                    {selectedAction.lead?.company && ` at ${selectedAction.lead.company}`}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <AgentTypeBadge type={selectedAction.agentType} />
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Reasoning</h3>
                <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text)' }}>
                  {selectedAction.reasoning}
                </div>
              </div>

              {selectedAction.metadata && Object.keys(selectedAction.metadata).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Metadata / Context</h3>
                  <div className="p-4 rounded-xl font-mono text-xs overflow-x-auto" style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text)' }}>
                    <pre>{JSON.stringify(selectedAction.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              {error && (
                <div className="mb-3 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}>
                  {error}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleAction(selectedAction.id, 'approve')}
                    disabled={approving || rejecting}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {approving ? 'Approving...' : 'Approve Action'}
                  </button>
                  <button
                    onClick={() => handleAction(selectedAction.id, 'reject')}
                    disabled={approving || rejecting}
                    className="px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
                    style={{ backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
                  >
                    <XCircle className="h-5 w-5" />
                    {rejecting ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
                
                <div className="hidden md:flex text-xs font-mono space-x-4 shrink-0" style={{ color: 'var(--color-text-subtle)' }}>
                  <span>Press <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-raised)' }}>Y</kbd> to approve</span>
                  <span>Press <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-raised)' }}>N</kbd> to reject</span>
                </div>
              </div>
            </div>
          </>
        ) : (
           <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--color-text-muted)' }}>
             Select an action to review
           </div>
        )}
      </div>
    </div>
  );
}
