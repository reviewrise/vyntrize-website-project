import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session.isLoggedIn) redirect('/login');

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
            <Sidebar
                role={session.role}
                displayName={session.displayName}
                email={session.email}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header
                    className="h-14 flex items-center justify-end gap-2 px-6 flex-shrink-0"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        borderBottom: '1px solid var(--color-border)',
                    }}
                >
                    <NotificationBell />
                    <ThemeToggle />
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto px-6 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
