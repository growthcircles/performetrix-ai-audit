'use client';

import { useActionState, useState } from 'react';
import type { UpdateChroEmailResult } from '@/app/admin/actions';

export function EditChroEmailForm({
  userId,
  currentEmail,
  action,
}: {
  userId: string;
  currentEmail: string;
  action: (userId: string, formData: FormData) => Promise<UpdateChroEmailResult>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: UpdateChroEmailResult | null, formData: FormData) => action(userId, formData),
    null,
  );

  if (!editing) {
    return (
      <span className="reset-link" onClick={() => setEditing(true)}>
        Edit email
      </span>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <form action={formAction} className="add-row">
        <input name="email" type="email" defaultValue={currentEmail} required />
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        <span className="reset-link" onClick={() => setEditing(false)}>Cancel</span>
      </form>
      {state && !state.ok && <p className="form-error" style={{ marginTop: 8 }}>{state.error}</p>}
      {state && state.ok && (
        <div style={{ marginTop: 8 }}>
          {state.emailSent ? (
            <p style={{ fontSize: 12.5, opacity: 0.7, margin: '0 0 6px' }}>
              Email updated and a new invite was sent. If it doesn&apos;t arrive, use this link directly:
            </p>
          ) : (
            <p className="form-error" style={{ margin: '0 0 6px' }}>
              Email updated, but the invite failed to send ({state.emailError}). Use this link directly:
            </p>
          )}
          <div className="link-box">{state.inviteUrl}</div>
        </div>
      )}
    </div>
  );
}
