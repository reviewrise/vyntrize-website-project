import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Industry Solutions',
  description: 'AI solutions built for healthcare, e-commerce, financial services, and real estate. Same platform, configured for your industry\'s specific challenges and compliance needs.',
  path: '/solutions',
  keywords: ['AI for healthcare', 'AI for e-commerce', 'AI for financial services', 'AI for real estate', 'industry AI solutions'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
