import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Support',
  description: 'VyntRise support hub. Live chat, email, and phone support. Browse documentation, check system status, and find answers to common questions.',
  path: '/support',
  keywords: ['VyntRise support', 'AI platform support', 'customer support', 'help center'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
