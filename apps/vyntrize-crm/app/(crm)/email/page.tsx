import Link from 'next/link';
import { Mail, Send, FileText, Inbox, GitBranch, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Email | Vyntrize CRM',
  description: 'Manage all email activity — campaigns, templates, logs, and drip sequences.',
};

const EMAIL_SECTIONS = [
  {
    href: '/campaigns',
    icon: Send,
    label: 'Campaigns',
    description: 'Create and manage broadcast email campaigns to groups of leads.',
    color: '#6366f1',
  },
  {
    href: '/email-templates',
    icon: FileText,
    label: 'Templates',
    description: 'Build reusable email templates with variable substitution and rich formatting.',
    color: '#8b5cf6',
  },
  {
    href: '/email/logs',
    icon: Inbox,
    label: 'Email Logs',
    description: 'View all sent, opened, clicked, and bounced emails across every lead.',
    color: '#06b6d4',
  },
  {
    href: '/settings/pipeline/automation',
    icon: GitBranch,
    label: 'Drip Sequences',
    description: 'Configure multi-step automated email sequences triggered by lead behavior.',
    color: '#10b981',
  },
];

export default async function EmailHubPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Mail className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Email
          </h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-muted)' }}>
          Manage all email activity — campaigns, templates, delivery logs, and automated drip sequences.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EMAIL_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex items-start gap-4 p-5 rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = section.color;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${section.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${section.color}18` }}
              >
                <Icon className="h-5 w-5" style={{ color: section.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[0.9rem] font-semibold" style={{ color: 'var(--color-text)' }}>
                    {section.label}
                  </span>
                  <ChevronRight
                    className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: section.color }}
                  />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {section.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
