import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { signOut } from './actions';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ maxWidth: 480, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>FutureReady Admin Portal</h1>
      <p>
        Signed in as {user.name} &middot; {user.email} &middot; role: {user.role}
        {user.customer_id ? ` · customer: ${user.customer_id}` : ''}
      </p>
      <form action={signOut} style={{ marginTop: 24 }}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
