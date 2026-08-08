'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/data/auth';

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
