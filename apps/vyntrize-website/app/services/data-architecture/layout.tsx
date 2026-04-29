import type { Metadata } from 'next';
import { buildMeta } from '@/app/page-metadata';

export const metadata: Metadata = buildMeta({
  title: 'Data Architecture & Analytics',
  description: 'Transform scattered data into a clear source of truth. Spreadsheet-to-database migration, universal data connectors, governance, and real-time analytics dashboards.',
  path: '/services/data-architecture',
  keywords: ['data architecture', 'data analytics', 'database migration', 'data pipeline', 'data governance', 'business intelligence'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
