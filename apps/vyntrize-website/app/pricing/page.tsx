import { buildMeta } from '@/app/page-metadata';
import PricingClient from './PricingClient';

export const metadata = buildMeta({
  title: 'Pricing',
  description: 'Simple, honest pricing. No hidden fees. No lock-in. Cancel anytime.',
  path: '/pricing',
});

export default function PricingPage() {
  return <PricingClient />;
}
