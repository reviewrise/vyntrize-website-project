import { redirect } from 'next/navigation';

export default function AdminRedirect() {
  redirect(`${process.env.NEXT_PUBLIC_CRM_URL || 'https://crm.vyntrise.com'}/dashboard`);
}
