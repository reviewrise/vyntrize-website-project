import { prisma }             from '@/lib/prisma';
import { getSession }         from '@/lib/session';
import { redirect }           from 'next/navigation';
import SmsCampaignBuilder     from './SmsCampaignBuilder';

export default async function NewSmsCampaignPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const [contacts, templates] = await Promise.all([
    prisma.contact.findMany({
      where:   { phone: { not: null } },
      select:  { id: true, firstName: true, lastName: true, phone: true, company: { select: { name: true } } },
      orderBy: { firstName: 'asc' },
    }),
    (prisma as any).smsTemplate.findMany({
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, body: true, type: true },
    }),
  ]);

  return (
    <SmsCampaignBuilder
      contacts={contacts.map(c => ({
        ...c,
        companyName: c.company?.name || null,
      })) as any}
      templates={templates}
    />
  );
}
