import { buildMeta } from '@/app/page-metadata';
import WorkClient from './WorkClient';

export const metadata = buildMeta({
  title: 'Our Work',
  description: 'Real clients. Real results. See the outcomes we deliver for businesses.',
  path: '/work',
});

export default function WorkPage() {
  return <WorkClient />;
}
