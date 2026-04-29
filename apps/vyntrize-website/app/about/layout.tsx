import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'About VyntRise',
  description: 'Learn how VyntRise was built to help small businesses compete with enterprise-grade AI tools. Our mission, vision, and the team behind the platform.',
  path: '/about',
  keywords: ['about VyntRise', 'AI company', 'business automation company', 'VyntRise story'],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
