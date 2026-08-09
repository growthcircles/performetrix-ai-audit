'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentUser } from '@/lib/data/auth';
import { logAccess } from '@/lib/data/audit';
import { sendChroInviteEmail } from '@/lib/email';

export async function createCustomer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .insert({ name })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await logAccess({ actorId: user.id, action: 'create_customer', targetType: 'customer', targetId: customer.id, detail: name });

  revalidatePath('/admin');
}

export type InviteChroResult = { ok: true } | { ok: false; error: string };

export async function inviteChro(formData: FormData): Promise<InviteChroResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  const customerId = String(formData.get('customerId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!customerId || !name || !email) {
    return { ok: false, error: 'Name, email, and organisation are all required.' };
  }

  const supabase = await createClient();
  const { data: customer } = await supabase.from('customers').select('id, name').eq('id', customerId).maybeSingle();
  if (!customer) return { ok: false, error: 'Organisation not found.' };

  const service = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { role: 'chro', customer_id: customerId, name },
    },
  });

  if (linkError) {
    // Most likely: a user with this email already exists.
    return { ok: false, error: linkError.message };
  }

  const inviteUrl = `${appUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=invite&next=${encodeURIComponent('/set-password')}`;

  const emailResult = await sendChroInviteEmail({
    to: email,
    name,
    orgName: customer.name,
    inviteUrl,
  });

  if (!emailResult.ok) {
    return { ok: false, error: `Account created, but the invite email failed to send: ${emailResult.error}` };
  }

  await logAccess({
    actorId: user.id,
    action: 'invite_chro',
    targetType: 'customer',
    targetId: customerId,
    detail: `${name} for ${customer.name}`,
  });

  revalidatePath('/admin');
  return { ok: true };
}

export async function clearActivityLog() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  // audit_log has no delete policy for authenticated roles by design (its
  // authenticated-client surface is read-only for super_admin) - clearing
  // goes through the service client, same as every other write to this table.
  const service = createServiceClient();
  const { error } = await service.from('audit_log').delete().not('id', 'is', null);
  if (error) throw new Error(error.message);

  // Logged after clearing, so the log itself always shows who cleared it
  // and when - clearing the trail doesn't erase that it was cleared.
  await logAccess({
    actorId: user.id,
    action: 'clear_activity_log',
    targetType: 'audit_log',
    targetId: null,
  });

  revalidatePath('/admin');
}
