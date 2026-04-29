import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Contact Us',
  description: 'Get in touch with VyntRise. Tell us your goals and we\'ll come back with a concrete plan — not a sales pitch. Response within 4 hours on business days.',
  path: '/contact',
  keywords: ['contact VyntRise', 'get started AI automation', 'book a demo', 'VyntRise sales'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
