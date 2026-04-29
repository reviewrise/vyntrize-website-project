'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/admin-auth';
import VyntriseLogo from '@/components/VyntriseLogo';
import { Lock, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (adminLogin(password)) {
        router.replace('/admin/dashboard');
      } else {
        setError('Incorrect password.');
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <VyntriseLogo theme="auto" height={32} />
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-raised)' }}>
              <Lock className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Admin access</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>VyntRise control panel</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-raised)',
                  border: `1px solid ${error ? '#ef4444' : 'var(--color-border)'}`,
                  color: 'var(--color-text)',
                }}
              />
              {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          VyntRise Admin · Internal use only
        </p>
      </div>
    </div>
  );
}
