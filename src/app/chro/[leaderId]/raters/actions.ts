'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/data/auth';
import { logAccess } from '@/lib/data/audit';
import {
  nominateRater,
  deleteRater,
  grantChroReportAccess,
  revokeChroReportAccess,
  sendReportToLeader,
} from '@/lib/data/three-sixty';
import type { RaterGroup } from '@/lib/three-sixty/types';

// Re-verifies role/tenant on every call rather than trusting the page-level
// check, matching addLeader/deleteLeader - each action is a separate,
// directly-callable entry point.
async function requireOwnedLeader(leaderId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'chro' || !user.customer_id) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data: leader } = await supabase
    .from('leaders')
    .select('id, name, customer_id')
    .eq('id', leaderId)
    .maybeSingle();

  if (!leader || leader.customer_id !== user.customer_id) throw new Error('Not found');
  return { user, leader };
}

export async function nominateRaterAction(leaderId: string, formData: FormData) {
  await requireOwnedLeader(leaderId);

  const group = String(formData.get('group') ?? '') as Exclude<RaterGroup, 'self'>;
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  if (!['manager', 'peer', 'direct_report', 'other_stakeholder'].includes(group) || !name || !email) return;

  const result = await nominateRater(leaderId, group, name, email);
  if (!result.ok) throw new Error(result.error);

  revalidatePath(`/chro/${leaderId}/raters`);
}

export async function deleteRaterAction(leaderId: string, raterId: string) {
  const { user, leader } = await requireOwnedLeader(leaderId);
  await deleteRater(raterId);
  await logAccess({ actorId: user.id, action: 'delete_rater', targetType: 'rater', targetId: raterId, detail: leader.name });
  revalidatePath(`/chro/${leaderId}/raters`);
}

export async function toggleReportAccessAction(leaderId: string, grant: boolean) {
  const { user, leader } = await requireOwnedLeader(leaderId);
  if (grant) {
    await grantChroReportAccess(leaderId, user.id);
    await logAccess({ actorId: user.id, action: 'grant_360_access', targetType: 'leader', targetId: leaderId, detail: leader.name });
  } else {
    await revokeChroReportAccess(leaderId);
    await logAccess({ actorId: user.id, action: 'revoke_360_access', targetType: 'leader', targetId: leaderId, detail: leader.name });
  }
  revalidatePath(`/chro/${leaderId}/raters`);
}

export async function sendReportToLeaderAction(leaderId: string, formData: FormData) {
  const { user } = await requireOwnedLeader(leaderId);
  const email = String(formData.get('email') ?? '').trim();
  if (!email) throw new Error('Enter an email address.');

  const result = await sendReportToLeader(leaderId, user.id, email);
  if (!result.ok) throw new Error(result.error);

  revalidatePath(`/chro/${leaderId}/raters`);
}
