import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'FAQ',
  description: 'Frequently asked questions about VyntRise — billing, automation, security, technical requirements, and support. Find answers or reach our team.',
  path: '/faq',
  keywords: ['VyntRise FAQ', 'AI automation questions', 'VyntRise help', 'pricing questions'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
