import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'AI Services',
  description: 'Five AI-powered service lines: AI Search & Reputation, Intelligent Automation, Custom Software, Data & Analytics, and Digital Marketing. Built for measurable outcomes.',
  path: '/services',
  keywords: ['AI services', 'business automation services', 'AI reputation management', 'custom software development', 'data analytics services'],
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
