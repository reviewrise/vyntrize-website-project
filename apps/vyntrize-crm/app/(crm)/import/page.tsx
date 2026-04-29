import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ImportRunner } from '@/components/ImportRunner';

export default async function ImportPage() {
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

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
                    Import Contacts
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Import website contact form submissions into the CRM as Contacts and Leads.
                </p>
            </div>

            <ImportRunner />
        </div>
    );
}
