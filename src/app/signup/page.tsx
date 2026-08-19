import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/auth';
import { signup } from './actions';
import { SignupForm } from '@/components/SignupForm';
import { Logo } from '@/components/Logo';

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');

  return (
    <div className="theme-ink">
      <main className="shell" style={{ maxWidth: 380 }}>
        <div style={{ marginBottom: 22 }}><Logo height={40} /></div>
        <div className="h1" style={{ fontSize: 26 }}>Run the FutureReady Diagnostic</div>
        <p className="sub">
          Free, no obligation. Set up your organisation and get straight into your portal, ready to add
          leaders and generate assessment links.
        </p>

        <SignupForm action={signup} />
      </main>
    </div>
  );
}
