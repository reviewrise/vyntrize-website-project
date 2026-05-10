'use client';

import { useState, useEffect } from 'react';
import { X, Search, Zap, CheckCircle } from 'lucide-react';
import type { AgentType } from '@/types/agent-dashboard';
import { AGENT_TYPES } from '@/types/agent-dashboard';

interface ManualTriggerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Lead {
  id: string;
  contactName: string;
  company: string | null;
  stage: string;
}

export function ManualTriggerModal({ onClose, onSuccess }: ManualTriggerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Set<AgentType>>(new Set());
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search leads
  useEffect(() => {
    if (searchQuery.length < 2) {
      setLeads([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/crm/leads?search=${encodeURIComponent(searchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Failed to search leads:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleAgent = (agentType: AgentType) => {
    const newSet = new Set(selectedAgents);
    if (newSet.has(agentType)) {
      newSet.delete(agentType);
    } else {
      newSet.add(agentType);
    }
    setSelectedAgents(newSet);
  };

  const handleTrigger = async () => {
    if (!selectedLead || selectedAgents.size === 0) return;

    setTriggering(true);
    setError(null);
    try {
      const promises = Array.from(selectedAgents).map(async agentType => {
        const res = await fetch('/api/agents/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType,
            leadId: selectedLead.id,
          }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`${agentType}: ${errorData.error || 'Failed to trigger'}`);
        }
        
        return { agentType, success: true };
      });

      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      
      if (failed.length > 0) {
        const errorMessages = failed.map(f => f.reason?.message || 'Unknown error').join('; ');
        throw new Error(errorMessages);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to trigger agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger agents');
    } finally {
      setTriggering(false);
    }
  };

  const availableAgents: Array<{ type: AgentType; label: string; description: string }> = [
    { 
      type: 'LEAD_SCORING', 
      label: 'Lead Scoring', 
      description: 'Analyze and update lead score based on engagement and fit' 
    },
    { 
      type: 'STAGNATION_DETECTION', 
      label: 'Stagnation Detection', 
      description: 'Identify leads that have been inactive for too long' 
    },
    { 
      type: 'EMAIL_GENERATION', 
      label: 'Email Generation', 
      description: 'Generate personalized email content for outreach' 
    },
    { 
      type: 'NEXT_BEST_ACTION', 
      label: 'Next Best Action', 
      description: 'Recommend the optimal next step for this lead' 
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Trigger Agent Manually
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Search Lead */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              1. Select Lead
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or company..."
                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-raised)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>

            {/* Lead Results */}
            {leads.length > 0 && !selectedLead && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setSearchQuery('');
                      setLeads([]);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors"
                    style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {lead.contactName}
                    </p>
                    {lead.company && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {lead.company}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                      Stage: {lead.stage}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Lead */}
            {selectedLead && (
              <div className="mt-2 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--color-primary-soft)', border: '1px solid var(--color-primary)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {selectedLead.contactName}
                  </p>
                  {selectedLead.company && (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {selectedLead.company}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Change
                </button>
              </div>
            )}

            {loading && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Searching...
              </p>
            )}
          </div>

          {/* Step 2: Select Agents */}
          {selectedLead && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                2. Select Agent Types
              </label>
              <div className="space-y-2">
                {availableAgents.map(({ type, label, description }) => (
                  <label
                    key={type}
                    className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selectedAgents.has(type) ? 'var(--color-primary-soft)' : 'var(--color-raised)',
                      border: selectedAgents.has(type) ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgents.has(type)}
                      onChange={() => toggleAgent(type)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {description}
                      </p>
                    </div>
                    {selectedAgents.has(type) && (
                      <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)' }}>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                {error}
              </p>
            </div>
          )}

          {/* Trigger Button */}
          <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-raised)',
                color: 'var(--color-text)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleTrigger}
              disabled={!selectedLead || selectedAgents.size === 0 || triggering}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Zap className="h-4 w-4" />
              {triggering ? 'Triggering...' : `Trigger ${selectedAgents.size} Agent${selectedAgents.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
