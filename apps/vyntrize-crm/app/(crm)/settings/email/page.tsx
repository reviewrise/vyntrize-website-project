'use client';

import React, { useState, useEffect } from 'react';
import { EmailTestPanel } from '../../agents/components/EmailTestPanel';

export default function EmailSettingsPage() {
  const [config, setConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromAddress: '',
    fromName: '',
    replyTo: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/settings/email')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setConfig({
            host: data.config.host || '',
            port: data.config.port || 587,
            secure: data.config.secure || false,
            user: data.config.user || '',
            pass: data.config.pass || '',
            fromAddress: data.config.fromAddress || '',
            fromName: data.config.fromName || '',
            replyTo: data.config.replyTo || '',
          });
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
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        body: JSON.stringify(config),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="bg-white p-6 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>SMTP Host</label>
                <input
                  type="text"
                  name="host"
                  value={config.host}
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
                  value={config.port}
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
                checked={config.secure}
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
                  value={config.user}
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
                  value={config.pass}
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
                    value={config.fromName}
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
                    value={config.fromAddress}
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
          <EmailTestPanel />
        </div>
      </div>
    </div>
  );
}
