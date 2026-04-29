'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/lib/actions/auth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginForm() {
    const [state, formAction, pending] = useActionState<LoginState, FormData>(login, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
                    style={{
                        backgroundColor: 'var(--color-danger-soft)',
                        border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)',
                        color: 'var(--color-danger)',
                    }}
                >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {state.error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={pending}
                    className="crm-input"
                    placeholder="you@vyntrise.com"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={pending}
                    className="crm-input"
                    placeholder="••••••••"
                />
            </div>

            <button type="submit" disabled={pending} className="btn-primary w-full justify-center mt-2">
                {pending ? (
                    <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    'Sign in'
                )}
            </button>
        </form>
    );
}
