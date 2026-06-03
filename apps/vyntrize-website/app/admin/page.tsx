import { redirect } from 'next/navigation';

export default function AdminRedirect() {
  redirect(`${process.env.NEXT_PUBLIC_CRM_URL || 'http://localhost:3014'}/dashboard`);
}
