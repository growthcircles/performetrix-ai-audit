import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { signup } from './actions';
import { Logo } from '@/components/Logo';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');

  const { error } = await searchParams;

  return (
    <div className="theme-ink">
      <main className="shell" style={{ maxWidth: 380 }}>
        <div style={{ marginBottom: 22 }}><Logo height={40} /></div>
        <div className="h1" style={{ fontSize: 26 }}>Run the FutureReady Diagnostic</div>
        <p className="sub">
          Free, no obligation. Set up your organisation and get straight into your portal, ready to add
          leaders and generate assessment links.
        </p>

        <form action={signup}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="companyName">Company name</label>
            <input id="companyName" name="companyName" type="text" required autoComplete="organization" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn">Get started</button>
        </form>
      </main>
    </div>
  );
}
