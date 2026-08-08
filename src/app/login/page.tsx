import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { signIn } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');

  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>FutureReady Admin Portal</h1>
      <form action={signIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
