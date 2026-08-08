'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/data/auth';
import { logAccess } from '@/lib/data/audit';

export async function addLeader(formData: FormData) {
  // Re-verify here rather than trusting the page-level check: this action
  // is a separate, directly-callable entry point.
  const user = await getCurrentUser();
  if (!user || user.role !== 'chro' || !user.customer_id) {
    throw new Error('Unauthorized');
  }

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('leaders')
    .insert({ customer_id: user.customer_id, name });

  if (error) throw new Error(error.message);

  revalidatePath('/chro');
}

export async function deleteLeader(leaderId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'chro' || !user.customer_id) {
    throw new Error('Unauthorized');
  }

  const supabase = await createClient();

  // Confirm ownership before deleting - redundant with the RLS delete
  // policy, but this is a destructive action, so verify explicitly rather
  // than relying on one layer.
  const { data: leader } = await supabase
    .from('leaders')
    .select('id, customer_id')
    .eq('id', leaderId)
    .maybeSingle();

  if (!leader || leader.customer_id !== user.customer_id) {
    throw new Error('Not found');
  }

  // Log before deleting - the row (and its cascaded submission) won't
  // exist to reference afterward.
  await logAccess({ actorId: user.id, action: 'delete_leader', targetType: 'leader', targetId: leaderId });

  const { error } = await supabase.from('leaders').delete().eq('id', leaderId);
  if (error) throw new Error(error.message);

  revalidatePath('/chro');
}
