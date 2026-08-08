import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { logAccess } from './audit';
import type { ScoreResult } from '@/lib/assessment/scoring';

export type LeaderReport = {
  leaderName: string;
  orgName: string;
  chroName: string;
  scores: ScoreResult;
  submittedAt: string;
};

// Uses the authenticated (RLS-scoped) client, not the service client - a
// CHRO or super_admin viewing a report goes through the same tenant
// isolation as everything else in their session. The explicit customer_id
// check below is redundant with RLS but cheap, and keeps this layer
// correct even if a policy regresses.
export async function getLeaderReport(leaderId: string): Promise<LeaderReport | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'chro' && user.role !== 'super_admin')) return null;

  const supabase = await createClient();

  const { data: leader } = await supabase
    .from('leaders')
    .select('id, name, status, customer_id, customers(name)')
    .eq('id', leaderId)
    .maybeSingle();

  if (!leader || leader.status !== 'completed') return null;
  if (user.role === 'chro' && leader.customer_id !== user.customer_id) return null;

  const { data: submission } = await supabase
    .from('submissions')
    .select('computed_scores, submitted_at')
    .eq('leader_id', leaderId)
    .maybeSingle();

  if (!submission) return null;

  const { data: chro } = await supabase
    .from('users')
    .select('name')
    .eq('customer_id', leader.customer_id)
    .eq('role', 'chro')
    .limit(1)
    .maybeSingle();

  const customer = leader.customers as unknown as { name: string } | null;

  await logAccess({ actorId: user.id, action: 'view_report', targetType: 'leader', targetId: leaderId });

  return {
    leaderName: leader.name,
    orgName: customer?.name ?? '',
    chroName: chro?.name ?? user.name,
    scores: submission.computed_scores as ScoreResult,
    submittedAt: submission.submitted_at,
  };
}
