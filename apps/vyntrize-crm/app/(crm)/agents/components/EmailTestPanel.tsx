'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmtpStatus {
  configured: boolean;
  initialized: boolean;
  connected: boolean;
  config: {
    host: string | null;
    port: string;
    secure: boolean;
    user: string | null;
    fromAddress: string | null;
    fromName: string | null;
    trackingEnabled: boolean;
  };
}

type CheckState = 'idle' | 'loading' | 'success' | 'error';
type SendState = 'idle' | 'sending' | 'sent' | 'error';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: ok ? '#22c55e' : '#ef4444' }}
    />
  );
}

function ConfigRow({ label, value }: { label: string; value: string | null | boolean }) {
  const display =
    value === null || value === undefined
      ? 'Not set'
      : typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : value;

  const missing = value === null || value === undefined || value === '';

  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span
        className="text-sm font-mono"
        style={{ color: missing ? '#ef4444' : 'var(--color-text)' }}
      >
        {missing ? '⚠ Not configured' : String(display)}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmailTestPanel() {
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [checkError, setCheckError] = useState<string | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Vyntrize CRM — Email Configuration Test');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ messageId?: string; sentAt?: string } | null>(null);

  // ── Check SMTP status ──────────────────────────────────────────────────────

  const checkSmtp = useCallback(async () => {
    setCheckState('loading');
    setCheckError(null);
    setSmtpStatus(null);

    try {
      const res = await fetch('/api/email/test');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check SMTP status');
      }

      setSmtpStatus(data);
      setCheckState('success');
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Unknown error');
      setCheckState('error');
    }
  }, []);

  // Auto-check on mount
  useEffect(() => {
    checkSmtp();
  }, [checkSmtp]);

  // ── Send test email ────────────────────────────────────────────────────────

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setSendState('sending');
    setSendError(null);
    setSendResult(null);

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail.trim(), subject: testSubject.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setSendResult({ messageId: data.messageId, sentAt: data.sentAt });
      setSendState('sent');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unknown error');
      setSendState('error');
    }
  };

  const resetSend = () => {
    setSendState('idle');
    setSendError(null);
    setSendResult(null);
  };

  // ── Derived UI state ───────────────────────────────────────────────────────

  const overallOk = smtpStatus?.connected === true;
  const canSend = overallOk && sendState !== 'sending';

  return (
    <div className="space-y-6">

      {/* ── SMTP Connection Status ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: 'var(--color-primary-subtle, #eff6ff)' }}
            >
              📡
            </div>
            <div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                SMTP Connection
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Verify your email server is reachable
              </p>
            </div>
          </div>

          <button
            onClick={checkSmtp}
            disabled={checkState === 'loading'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
            }}
          >
            {checkState === 'loading' ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking…
              </>
            ) : (
              <>↻ Re-check</>
            )}
          </button>
        </div>

        {/* Status banner */}
        {checkState !== 'idle' && (
          <div
            className="px-6 py-3 flex items-center gap-3 text-sm font-medium border-b"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor:
                checkState === 'loading'
                  ? 'var(--color-surface-alt, #f9fafb)'
                  : checkState === 'error'
                  ? '#fef2f2'
                  : overallOk
                  ? '#f0fdf4'
                  : '#fef9c3',
              color:
                checkState === 'loading'
                  ? 'var(--color-text-muted)'
                  : checkState === 'error'
                  ? '#dc2626'
                  : overallOk
                  ? '#16a34a'
                  : '#92400e',
            }}
          >
            {checkState === 'loading' && (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Connecting to SMTP server…
              </>
            )}
            {checkState === 'error' && (
              <>
                <StatusDot ok={false} />
                {checkError}
              </>
            )}
            {checkState === 'success' && (
              <>
                <StatusDot ok={overallOk} />
                {overallOk
                  ? 'SMTP connection verified — ready to send emails'
                  : smtpStatus?.configured
                  ? 'SMTP is configured but connection failed — check credentials'
                  : 'SMTP is not configured — add credentials to your .env file'}
              </>
            )}
          </div>
        )}

        {/* Config details */}
        {smtpStatus && (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Server
                </p>
                <ConfigRow label="Host" value={smtpStatus.config.host} />
                <ConfigRow label="Port" value={smtpStatus.config.port} />
                <ConfigRow label="TLS / SSL" value={smtpStatus.config.secure} />
                <ConfigRow label="Username" value={smtpStatus.config.user} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Sender
                </p>
                <ConfigRow label="From address" value={smtpStatus.config.fromAddress} />
                <ConfigRow label="From name" value={smtpStatus.config.fromName} />
                <ConfigRow label="Open tracking" value={smtpStatus.config.trackingEnabled} />
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    Status
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <StatusDot ok={smtpStatus.connected} />
                    {smtpStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Send Test Email ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: 'var(--color-primary-subtle, #eff6ff)' }}
          >
            ✉️
          </div>
          <div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
              Send Test Email
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Deliver a test message to confirm end-to-end delivery
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Not configured warning */}
          {smtpStatus && !smtpStatus.configured && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fef9c3', color: '#92400e' }}>
              <strong>SMTP not configured.</strong> Add <code className="font-mono text-xs bg-yellow-100 px-1 rounded">SMTP_HOST</code>,{' '}
              <code className="font-mono text-xs bg-yellow-100 px-1 rounded">SMTP_USER</code>, and{' '}
              <code className="font-mono text-xs bg-yellow-100 px-1 rounded">SMTP_PASSWORD</code> to your{' '}
              <code className="font-mono text-xs bg-yellow-100 px-1 rounded">.env</code> file, then restart the server.
            </div>
          )}

          {/* Success result */}
          {sendState === 'sent' && sendResult && (
            <div className="mb-4 rounded-xl px-4 py-4 text-sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-green-800 mb-1">✅ Test email delivered</p>
                  <p className="text-green-700">
                    Sent to <strong>{testEmail}</strong>
                  </p>
                  {sendResult.messageId && (
                    <p className="text-green-600 text-xs mt-1 font-mono">
                      Message ID: {sendResult.messageId}
                    </p>
                  )}
                  {sendResult.sentAt && (
                    <p className="text-green-600 text-xs mt-0.5">
                      {sendResult.sentAt}
                    </p>
                  )}
                </div>
                <button
                  onClick={resetSend}
                  className="text-xs text-green-700 underline flex-shrink-0"
                >
                  Send another
                </button>
              </div>
            </div>
          )}

          {/* Error result */}
          {sendState === 'error' && sendError && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <p className="font-semibold mb-0.5">❌ Failed to send</p>
              <p>{sendError}</p>
              <button onClick={resetSend} className="mt-2 text-xs underline">
                Try again
              </button>
            </div>
          )}

          {/* Form */}
          {sendState !== 'sent' && (
            <form onSubmit={sendTestEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="test-email-to"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text)' }}
                >
                  Recipient email <span className="text-red-500">*</span>
                </label>
                <input
                  id="test-email-to"
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--color-input-bg, #f9fafb)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="test-email-subject"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text)' }}
                >
                  Subject
                </label>
                <input
                  id="test-email-subject"
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="Vyntrize CRM — Email Configuration Test"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--color-input-bg, #f9fafb)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!canSend || !testEmail.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  {sendState === 'sending' ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send Test Email'
                  )}
                </button>

                {!overallOk && smtpStatus && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Fix SMTP connection first
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Env Reference ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>
          Required environment variables
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {[
            ['SMTP_HOST', 'e.g. smtp.gmail.com'],
            ['SMTP_PORT', 'e.g. 587'],
            ['SMTP_SECURE', 'true for port 465'],
            ['SMTP_USER', 'your SMTP login'],
            ['SMTP_PASSWORD', 'app password / token'],
            ['EMAIL_FROM_ADDRESS', 'noreply@yourdomain.com'],
            ['EMAIL_FROM_NAME', 'Your Company Name'],
            ['EMAIL_REPLY_TO', 'support@yourdomain.com'],
          ].map(([key, hint]) => (
            <div key={key} className="flex items-baseline gap-2 py-1">
              <code
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: 'var(--color-surface-alt, #f3f4f6)', color: 'var(--color-text)' }}
              >
                {key}
              </code>
              <span className="truncate">{hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
