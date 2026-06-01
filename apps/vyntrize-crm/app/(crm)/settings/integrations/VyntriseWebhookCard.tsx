'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react';
import { updateWebhookSecret } from './webhook-actions';

export function VyntriseWebhookCard({ initialHasSecret }: { initialHasSecret: boolean }) {
  const [hasSecret, setHasSecret] = useState(initialHasSecret);
  const [isEditing, setIsEditing] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWebhookSecret(secretInput);
      setHasSecret(!!secretInput);
      setIsEditing(false);
      setSecretInput('');
    } catch (error) {
      console.error('Failed to save secret', error);
      alert('Failed to save secret');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-sm flex items-center justify-center border border-indigo-700 shrink-0">
            <svg xmlns="http://www.w3.org/Dom/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Vyntrise Chatbot</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>AI Webhook Integration</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      </div>
      
      <div className="flex-1 mt-2 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Webhook URL</label>
          <div className="flex gap-2 items-center">
            <input 
              readOnly 
              value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/vyntrise-booking` : 'https://yourdomain.com/api/webhooks/vyntrise-booking'} 
              className="w-full text-xs font-mono p-2 rounded border bg-gray-50 dark:bg-gray-800"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>Paste this in your agent.vyntrise.com dashboard</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Signing Secret</label>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <input 
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Enter new secret (or leave blank to disable)"
                className="w-full text-xs font-mono p-2 rounded border"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)' }}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => { setIsEditing(false); setSecretInput(''); }}
                  className="px-2 py-1 text-[10px] font-semibold flex items-center gap-1 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 border"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-2 py-1 text-[10px] font-semibold flex items-center gap-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              {hasSecret ? (
                <span className="flex items-center font-medium text-green-600"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Configured & Active</span>
              ) : (
                <span className="flex items-center font-medium text-amber-500"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Not configured (Unsecured)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
