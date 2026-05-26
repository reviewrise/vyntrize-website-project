import { buildMeta } from '@/app/page-metadata';
import SupportClient from './SupportClient';

export const metadata = buildMeta({
  title: 'Support',
  description: 'Find answers, reach our team, or browse resources — we\'re here whenever you need us.',
  path: '/support',
});

export default function SupportPage() {
  return <SupportClient />;
}
