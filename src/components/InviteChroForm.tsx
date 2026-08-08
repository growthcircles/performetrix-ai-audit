'use client';

import { useActionState } from 'react';
import type { InviteChroResult } from '@/app/admin/actions';

const initialState: InviteChroResult = { ok: true };

export function InviteChroForm({
  customers,
  action,
}: {
  customers: { id: string; name: string }[];
  action: (formData: FormData) => Promise<InviteChroResult>;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: InviteChroResult, formData: FormData) => action(formData),
    initialState,
  );

  return (
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
      {!state.ok && (
        <p className="form-error" style={{ width: '100%', margin: 0 }}>{state.error}</p>
      )}
    </form>
  );
}
