'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Mail, UserCheck, UserX, Bot,
  ExternalLink, ChevronRight, Inbox, RefreshCw,
  Clock, Building2, Zap, ZapOff
} from 'lucide-react';

interface Message {
  id: string;
  type: 'SMS' | 'EMAIL';
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  createdAt: string;
}

interface Conversation {
  leadId: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  company: { name: string } | null;
  assignee: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  aiPaused: boolean;
  stage: string;
  lastActionAt: string;
  lastActionType: string;
  messages: Message[];
}

export function ConversationalInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.conversations ?? []);
      if (!selectedId && data.conversations?.length > 0) {
        setSelectedId(data.conversations[0].leadId);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleAiPause = async (leadId: string, currentPaused: boolean) => {
    setTogglingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/ai-pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: !currentPaused }),
      });
      if (!res.ok) throw new Error('Failed to toggle AI');
      setConversations(prev =>
        prev.map(c => c.leadId === leadId ? { ...c, aiPaused: !currentPaused } : c)
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const selectedConversation = conversations.find(c => c.leadId === selectedId);

  if (loading) {
    return (
      <div className="flex h-[700px] rounded-2xl animate-pulse overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="w-[30%] border-r p-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--color-raised)' }} />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-8 rounded-lg w-1/2" style={{ backgroundColor: 'var(--color-raised)' }} />
          <div className="space-y-3 flex-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: 'var(--color-raised)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={fetchConversations} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
          Retry
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="h-20 w-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
          <MessageSquare className="h-9 w-9" style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>No Active Conversations</h2>
        <p className="text-center max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          The AI hasn't had any conversational interactions yet. When a lead replies via SMS or Email, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[700px] rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

      {/* ── Left Pane: Conversation List ── */}
      <div className="w-[30%] flex flex-col flex-shrink-0" style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>AI Conversations</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{conversations.length} active threads</p>
          </div>
          <button onClick={fetchConversations} className="p-1.5 rounded-lg transition-colors hover:opacity-80">
            <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const isSelected = selectedId === conv.leadId;
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <button
                key={conv.leadId}
                onClick={() => setSelectedId(conv.leadId)}
                className="w-full text-left p-3.5 transition-all border-b"
                style={{
                  backgroundColor: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-2.5">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: conv.aiPaused ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-h))' }}
                  >
                    {conv.contact.firstName[0]}{conv.contact.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {conv.contact.firstName} {conv.contact.lastName}
                      </span>
                      {conv.aiPaused ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
                          Paused
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)' }}>
                          AI Active
                        </span>
                      )}
                    </div>
                    {conv.company && (
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-subtle)' }}>{conv.company.name}</p>
                    )}
                    {lastMsg && (
                      <p className="text-xs truncate mt-1" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {lastMsg.direction === 'OUTBOUND' ? '🤖 ' : '👤 '}{lastMsg.body}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 pl-10">
                  <Clock className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                    {new Date(conv.lastActionAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  {isSelected && <ChevronRight className="h-3 w-3 ml-auto" style={{ color: 'var(--color-primary)' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center Pane: Chat Thread ── */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="px-5 py-3 flex-shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)' }}>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-h))' }}
              >
                {selectedConversation.contact.firstName[0]}{selectedConversation.contact.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                    {selectedConversation.contact.firstName} {selectedConversation.contact.lastName}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                    {selectedConversation.stage}
                  </span>
                </div>
                {selectedConversation.company && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                    <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{selectedConversation.company.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/leads/${selectedConversation.leadId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              >
                View Lead <ExternalLink className="h-3 w-3" />
              </Link>

              <button
                onClick={() => toggleAiPause(selectedConversation.leadId, selectedConversation.aiPaused)}
                disabled={togglingId === selectedConversation.leadId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                style={selectedConversation.aiPaused ? {
                  backgroundColor: 'var(--color-success)',
                  color: '#fff',
                } : {
                  backgroundColor: 'var(--color-danger)',
                  color: '#fff',
                }}
              >
                {togglingId === selectedConversation.leadId ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : selectedConversation.aiPaused ? (
                  <><Zap className="h-3.5 w-3.5" /> Resume AI</>
                ) : (
                  <><UserCheck className="h-3.5 w-3.5" /> Take Over</>
                )}
              </button>
            </div>
          </div>

          {/* AI Paused Banner */}
          {selectedConversation.aiPaused && (
            <div className="px-5 py-2.5 flex items-center gap-2 text-sm font-medium" style={{ backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)', borderBottom: '1px solid var(--color-warning)' }}>
              <ZapOff className="h-4 w-4 flex-shrink-0" />
              AI is paused for this lead. You are in control. Reply manually from the Lead profile.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {selectedConversation.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No messages recorded yet.</p>
              </div>
            ) : (
              selectedConversation.messages.map((msg, i) => {
                const isOutbound = msg.direction === 'OUTBOUND';
                return (
                  <div key={msg.id ?? i} className={`flex gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    {!isOutbound && (
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 self-end" style={{ background: 'linear-gradient(135deg, #6b7280, #9ca3af)' }}>
                        {selectedConversation.contact.firstName[0]}
                      </div>
                    )}
                    <div className="max-w-[70%]">
                      <div
                        className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={isOutbound ? {
                          backgroundColor: 'var(--color-primary)',
                          color: '#fff',
                          borderBottomRightRadius: '4px',
                        } : {
                          backgroundColor: 'var(--color-raised)',
                          color: 'var(--color-text)',
                          borderBottomLeftRadius: '4px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {msg.body}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        {isOutbound && <Bot className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />}
                        {msg.type === 'SMS' ? (
                          <MessageSquare className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                        ) : (
                          <Mail className="h-3 w-3" style={{ color: 'var(--color-text-subtle)' }} />
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {isOutbound && (
                      <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 self-end" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
                        <Bot className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Hint Footer */}
          <div className="px-5 py-3 flex-shrink-0 text-xs" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)', color: 'var(--color-text-subtle)' }}>
            {selectedConversation.aiPaused
              ? '⚠️ AI is paused. Go to the Lead profile to send a manual reply.'
              : '🤖 AI is actively managing this conversation. Click "Take Over" to reply manually.'}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Select a conversation</p>
        </div>
      )}
    </div>
  );
}
