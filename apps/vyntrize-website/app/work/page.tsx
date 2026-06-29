import { buildMeta } from '@/app/page-metadata';
import WorkClient from './WorkClient';

export const metadata = buildMeta({
  title: 'Our Work | Case Studies & Results',
  description: 'Explore our case studies and see how our AI agents deliver real small business AI results. We help clients across industries (retail, food, healthcare) automate workflows, manage reputation, and increase leads.',
  path: '/work',
});

export default function WorkPage() {
  return <WorkClient />;
}
