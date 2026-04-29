import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const siteLinks = [
    { label: 'Homepage', href: 'https://vyntrise.com' },
    { label: 'Contact page', href: 'https://vyntrise.com/contact' },
    { label: 'Work / Portfolio', href: 'https://vyntrise.com/work' },
    { label: 'About page', href: 'https://vyntrise.com/about' },
    { label: 'Pricing', href: 'https://vyntrise.com/pricing' },
];

export default function WebsiteSettings() {
    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Website Settings</h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Quick access to vyntrise.com pages</p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="px-5 py-3" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Quick links</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg)' }}>
                    {siteLinks.map((l, i) => (
                        <Link key={l.href} href={l.href} target="_blank"
                            className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--color-raised)]"
                            style={{ borderBottom: i < siteLinks.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <span className="text-sm" style={{ color: 'var(--color-text)' }}>{l.label}</span>
                            <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contact form submissions</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    All contact form submissions from vyntrise.com are stored in the website database and can be imported into the CRM pipeline via the Import page.
                </p>
                <Link href="/import" className="inline-flex items-center gap-1.5 text-xs font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>
                    Go to Import →
                </Link>
            </div>
        </div>
    );
}
