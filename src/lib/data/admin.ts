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

export type AdminLeader = {
  id: string;
  name: string;
  orgName: string;
  status: 'pending' | 'completed';
  createdAt: string;
};

export type AdminOverview = {
  totalCustomers: number;
  totalLeaders: number;
  completedLeaders: number;
  pillarPatterns: PillarPattern[];
  customers: CustomerStat[];
  leaders: AdminLeader[];
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

  const leadersOut: AdminLeader[] = leaderList.map((l) => ({
    id: l.id,
    name: l.name,
    orgName: customerMap.get(l.customer_id) ?? '',
    status: l.status,
    createdAt: l.created_at,
  }));

  return {
    totalCustomers: customerList.length,
    totalLeaders: leaderList.length,
    completedLeaders: leaderList.filter((l) => l.status === 'completed').length,
    pillarPatterns,
    customers: customerStats,
    leaders: leadersOut,
  };
}
