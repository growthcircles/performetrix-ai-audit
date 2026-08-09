import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { PILLAR_ORDER } from '@/lib/assessment/data';
import type { ScoreResult } from '@/lib/assessment/scoring';

const THRESHOLD = 80;

export type PillarPattern = {
  key: string;
  name: string;
  avgScore: number;
  flaggedCount: number;
  totalCount: number;
};

export type CustomerStat = {
  id: string;
  name: string;
  leaderCount: number;
  completedCount: number;
};

export type AdminOverview = {
  totalCustomers: number;
  totalLeaders: number;
  completedLeaders: number;
  pillarPatterns: PillarPattern[];
  customers: CustomerStat[];
};

// super_admin only - RLS already scopes "customers"/"leaders"/"submissions"
// reads to everything for this role, but the explicit check below keeps
// this layer correct on its own, same pattern as the other data modules.
export async function getAdminOverview(): Promise<AdminOverview | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;

  const supabase = await createClient();

  const [{ data: customers }, { data: leaders }, { data: submissions }] = await Promise.all([
    supabase.from('customers').select('id, name').order('name'),
    supabase.from('leaders').select('id, name, customer_id, status, created_at').order('created_at', { ascending: false }),
    supabase.from('submissions').select('leader_id, computed_scores'),
  ]);

  const customerList = customers ?? [];
  const leaderList = leaders ?? [];
  const submissionList = submissions ?? [];

  const customerMap = new Map(customerList.map((c) => [c.id, c.name]));

  const customerStats: CustomerStat[] = customerList.map((c) => {
    const theirs = leaderList.filter((l) => l.customer_id === c.id);
    return {
      id: c.id,
      name: c.name,
      leaderCount: theirs.length,
      completedCount: theirs.filter((l) => l.status === 'completed').length,
    };
  });

  const pillarPatterns: PillarPattern[] = PILLAR_ORDER.map((p) => {
    const scores = submissionList
      .map((s) => (s.computed_scores as ScoreResult).pillarScores[p.key])
      .filter((v): v is number => typeof v === 'number');
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      key: p.key,
      name: p.name,
      avgScore: avg,
      flaggedCount: scores.filter((v) => v <= THRESHOLD).length,
      totalCount: scores.length,
    };
  });

  return {
    totalCustomers: customerList.length,
    totalLeaders: leaderList.length,
    completedLeaders: leaderList.filter((l) => l.status === 'completed').length,
    pillarPatterns,
    customers: customerStats,
  };
}

export type CustomerDetailLeader = {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  createdAt: string;
};

export type CustomerDetail = {
  id: string;
  name: string;
  leaders: CustomerDetailLeader[];
};

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;

  const supabase = await createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('id', customerId)
    .maybeSingle();

  if (!customer) return null;

  const { data: leaders } = await supabase
    .from('leaders')
    .select('id, name, status, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  return {
    id: customer.id,
    name: customer.name,
    leaders: (leaders ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      status: l.status,
      createdAt: l.created_at,
    })),
  };
}

export type AuditEntry = {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
};

// super_admin only, matching the RLS policy on audit_log. actor_id
// references auth.users, not public.users, so PostgREST can't embed the
// join automatically - fetched separately and merged.
export async function getAuditLog(limit = 50): Promise<AuditEntry[] | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from('audit_log')
    .select('id, actor_id, action, target_type, target_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  const list = entries ?? [];
  const actorIds = [...new Set(list.map((e) => e.actor_id).filter((id): id is string => !!id))];

  const { data: actors } = actorIds.length
    ? await supabase.from('users').select('id, name, email').in('id', actorIds)
    : { data: [] as { id: string; name: string; email: string }[] };

  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  return list.map((e) => {
    const actor = e.actor_id ? actorMap.get(e.actor_id) : undefined;
    return {
      id: e.id,
      actorName: actor?.name ?? 'Unknown',
      actorEmail: actor?.email ?? '',
      action: e.action,
      targetType: e.target_type,
      targetId: e.target_id,
      detail: e.detail,
      createdAt: e.created_at,
    };
  });
}
