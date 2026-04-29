import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Custom Software Development',
  description: 'Bespoke web applications, AI integrations, and mini-ERP systems built for your exact workflow. 95% on-time delivery rate. 100+ projects delivered.',
  path: '/services/custom-software',
  keywords: ['custom software development', 'bespoke web applications', 'AI integration', 'mini ERP', 'custom e-commerce', 'legacy migration'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
