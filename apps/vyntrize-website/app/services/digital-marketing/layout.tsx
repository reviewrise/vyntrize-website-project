import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Digital Marketing',
  description: 'Human creativity amplified by AI efficiency. Authentic video content, community management, hybrid email strategy, and E-E-A-T SEO that drives real engagement.',
  path: '/services/digital-marketing',
  keywords: ['digital marketing', 'AI marketing', 'content marketing', 'email marketing', 'community management', 'SEO content'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
