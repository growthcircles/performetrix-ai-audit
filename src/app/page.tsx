import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { signOut } from './actions';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'chro') redirect('/chro');

  // super_admin cross-customer view lands in a later milestone; placeholder for now.
  return (
    <div className="theme-ink">
      <main className="shell">
        <div className="eyebrow">FutureReady &middot; Admin</div>
        <div className="h1" style={{ fontSize: 26 }}>Signed in as {user.name}</div>
        <p className="sub">
          {user.email} &middot; role: {user.role}
        </p>
        <p className="sub">Cross-customer view is coming in a later milestone.</p>
        <p className="sub">
          <a className="back-link" href="/sample-report" style={{ marginBottom: 0 }}>
            Preview a sample report, no assessment needed &rarr;
          </a>
        </p>
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </main>
    </div>
  );
}
