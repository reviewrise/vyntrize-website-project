import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Pricing',
  description: 'Simple, honest pricing. Starter from $499/mo, Professional from $999/mo, Enterprise custom. 14-day free trial, no credit card required. Cancel anytime.',
  path: '/pricing',
  keywords: ['VyntRise pricing', 'AI automation pricing', 'business automation cost', 'AI platform pricing'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
