'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Briefcase, UserCircle,
  LogOut, Menu, X, Settings,
} from 'lucide-react';
import { isAdminLoggedIn, adminLogout } from '@/lib/admin-auth';
import VyntriseLogo from '@/components/VyntriseLogo';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/admin/leads', icon: Users },
  { label: 'Projects', href: '/admin/projects', icon: Briefcase },
  { label: 'Team', href: '/admin/team', icon: UserCircle },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(true);
      return;
    }
    if (!isAdminLoggedIn()) {
      router.replace('/admin/login');
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) return null;
  if (pathname === '/admin/login') return <>{children}</>;

  function handleLogout() {
    adminLogout();
    router.replace('/admin/login');
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <VyntriseLogo theme="auto" height={24} />
          <button onClick={() => setSidebarOpen(false)} className="md:hidden" style={{ color: 'var(--color-text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Badge */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Admin Panel
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--color-raised)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-14"
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="md:hidden" style={{ color: 'var(--color-text-muted)' }}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {navItems.find(n => pathname.startsWith(n.href))?.label ?? 'Admin'}
          </p>
          <Link href="/" className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ← View site
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 md:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
