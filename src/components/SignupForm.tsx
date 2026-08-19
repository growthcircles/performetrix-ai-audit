'use client';

import { useActionState, useEffect } from 'react';
import type { SignupResult } from '@/app/signup/actions';

export function SignupForm({ action }: { action: (formData: FormData) => Promise<SignupResult> }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: SignupResult | null, formData: FormData) => action(formData),
    null,
  );

  useEffect(() => {
    // A real browser navigation, not next/navigation's redirect() - that
    // one performs a client-side (RSC) transition when JS is available,
    // which doesn't work against /auth/confirm since it's a Route Handler
    // rather than a page.
    if (state?.ok) {
      window.location.href = state.confirmUrl;
    }
  }, [state]);

  const submitting = pending || state?.ok;

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
      {state && !state.ok && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn" disabled={submitting}>
        {submitting ? 'Setting up your account…' : 'Get started'}
      </button>
    </form>
  );
}
