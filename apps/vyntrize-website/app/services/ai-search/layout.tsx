import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'AI Search & Reputation Management',
  description: 'AI-powered SEO and centralized reputation management. Increase traffic by 250%, improve review ratings, and dominate local search — all on autopilot.',
  path: '/services/ai-search',
  keywords: ['AI SEO', 'reputation management', 'local SEO', 'review management', 'Google Business Profile', 'AI search optimization'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
