import { redirect } from 'next/navigation';

export default function AdminRedirect() {
  redirect('http://localhost:3014/dashboard');
}
