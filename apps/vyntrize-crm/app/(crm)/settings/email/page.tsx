'use client';

import React, { useState, useEffect } from 'react';
import { EmailTestPanel } from '../../agents/components/EmailTestPanel';

type EmailRole = 'admin' | 'sales' | 'billing' | 'support';

export default function EmailSettingsPage() {
  const [activeRole, setActiveRole] = useState<EmailRole>('admin');
  const [configs, setConfigs] = useState<Record<EmailRole, any>>({
    admin: { host: '', port: 587, secure: false, user: '', pass: '', fromAddress: '', fromName: '', replyTo: '' },
    sales: { host: '', port: 587, secure: false, user: '', pass: '', fromAddress: '', fromName: '', replyTo: '' },
    billing: { host: '', port: 587, secure: false, user: '', pass: '', fromAddress: '', fromName: '', replyTo: '' },
    support: { host: '', port: 587, secure: false, user: '', pass: '', fromAddress: '', fromName: '', replyTo: '' },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/settings/email')
      .then(res => res.json())
      .then(data => {
        if (data.configs) {
          const loadedConfigs: any = { ...configs };
          for (const role of ['admin', 'sales', 'billing', 'support'] as EmailRole[]) {
            const roleConfig = data.configs[role] || {};
            loadedConfigs[role] = {
              host: roleConfig.host || '',
              port: roleConfig.port || 587,
              secure: roleConfig.secure || false,
              user: roleConfig.user || '',
              pass: roleConfig.pass || '',
              fromAddress: roleConfig.fromAddress || '',
              fromName: roleConfig.fromName || '',
              replyTo: roleConfig.replyTo || '',
            };
          }
          setConfigs(loadedConfigs);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load email settings', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfigs(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: activeRole, ...configs[activeRole] }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Email settings saved successfully.' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading email settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Email Configuration</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Configure SMTP settings for outgoing emails from Vyntrize CRM.
        </p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 mb-6 pb-px overflow-x-auto">
        {(['admin', 'sales', 'billing', 'support'] as EmailRole[]).map((role) => (
          <button
            key={role}
            onClick={() => {
              setActiveRole(role);
              setMessage({ type: '', text: '' });
            }}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeRole === role 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            style={activeRole === role ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : {}}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)} Settings
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="bg-white p-6 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-lg font-semibold capitalize mb-4">{activeRole} Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>SMTP Host</label>
                <input
                  type="text"
                  name="host"
                  value={configs[activeRole].host}
                  onChange={handleChange}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>SMTP Port</label>
                <input
                  type="number"
                  name="port"
                  value={configs[activeRole].port}
                  onChange={handleChange}
                  placeholder="587"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="secure"
                id="secure"
                checked={configs[activeRole].secure}
                onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="secure" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Use SSL/TLS (Secure Connection)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Username / Email</label>
                <input
                  type="text"
                  name="user"
                  value={configs[activeRole].user}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Password / App Password</label>
                <input
                  type="password"
                  name="pass"
                  value={configs[activeRole].pass}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Sender Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>From Name</label>
                  <input
                    type="text"
                    name="fromName"
                    value={configs[activeRole].fromName}
                    onChange={handleChange}
                    placeholder="e.g. Vyntrize CRM"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>From Address</label>
                  <input
                    type="email"
                    name="fromAddress"
                    value={configs[activeRole].fromAddress}
                    onChange={handleChange}
                    placeholder="noreply@vyntrize.com"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Test Panel */}
        <div>
          <EmailTestPanel role={activeRole} />
        </div>
      </div>
    </div>
  );
}
