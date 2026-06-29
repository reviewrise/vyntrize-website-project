import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Intelligent Automation & AI Agents',
  description: 'Deploy autonomous AI agents that handle leads, workflows, and operations 24/7. Save 20+ hours per week with custom RAG-powered knowledge bases.',
  path: '/services/intelligent-automation',
  keywords: ['AI agents', 'intelligent automation', 'workflow automation', 'RAG knowledge base', 'autonomous agents', 'business process automation'],
  ogImage: '/og-services-automation.png',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
