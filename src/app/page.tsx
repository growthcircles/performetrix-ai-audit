import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'chro') redirect('/chro');
  redirect('/admin');
}
