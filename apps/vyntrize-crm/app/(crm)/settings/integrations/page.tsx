import { getSession } from '@/lib/session';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function IntegrationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session?.isLoggedIn) return null;

  const sp = await searchParams;

  const connectedAccount = await vyntrizeDb.connectedAccount.findFirst({
    where: { userId: session.userId, provider: 'google' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Integrations</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Connect third-party services to sync data and automate workflows.
        </p>
      </div>

      {sp.success && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-200">
          Google Calendar connected successfully!
        </div>
      )}

      {sp.error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
          Failed to connect Google account. Please check your credentials and try again.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Calendar Card */}
        <div className="p-5 rounded-2xl border flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100 shrink-0">
                <svg width="24" height="24" viewBox="0 0 48 48">
                  <path fill="#fbbc04" d="M43.6 20.1H42V20H24v8h11.3C34.7 32.8 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.2 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.4-3.9z" />
                  <path fill="#ea4335" d="M24 12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.2 29.6 2 24 2 15.6 2 8.3 6.6 4.4 13.5l7.7 5.9C13.8 14.8 18.5 12 24 12z" />
                  <path fill="#34a853" d="M24 36c6 0 10.7-3.2 11.3-8l7.8 6c-4.6 6.8-12 11.3-20.1 11.3-12.2 0-22-9.8-22-22h8c0 6.6 5.4 12 12 12z" />
                  <path fill="#4285f4" d="M46 24c0-1.3-.2-2.7-.4-3.9H24v8h11.3c-.5 2.1-1.6 4-3.3 5.4l7.8 6C43.3 35.8 46 30.5 46 24z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Google Calendar</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>Two-way sync for meetings</p>
              </div>
            </div>
            {connectedAccount ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                <CheckCircle className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                <XCircle className="h-3 w-3" />
                Not connected
              </span>
            )}
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
            {connectedAccount ? (
              <>
                <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {connectedAccount.email}
                </div>
                <form action="/api/auth/google/disconnect" method="POST">
                  <button type="submit" className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                    Disconnect
                  </button>
                </form>
              </>
            ) : (
              <Link href="/api/auth/google" className="w-full text-center px-4 py-2 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors">
                Connect Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
