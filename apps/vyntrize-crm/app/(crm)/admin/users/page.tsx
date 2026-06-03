'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Shield, UserX, UserCheck, Pencil, X, CheckCircle2, AlertCircle, Loader2, Plus, Link2, Mail, User } from 'lucide-react';

interface CrmUser {
  id: string;
  displayName: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  bookingSlug: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({ user, onClose, onSaved }: { user: CrmUser; onClose: () => void; onSaved: (u: CrmUser) => void }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>(user.role);
  const [bookingSlug, setBookingSlug] = useState(user.bookingSlug || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/crm/users/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, displayName, email, role, bookingSlug: bookingSlug || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save.'); return; }
      onSaved(data.user);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.displayName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Edit User</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              <User className="h-3 w-3" /> Display Name
            </label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              <Mail className="h-3 w-3" /> Email Address
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              <Shield className="h-3 w-3" /> Role
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Booking Slug */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              <Link2 className="h-3 w-3" /> Booking Slug
            </label>
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <span className="px-3 py-2.5 text-xs shrink-0 select-none" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg)', borderRight: '1px solid var(--color-border)' }}>
                /book/
              </span>
              <input type="text" value={bookingSlug} onChange={(e) => setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="e.g. jane-smith"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
            </div>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Appears in the "Book an Expert Directly" section. Leave blank to hide.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: 'rgb(254 242 242)', border: '1px solid rgb(254 202 202)', color: 'rgb(153 27 27)' }}>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPageClient() {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<CrmUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [creating, setCreating] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetch('/api/crm/users/admin')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => showToast('error', 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [showToast]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/crm/users/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, displayName: newName, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('error', data.error || 'Failed to create user.'); return; }
      setUsers((prev) => [...prev, data.user]);
      setNewEmail(''); setNewName(''); setNewRole('MEMBER');
      setShowCreate(false);
      showToast('success', `User "${data.user.displayName}" created! Temp password: ${data.tempPassword}`);
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: CrmUser) {
    const action = user.isActive ? 'deactivate' : 'reactivate';
    const res = await fetch('/api/crm/users/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
    });
    const data = await res.json();
    if (!res.ok) { showToast('error', data.error || `Failed to ${action} user.`); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    showToast('success', `User ${user.isActive ? 'deactivated' : 'reactivated'}.`);
  }

  function handleSaved(updated: CrmUser) {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, ...updated } : u));
    setEditingUser(null);
    showToast('success', 'User updated successfully!');
  }

  const inputStyle = { border: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)', color: 'var(--color-text)' };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgb(240 253 244)' : 'rgb(254 242 242)',
            border: `1px solid ${toast.type === 'success' ? 'rgb(187 247 208)' : 'rgb(254 202 202)'}`,
            color: toast.type === 'success' ? 'rgb(22 101 52)' : 'rgb(153 27 27)',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>User Management</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage CRM user accounts, roles, and booking pages.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: 'var(--color-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-h)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
        >
          <Plus className="h-4 w-4" />
          New User
        </button>
      </div>

      {/* Create User Panel */}
      {showCreate && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Create New User</p>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-muted)' }}>Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required
                placeholder="user@vyntrise.com" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-muted)' }}>Display Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required
                placeholder="Jane Smith" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--color-text-muted)' }}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'MEMBER')}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-center gap-3">
              <button type="submit" disabled={creating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <Users className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-bg)' }}>
            {users.map((user, i) => (
              <div key={user.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none', opacity: user.isActive ? 1 : 0.55 }}
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.displayName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{user.displayName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                  {user.bookingSlug && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-primary)' }}>/book/{user.bookingSlug}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: user.role === 'ADMIN' ? '#4f46e520' : '#22263a',
                      color: user.role === 'ADMIN' ? '#818cf8' : 'var(--color-text-muted)',
                    }}>
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span className="text-[10px] font-bold rounded-full px-2.5 py-1 bg-red-900/30 text-red-400">INACTIVE</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditingUser(user)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-raised)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>

                  <button onClick={() => handleToggleActive(user)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      border: '1px solid var(--color-border)',
                      color: user.isActive ? '#f87171' : '#4ade80',
                      backgroundColor: 'var(--color-surface)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-raised)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                  >
                    {user.isActive ? <><UserX className="h-3 w-3" /> Deactivate</> : <><UserCheck className="h-3 w-3" /> Reactivate</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
