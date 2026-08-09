import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';

// audit_log has no insert policy for authenticated roles - it's written
// only through server-only code via the service-role client, never
// directly by a CHRO/super_admin session. Best-effort: a logging failure
// must never block the action being logged.
export async function logAccess({
  actorId,
  action,
  targetType,
  targetId,
  detail,
}: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail?: string;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('audit_log')
      .insert({ actor_id: actorId, action, target_type: targetType, target_id: targetId, detail });
    if (error) console.error('Failed to write audit log entry:', error);
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
}
