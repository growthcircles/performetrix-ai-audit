import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type CurrentUser = {
  id: string;
  customer_id: string | null;
  role: 'super_admin' | 'chro';
  name: string;
  email: string;
};

// Cached per-request: safe to call from multiple server components without
// re-querying. Uses getUser() (not getSession()) because it revalidates the
// token against Supabase Auth rather than trusting the cookie as-is.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, customer_id, role, name, email')
    .eq('id', user.id)
    .single();

  return profile;
});
