import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

export type Leader = {
  id: string;
  name: string;
  token: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
};

// Returns null if the caller isn't a CHRO - the page decides how to react
// (redirect), this layer just refuses to hand back data it shouldn't.
export async function getChroConsoleData() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'chro' || !user.customer_id) {
    return null;
  }

  const supabase = await createClient();

  const [{ data: customer }, { data: leaders }] = await Promise.all([
    supabase.from('customers').select('id, name').eq('id', user.customer_id).single(),
    supabase
      .from('leaders')
      .select('id, name, token, status, created_at, completed_at')
      .eq('customer_id', user.customer_id)
      .order('created_at', { ascending: false }),
  ]);

  return { user, customer, leaders: (leaders ?? []) as Leader[] };
}
