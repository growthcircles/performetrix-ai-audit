'use client';

import { useActionState } from 'react';
import type { InviteChroResult } from '@/app/admin/actions';

export function InviteChroForm({
  customers,
  action,
}: {
  customers: { id: string; name: string }[];
  action: (formData: FormData) => Promise<InviteChroResult>;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: InviteChroResult | null, formData: FormData) => action(formData),
    null,
  );

  return (
    <div>
      <form action={formAction} className="add-row">
        <select name="customerId" required defaultValue="">
          <option value="" disabled>Organisation&hellip;</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="name" placeholder="CHRO full name" required />
        <input name="email" type="email" placeholder="Email" required />
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Sending…' : 'Send invite'}
        </button>
      </form>
      {state && !state.ok && (
        <p className="form-error" style={{ marginTop: 12 }}>{state.error}</p>
      )}
      {state && state.ok && (
        <div style={{ marginTop: 12 }}>
          {state.emailSent ? (
            <p style={{ fontSize: 12.5, opacity: 0.7, margin: '0 0 6px' }}>
              Invite email sent. If it doesn&apos;t arrive, use this link directly:
            </p>
          ) : (
            <p className="form-error" style={{ margin: '0 0 6px' }}>
              Account created, but the invite email failed to send ({state.emailError}). Use this link directly:
            </p>
          )}
          <div className="link-box">{state.inviteUrl}</div>
        </div>
      )}
    </div>
  );
}
