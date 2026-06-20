'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Edit2, Save, X, MessageSquare } from 'lucide-react';
import { updateSmsConfig } from './sms-actions';

export function VyntriseSmsCard({ initialKeyPreview }: { initialKeyPreview: string }) {
  const [keyPreview, setKeyPreview] = useState(initialKeyPreview);
  const [isEditing, setIsEditing] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSmsConfig(keyInput);
      setKeyPreview(keyInput ? `${keyInput.substring(0, 8)}...` : '');
      setIsEditing(false);
      setKeyInput('');
    } catch (error) {
      console.error('Failed to save SMS API key', error);
      alert('Failed to save SMS API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-600 text-white shadow-sm flex items-center justify-center border border-pink-700 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Vyntrise SMS</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>Text Messaging Gateway</p>
          </div>
        </div>
        {keyPreview ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
            <XCircle className="h-3 w-3" />
            Not configured
          </span>
        )}
      </div>
      
      <div className="flex-1 mt-2 flex flex-col justify-end space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>API Key</label>
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
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter SMS API Key (or leave blank to disable)"
                className="w-full text-xs font-mono p-2 rounded border"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-text)', backgroundColor: 'var(--color-background)' }}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => { setIsEditing(false); setKeyInput(''); }}
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
              {keyPreview ? (
                <>
                  <span className="flex items-center font-medium text-green-600">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Configured & Active
                  </span>
                  <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 border" style={{ borderColor: 'var(--color-border)' }}>
                    {keyPreview}
                  </span>
                </>
              ) : (
                <span className="flex items-center font-medium text-amber-500"><XCircle className="w-3.5 h-3.5 mr-1.5" /> API Key missing</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
