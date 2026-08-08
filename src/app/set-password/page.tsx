import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { setPassword } from './actions';

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { error } = await searchParams;

  return (
    <div className="theme-ink">
      <main className="shell" style={{ maxWidth: 360 }}>
        <div className="eyebrow">FutureReady</div>
        <div className="h1" style={{ fontSize: 26 }}>Set your password</div>
        <p className="sub">Welcome, {user.name}. Choose a password to finish setting up your account.</p>

        <form action={setPassword}>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn">Set password and continue</button>
        </form>
      </main>
    </div>
  );
}
