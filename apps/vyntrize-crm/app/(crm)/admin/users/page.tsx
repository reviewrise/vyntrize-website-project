import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { createUser, updateUserRole, deactivateUser } from '@/lib/actions/users';
import { Users, Shield, UserX } from 'lucide-react';

export default async function UsersPage() {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');
    if (session.role !== 'ADMIN') {
        return (
            <div className="p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Access denied. Admin role required.
                </p>
            </div>
        );
    }

    const users = await prisma.crmUser.findMany({
        orderBy: { createdAt: 'asc' },
    });

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                    User Management
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Manage CRM user accounts and permissions.
                </p>
            </div>

            {/* Create User Form */}
            <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Create New User
                </h2>
                <form action={async (formData: FormData) => { "use server"; await createUser(formData); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                            placeholder="user@vyntrise.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Display Name
                        </label>
                        <input
                            name="displayName"
                            type="text"
                            required
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                            placeholder="Jane Smith"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Role
                        </label>
                        <select
                            name="role"
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                            Create User
                        </button>
                    </div>
                </form>
            </div>

            {/* Users Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
            >
                <div
                    className="px-5 py-4"
                    style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {users.length} user{users.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-bg)' }}>
                    {users.map((user, i) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between px-5 py-4"
                            style={{
                                borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none',
                                opacity: user.isActive ? 1 : 0.5,
                            }}
                        >
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {user.displayName}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    {user.email}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className="text-[10px] font-bold rounded-full px-2.5 py-1"
                                    style={{
                                        backgroundColor: user.role === 'ADMIN' ? '#4f46e520' : '#22263a',
                                        color: user.role === 'ADMIN' ? '#818cf8' : 'var(--color-text-muted)',
                                    }}
                                >
                                    {user.role}
                                </span>

                                {!user.isActive && (
                                    <span className="text-[10px] font-bold rounded-full px-2.5 py-1 bg-red-900/30 text-red-400">
                                        INACTIVE
                                    </span>
                                )}

                                {user.isActive && (
                                    <div className="flex items-center gap-2">
                                        <form action={async (formData: FormData) => { "use server"; await updateUserRole(formData); }}>
                                            <input type="hidden" name="userId" value={user.id} />
                                            <input
                                                type="hidden"
                                                name="role"
                                                value={user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'}
                                            />
                                            <button
                                                type="submit"
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                                                style={{
                                                    backgroundColor: 'var(--color-raised)',
                                                    color: 'var(--color-text-muted)',
                                                    border: '1px solid var(--color-border)',
                                                }}
                                                title={`Switch to ${user.role === 'ADMIN' ? 'Member' : 'Admin'}`}
                                            >
                                                <Shield className="h-3 w-3" />
                                                {user.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                                            </button>
                                        </form>

                                        <form action={async (formData: FormData) => { "use server"; await deactivateUser(formData); }}>
                                            <input type="hidden" name="userId" value={user.id} />
                                            <button
                                                type="submit"
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-red-400"
                                                style={{
                                                    backgroundColor: 'var(--color-raised)',
                                                    border: '1px solid var(--color-border)',
                                                }}
                                                title="Deactivate user"
                                            >
                                                <UserX className="h-3 w-3" />
                                                Deactivate
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
