'use client';

import { useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/admin-auth';
import { deleteAllLeads } from '@/lib/leads';
import { LogOut, ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettings() {
  const router = useRouter();

  function handleLogout() {
    adminLogout();
    router.replace('/admin/login');
  }

  async function handleClearLeads() {
    if (!confirm('Delete ALL leads from the database? This cannot be undone.')) return;
    await deleteAllLeads();
    alert('All leads deleted.');
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Admin panel configuration</p>
      </div>

      {/* Site links */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <div className="px-5 py-3" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Quick links</p>
        </div>
        <div className="divide-y" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          {[
            { label: 'Homepage', href: '/' },
            { label: 'Contact page', href: '/contact' },
            { label: 'Work / Portfolio', href: '/work' },
            { label: 'About page', href: '/about' },
          ].map(l => (
            <Link key={l.href} href={l.href} target="_blank"
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--color-raised)]">
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>{l.label}</span>
              <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Auth */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Authentication</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Admin password is set in <code className="font-mono">lib/admin-auth.ts</code>. Change <code className="font-mono">ADMIN_PASSWORD</code> before deploying to production.
        </p>
        <button onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-5 space-y-3" style={{ border: '1px solid #ef444440', backgroundColor: '#ef444408' }}>
        <p className="text-sm font-semibold text-red-600">Danger zone</p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>These actions are irreversible.</p>
        <button onClick={handleClearLeads}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          style={{ border: '1px solid #ef444440' }}>
          <Trash2 className="h-4 w-4" /> Delete all leads
        </button>
      </div>
    </div>
  );
}
