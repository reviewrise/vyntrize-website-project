'use client';

import { useState, useEffect } from 'react';
import { User, Link2, CheckCircle2, AlertCircle, Loader2, Mail, Phone, Briefcase } from 'lucide-react';

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bookingSlug, setBookingSlug] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/users/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setDisplayName(data.user.displayName || '');
          setEmail(data.user.email || '');
          setBookingSlug(data.user.bookingSlug || '');
          setJobTitle(data.user.jobTitle || '');
          setPhone(data.user.phone || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/crm/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, bookingSlug, jobTitle, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setMessage({ type: 'success', text: 'Profile saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    );
  }

  const bookingUrl = bookingSlug
    ? `${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/book/${bookingSlug}`
    : null;

  const inputClasses = "w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all";
  const inputStyle = {
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>My Profile</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Manage your display name, title, and public booking page. Your name and title appear in email footers sent on your behalf.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl p-6 space-y-6 shadow-sm" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>

        {/* Avatar placeholder */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
            {displayName.charAt(0) || user?.email?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{displayName || user?.email}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {jobTitle || <span className="capitalize">{user?.role?.toLowerCase() || 'Team Member'}</span>}
            </p>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <User className="h-3.5 w-3.5" />
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Abel Legesse"
            className={inputClasses}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              <Briefcase className="h-3.5 w-3.5" />
              Job Title
            </label>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Shown in email footers.
            </p>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputClasses}
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </label>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Shown in email footers.
            </p>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={inputClasses}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <Mail className="h-3.5 w-3.5" />
            Email Address
          </label>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Used to log in. This also appears as your direct contact in email footers.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@vyntrise.com"
            className={inputClasses}
            style={inputStyle}
          />
        </div>

        {/* Booking Slug */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            <Link2 className="h-3.5 w-3.5" />
            Booking Page Slug
          </label>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Creates your personal booking link. Lowercase letters, numbers, and hyphens only.
          </p>
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <span className="px-3 py-2.5 text-sm border-r shrink-0 select-none" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              /book/
            </span>
            <input
              type="text"
              value={bookingSlug}
              onChange={(e) => setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-name"
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
              style={{ color: 'var(--color-text)' }}
            />
          </div>

          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs mt-1 transition-colors"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-h)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            >
              <Link2 className="h-3 w-3" />
              {bookingUrl}
            </a>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: message.type === 'success' ? 'rgb(240 253 244)' : 'rgb(254 242 242)',
              border: `1px solid ${message.type === 'success' ? 'rgb(187 247 208)' : 'rgb(254 202 202)'}`,
              color: message.type === 'success' ? 'rgb(22 101 52)' : 'rgb(153 27 27)',
            }}
          >
            {message.type === 'success'
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />
            }
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
          onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = 'var(--color-primary-h)')}
          onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Info box */}
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>How email footers work</p>
        <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 text-blue-500">•</span>
            Every email you send includes a branded footer with your <strong>name, title, direct email</strong>, and phone number.
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 text-blue-500">•</span>
            The footer also shows the department contact based on your role (sales / support / billing / admin).
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 text-blue-500">•</span>
            Set a booking slug and your profile appears on the public contact page for clients to book directly.
          </li>
        </ul>
      </div>
    </div>
  );
}