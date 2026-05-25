'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Pipeline', href: '/settings/pipeline' },
    { name: 'AI Providers', href: '/settings/ai-providers' },
    { name: 'Integrations', href: '/settings/integrations' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Manage your CRM preferences, automations, and AI integrations.
        </p>
      </div>

      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }
                `}
                style={isActive ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : { color: 'var(--color-text-muted)' }}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
