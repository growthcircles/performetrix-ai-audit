import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { signIn } from './actions';
import { Logo } from '@/components/Logo';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');

  const { error } = await searchParams;

  return (
    <div className="theme-ink">
      <main className="shell" style={{ maxWidth: 360 }}>
        <div style={{ marginBottom: 22 }}><Logo height={40} /></div>
        <div className="h1" style={{ fontSize: 26 }}>Admin Portal</div>
        <div className="sub">Sign in to your CHRO or admin console.</div>

        <form action={signIn}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn">Sign in</button>
        </form>
      </main>
    </div>
  );
}
