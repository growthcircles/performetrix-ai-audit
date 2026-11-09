import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Secret-key client: bypasses RLS. Never import this from client code or
// from a route that handles an authenticated CHRO/PerforMetrix session - only for
// the unauthenticated leader-token flow (submit answers, mark completed).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

