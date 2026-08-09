'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

export type InviteChroResult =
  | { ok: true; inviteUrl: string; emailSent: boolean; emailError?: string }
  | { ok: false; error: string };

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

  const inviteUrl = buildInviteUrl(linkData.properties.hashed_token);

  // Email is a convenience, not the only path - the caller always gets the
  // link back so it can be sent another way (Slack, text, etc.) if delivery
  // is unreliable, which matters most for brand-new sending domains.
  const emailResult = await sendChroInviteEmail({
    to: email,
    name,
    orgName: customer.name,
    inviteUrl,
  });

  await logAccess({
    actorId: user.id,
    action: 'invite_chro',
    targetType: 'customer',
    targetId: customerId,
    detail: `${name} for ${customer.name}`,
  });

  revalidatePath('/admin');
  return { ok: true, inviteUrl, emailSent: emailResult.ok, emailError: emailResult.error };
}

function buildInviteUrl(tokenHash: string, type: 'invite' | 'recovery' = 'invite'): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return `${appUrl}/auth/confirm?token_hash=${tokenHash}&type=${type}&next=${encodeURIComponent('/set-password')}`;
}

export async function updateCustomerName(customerId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const supabase = await createClient();
  const { data: existing } = await supabase.from('customers').select('name').eq('id', customerId).maybeSingle();
  if (!existing) throw new Error('Not found');

  const { error } = await supabase.from('customers').update({ name }).eq('id', customerId);
  if (error) throw new Error(error.message);

  await logAccess({
    actorId: user.id,
    action: 'update_customer',
    targetType: 'customer',
    targetId: customerId,
    detail: `${existing.name} -> ${name}`,
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/customers/${customerId}`);
}

export type UpdateChroEmailResult =
  | { ok: true; inviteUrl: string; emailSent: boolean; emailError?: string }
  | { ok: false; error: string };

export async function updateChroEmail(userId: string, formData: FormData): Promise<UpdateChroEmailResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  const newEmail = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!newEmail) return { ok: false, error: 'Email is required.' };

  // Every step here needs the service client anyway (auth admin API calls
  // aren't RLS-governed), so the public.users sync goes through it too
  // rather than mixing in the authenticated client for one step.
  const service = createServiceClient();

  const { data: chro } = await service
    .from('users')
    .select('id, name, email, customer_id')
    .eq('id', userId)
    .eq('role', 'chro')
    .maybeSingle();

  if (!chro) return { ok: false, error: 'CHRO account not found.' };

  const oldEmail = chro.email;

  const { error: authError } = await service.auth.admin.updateUserById(userId, {
    email: newEmail,
    email_confirm: true,
  });
  if (authError) return { ok: false, error: authError.message };

  const { error: profileError } = await service.from('users').update({ email: newEmail }).eq('id', userId);
  if (profileError) return { ok: false, error: profileError.message };

  const { data: customer } = chro.customer_id
    ? await service.from('customers').select('name').eq('id', chro.customer_id).maybeSingle()
    : { data: null };

  // 'invite' works for an account that never completed its original invite;
  // an already-active account (password already set) needs 'recovery'
  // instead, since it isn't in the pending-invite state anymore.
  let link = await service.auth.admin.generateLink({ type: 'invite', email: newEmail });
  let linkType: 'invite' | 'recovery' = 'invite';
  if (link.error) {
    link = await service.auth.admin.generateLink({ type: 'recovery', email: newEmail });
    linkType = 'recovery';
  }

  await logAccess({
    actorId: user.id,
    action: 'update_chro_email',
    targetType: 'user',
    targetId: userId,
    detail: `${oldEmail} -> ${newEmail}`,
  });

  revalidatePath('/admin');
  if (chro.customer_id) revalidatePath(`/admin/customers/${chro.customer_id}`);

  if (link.error) {
    return { ok: false, error: `Email updated, but generating a new link failed: ${link.error.message}` };
  }

  const inviteUrl = buildInviteUrl(link.data.properties.hashed_token, linkType);
  const emailResult = await sendChroInviteEmail({
    to: newEmail,
    name: chro.name,
    orgName: customer?.name ?? '',
    inviteUrl,
  });

  return { ok: true, inviteUrl, emailSent: emailResult.ok, emailError: emailResult.error };
}

export async function deleteChro(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  const service = createServiceClient();
  const { data: chro } = await service
    .from('users')
    .select('id, name, email, customer_id')
    .eq('id', userId)
    .eq('role', 'chro')
    .maybeSingle();

  if (!chro) throw new Error('Not found');

  // Deleting the auth user cascades to the public.users row (FK on delete
  // cascade), so there's nothing separate to clean up there.
  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  await logAccess({
    actorId: user.id,
    action: 'delete_chro',
    targetType: 'user',
    targetId: userId,
    detail: `${chro.name} (${chro.email})`,
  });

  revalidatePath('/admin');
  if (chro.customer_id) revalidatePath(`/admin/customers/${chro.customer_id}`);
}

export async function deleteCustomer(customerId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') throw new Error('Unauthorized');

  const service = createServiceClient();
  const { data: customer } = await service.from('customers').select('id, name').eq('id', customerId).maybeSingle();
  if (!customer) throw new Error('Not found');

  // CHRO accounts must go first: the leaders_requires_customer-style check
  // constraint (chro_requires_customer) rejects the FK's ON DELETE SET NULL
  // that would otherwise fire when the customer disappears out from under
  // a CHRO row - same conflict the very first manual cleanup hit.
  const { data: chros } = await service.from('users').select('id').eq('customer_id', customerId).eq('role', 'chro');
  for (const chro of chros ?? []) {
    await service.auth.admin.deleteUser(chro.id);
  }

  const { error } = await service.from('customers').delete().eq('id', customerId);
  if (error) throw new Error(error.message);

  await logAccess({
    actorId: user.id,
    action: 'delete_customer',
    targetType: 'customer',
    targetId: customerId,
    detail: customer.name,
  });

  revalidatePath('/admin');
  redirect('/admin');
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
