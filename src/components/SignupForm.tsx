'use client';

import { useActionState } from 'react';
import type { SignupResult } from '@/app/signup/actions';

export function SignupForm({ action }: { action: (formData: FormData) => Promise<SignupResult> }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: SignupResult | null, formData: FormData) => action(formData),
    null,
  );

  if (state?.ok) {
    return (
      <div>
        <div className="confirm-mark">&#10003;</div>
        <p className="sub" style={{ margin: 0 }}>
          Check your email to verify your address and finish setting up your account. The link signs
          you straight into your portal, no separate login step needed.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
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
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state && !state.ok && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'Setting up your account…' : 'Get started'}
      </button>
    </form>
  );
}
