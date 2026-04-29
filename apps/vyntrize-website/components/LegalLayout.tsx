'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface LegalSection {
    id: string;
    title: string;
}

interface LegalLayoutProps {
    badge: string;
    title: string;
    subtitle: string;
    lastUpdated: string;
    effectiveDate: string;
    sections: LegalSection[];
    children: React.ReactNode;
}

export default function LegalLayout({
    badge, title, subtitle, lastUpdated, effectiveDate, sections, children,
}: LegalLayoutProps) {
    const [active, setActive] = useState(sections[0]?.id ?? '');
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActive(id); },
                { rootMargin: '-20% 0px -70% 0px' }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(o => o.disconnect());
    }, [sections]);

    const activeTitle = sections.find(s => s.id === active)?.title ?? '';

    return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

            {/* Page header */}
            <section
                className="pt-20 pb-12 px-4 md:px-6"
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
                <div className="container mx-auto max-w-6xl">
                    <div className="github-badge mb-4">{badge}</div>
                    <h1
                        className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight"
                        style={{ color: 'var(--color-text)' }}
                    >
                        {title}
                    </h1>
                    <p className="text-lg max-w-2xl mb-6" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Effective: <span className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>{effectiveDate}</span>
                        </span>
                        <span>·</span>
                        <span>Last updated: <span className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>{lastUpdated}</span></span>
                    </div>
                </div>
            </section>

            {/* Mobile section picker */}
            <div
                className="md:hidden sticky top-16 z-30 px-4 py-2"
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium"
                    style={{
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                    }}
                >
                    <span className="truncate">{activeTitle}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
                </button>
                {mobileOpen && (
                    <div
                        className="absolute left-4 right-4 top-full mt-1 rounded-xl shadow-lg z-40 overflow-hidden"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                    >
                        {sections.map(s => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                onClick={() => setMobileOpen(false)}
                                className="block px-4 py-2.5 text-sm transition-colors"
                                style={{
                                    backgroundColor: active === s.id ? 'var(--color-raised)' : 'transparent',
                                    color: active === s.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: active === s.id ? 600 : 400,
                                }}
                            >
                                {s.title}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 container mx-auto max-w-6xl px-4 md:px-6 py-12">
                <div className="flex gap-12 items-start">

                    {/* Sticky sidebar */}
                    <aside className="hidden md:block w-56 shrink-0 sticky top-24 self-start">
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest mb-3"
                            style={{ color: 'var(--color-text-subtle)' }}
                        >
                            Contents
                        </p>
                        <nav className="space-y-0.5">
                            {sections.map((s, i) => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all"
                                    style={{
                                        backgroundColor: active === s.id ? 'var(--color-raised)' : 'transparent',
                                        color: active === s.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: active === s.id ? 600 : 400,
                                    }}
                                >
                                    <span
                                        className="text-[10px] font-mono shrink-0"
                                        style={{ color: active === s.id ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {s.title}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* Content */}
                    <article className="flex-1 min-w-0 prose-legal">
                        {children}
                    </article>
                </div>
            </div>
        </div>
    );
}
