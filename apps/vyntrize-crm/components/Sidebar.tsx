'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard, Kanban, Users, Building2,
    Download, UserCog, LogOut, Briefcase,
    UserCircle, Settings, ChevronRight, BarChart2,
    CheckSquare, Mail, Send, Sparkles, Inbox,
    FileText, GitBranch, ChevronDown, CalendarDays,
    Receipt, MessageSquare, MessageCircle, List,
} from 'lucide-react';
import { logout } from '@/lib/actions/auth';

interface SidebarProps {
    role: 'ADMIN' | 'MEMBER';
    displayName: string;
    email: string;
}

const CRM_NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pipeline', label: 'Pipeline', icon: Kanban },
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/companies', label: 'Companies', icon: Building2 },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
];

const SALES_NAV = [
    { href: '/deals', label: 'Deals', icon: Briefcase },
    { href: '/invoices', label: 'Invoices', icon: Receipt },
];

const EMAIL_NAV = [
    { href: '/campaigns', label: 'Campaigns', icon: Send },
    { href: '/email-templates', label: 'Templates', icon: FileText },
    { href: '/email/logs', label: 'Logs', icon: Inbox },
    { href: '/settings/pipeline/automation', label: 'Drip Sequences', icon: GitBranch },
];

const SMS_NAV = [
    { href: '/sms/logs',      label: 'Logs',      icon: List },
    { href: '/sms/templates', label: 'Templates', icon: FileText },
];

const SETTINGS_NAV = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/settings/email', label: 'Email Configuration', icon: Settings },
    { href: '/settings/ai-providers', label: 'AI Providers', icon: CheckSquare },
    { href: '/settings/integrations', label: 'Integrations', icon: CheckSquare },
];

const WEBSITE_NAV = [
    { href: '/website/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/website/projects', label: 'Projects', icon: Briefcase },
    { href: '/website/team', label: 'Team', icon: UserCircle },
    { href: '/website/settings', label: 'Settings', icon: Settings },
];

const AI_AGENTS_NAV = [
    { href: '/agents', label: 'Dashboard', icon: Sparkles },
];

const ADMIN_NAV = [
    { href: '/import', label: 'Import', icon: Download },
    { href: '/admin/users', label: 'Users', icon: UserCog },
];

function NavItem({ href, label, icon: Icon, indent = false }: {
    href: string;
    label: string;
    icon: React.ElementType;
    indent?: boolean;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            className="flex items-center gap-2.5 py-2 rounded-lg text-[0.8125rem] font-medium transition-all group"
            style={{
                paddingLeft: indent ? '1.75rem' : '0.75rem',
                paddingRight: '0.75rem',
                backgroundColor: active ? 'var(--color-primary-soft)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
        >
            <Icon className="h-[15px] w-[15px] flex-shrink-0" />
            <span>{label}</span>
            {active && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
        </Link>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <p
            className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-text-subtle)' }}
        >
            {label}
        </p>
    );
}

function EmailSection() {
    const pathname = usePathname();
    const isEmailActive = EMAIL_NAV.some(item =>
        pathname === item.href || pathname.startsWith(item.href + '/')
    );
    const [open, setOpen] = useState(isEmailActive);

    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-all"
                style={{
                    backgroundColor: isEmailActive ? 'var(--color-primary-soft)' : 'transparent',
                    color: isEmailActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
            >
                <Mail className="h-[15px] w-[15px] flex-shrink-0" />
                <span>Email</span>
                <ChevronDown
                    className="h-3 w-3 ml-auto transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>
            {open && (
                <div className="space-y-0.5 mt-0.5">
                    {EMAIL_NAV.map(item => (
                        <NavItem key={item.href} {...item} indent />
                    ))}
                </div>
            )}
        </div>
    );
}

function SmsSection() {
    const pathname = usePathname();
    const isSmsActive = SMS_NAV.some(item =>
        pathname === item.href || pathname.startsWith(item.href + '/')
    );
    const [open, setOpen] = useState(isSmsActive);

    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-all"
                style={{
                    backgroundColor: isSmsActive ? 'var(--color-primary-soft)' : 'transparent',
                    color: isSmsActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
            >
                <MessageSquare className="h-[15px] w-[15px] flex-shrink-0" />
                <span>SMS</span>
                <ChevronDown
                    className="h-3 w-3 ml-auto transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>
            {open && (
                <div className="space-y-0.5 mt-0.5">
                    {SMS_NAV.map(item => (
                        <NavItem key={item.href} {...item} indent />
                    ))}
                </div>
            )}
        </div>
    );
}

export function Sidebar({ role, displayName, email }: SidebarProps) {
    const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const [logoError, setLogoError] = useState(false);

    return (
        <aside
            className="flex flex-col w-56 min-h-screen flex-shrink-0"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-2.5 px-4 h-14 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--color-border)' }}
            >
                <Link href="/dashboard" className="flex items-center gap-2">
                    {logoError ? (
                        <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c5bf7)' }}
                        >
                            V
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src="/images/logo.png"
                            alt="VyntRise"
                            width={28}
                            height={28}
                            className="object-contain shrink-0"
                            onError={() => setLogoError(true)}
                        />
                    )}
                    <div>
                        <p className="text-[0.8125rem] font-bold leading-tight" style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                            VyntRise
                        </p>
                        <p className="text-[10px] leading-tight font-medium" style={{ color: 'var(--color-primary)' }}>
                            CRM
                        </p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-2 overflow-y-auto">
                <SectionLabel label="CRM" />
                <div className="space-y-0.5">
                    {CRM_NAV.map(item => <NavItem key={item.href} {...item} />)}
                    <EmailSection />
                    <SmsSection />
                </div>

                <SectionLabel label="Sales" />
                <div className="space-y-0.5">
                    {SALES_NAV.map(item => <NavItem key={item.href} {...item} />)}
                </div>

                <SectionLabel label="Website" />
                <div className="space-y-0.5">
                    {WEBSITE_NAV.map(item => <NavItem key={item.href} {...item} />)}
                </div>

                <SectionLabel label="AI Agents" />
                <div className="space-y-0.5">
                    {AI_AGENTS_NAV.map(item => <NavItem key={item.href} {...item} />)}
                </div>

                <SectionLabel label="Settings" />
                <div className="space-y-0.5">
                    {SETTINGS_NAV.map(item => <NavItem key={item.href} {...item} />)}
                </div>

                {role === 'ADMIN' && (
                    <>
                        <SectionLabel label="Admin" />
                        <div className="space-y-0.5">
                            {ADMIN_NAV.map(item => <NavItem key={item.href} {...item} />)}
                        </div>
                    </>
                )}
            </nav>

            {/* User footer */}
            <div
                className="px-3 py-3 flex-shrink-0"
                style={{ borderTop: '1px solid var(--color-border)' }}
            >
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1"
                    style={{ backgroundColor: 'var(--color-raised)' }}>
                    <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-h))' }}
                    >
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[0.75rem] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {displayName}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--color-text-subtle)' }}>
                            {role}
                        </p>
                    </div>
                </div>
                <form action={async (formData: FormData) => { await logout(); }}>
                    <button type="submit" className="btn-ghost w-full justify-start text-[0.8125rem] px-2 py-1.5">
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                    </button>
                </form>
            </div>
        </aside>
    );
}
