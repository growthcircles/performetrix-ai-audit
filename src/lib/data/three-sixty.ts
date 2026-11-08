import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logAccess } from './audit';
import {
  isSessionComplete,
  scoreRaterSession,
  aggregateGroup,
  computeSelfInflationGap,
  computeGroupGaps,
} from '@/lib/three-sixty/scoring';
import { sendThreeSixtyReportEmail } from '@/lib/email';
import type { Session, RaterGroup, PillarKey, GroupAggregate, RaterScoreResult, ThreeSixtyReport, PillarOpenResponses } from '@/lib/three-sixty/types';
import type { ScoreResult } from '@/lib/assessment/scoring';

const ALL_GROUPS: RaterGroup[] = ['self', 'manager', 'peer', 'direct_report', 'other_stakeholder'];
const PILLAR_KEYS: PillarKey[] = ['succession', 'global', 'judgment', 'relationship'];

export type RaterRow = {
  id: string;
  leaderId: string;
  raterGroup: RaterGroup;
  name: string | null;
  email: string | null;
  token: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt: string | null;
};

export type RaterLookup = {
  id: string;
  leaderId: string;
  raterGroup: RaterGroup;
  status: 'pending' | 'completed';
  leaderName: string;
  orgName: string;
};

// Service-role client deliberately: no session exists at a rater's token
// URL, same rationale as getLeaderByToken - the token itself is the
// credential.
export async function getRaterByToken(token: string): Promise<RaterLookup | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('raters')
    .select('id, leader_id, rater_group, status, leaders(name, customers(name))')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  const leader = data.leaders as unknown as { name: string; customers: { name: string } | null } | null;
  return {
    id: data.id,
    leaderId: data.leader_id,
    raterGroup: data.rater_group,
    status: data.status,
    leaderName: leader?.name ?? '',
    orgName: leader?.customers?.name ?? '',
  };
}

export type SubmitRaterResult = { ok: true } | { ok: false; error: string };

export async function submitRaterAssessment(token: string, session: Session): Promise<SubmitRaterResult> {
  const rater = await getRaterByToken(token);
  if (!rater) return { ok: false, error: 'Invalid link.' };
  if (rater.status === 'completed') {
    return { ok: false, error: 'This assessment has already been submitted.' };
  }

  if (!isSessionComplete(session)) {
    return { ok: false, error: 'Please complete every question before submitting.' };
  }

  const scores = scoreRaterSession(session);
  const supabase = createServiceClient();

  const { error: insertError } = await supabase.from('rater_submissions').insert({
    rater_id: rater.id,
    raw_answers: session.answers,
    open_responses: session.openResponses,
    computed_scores: scores,
  });

  if (insertError) {
    return { ok: false, error: 'This assessment has already been submitted.' };
  }

  const { error: updateError } = await supabase
    .from('raters')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', rater.id);

  if (updateError) {
    return { ok: false, error: 'Something went wrong saving your submission. Please contact your CHRO.' };
  }

  return { ok: true };
}

// Authenticated (RLS-scoped) client is fine here - never returns
// rater_submissions content, just the nomination-list metadata a CHRO
// already knows (they nominated these raters).
export async function getRatersForLeader(leaderId: string): Promise<RaterRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raters')
    .select('id, leader_id, rater_group, name, email, token, status, created_at, completed_at')
    .eq('leader_id', leaderId)
    .order('rater_group', { ascending: true })
    .order('created_at', { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    leaderId: r.leader_id,
    raterGroup: r.rater_group,
    name: r.name,
    email: r.email,
    token: r.token,
    status: r.status,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}

export async function nominateRater(
  leaderId: string,
  group: Exclude<RaterGroup, 'self'>,
  name: string,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: leader } = await supabase
    .from('leaders')
    .select('id, three_sixty_started_at')
    .eq('id', leaderId)
    .maybeSingle();
  if (!leader) return { ok: false, error: 'Leader not found.' };

  if (!leader.three_sixty_started_at) {
    await supabase.from('leaders').update({ three_sixty_started_at: new Date().toISOString() }).eq('id', leaderId);
    // Idempotent: raters_one_self_per_leader prevents a duplicate self row
    // if this races with another nomination for the same leader.
    await supabase.from('raters').insert({ leader_id: leaderId, rater_group: 'self' });
  }

  const { error } = await supabase.from('raters').insert({ leader_id: leaderId, rater_group: group, name, email });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'This person has already been nominated for this group.' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteRater(raterId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('raters').delete().eq('id', raterId);
  if (error) throw new Error(error.message);
}

export async function get360Status(leaderId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_leader_360_status', { p_leader_id: leaderId });
  return (data as string | null) ?? 'not_started';
}

export async function grantChroReportAccess(leaderId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('report_access_grants').delete().eq('leader_id', leaderId).is('revoked_at', null);
  const { error } = await supabase.from('report_access_grants').insert({ leader_id: leaderId, granted_by: userId });
  if (error) throw new Error(error.message);
}

export async function revokeChroReportAccess(leaderId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('report_access_grants')
    .update({ revoked_at: new Date().toISOString() })
    .eq('leader_id', leaderId)
    .is('revoked_at', null);
  if (error) throw new Error(error.message);
}

export async function hasChroReportAccess(leaderId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('report_access_grants')
    .select('id')
    .eq('leader_id', leaderId)
    .is('revoked_at', null)
    .maybeSingle();
  return !!data;
}

function toRaterScoreResult(agg: GroupAggregate): RaterScoreResult {
  const pillarScores: RaterScoreResult['pillarScores'] = {};
  const subdims: RaterScoreResult['subdims'] = {};
  (Object.keys(agg.pillarScores) as PillarKey[]).forEach((k) => {
    pillarScores[k] = agg.pillarScores[k]!.mean;
  });
  (Object.keys(agg.subdims) as PillarKey[]).forEach((k) => {
    const dims = agg.subdims[k]!;
    subdims[k] = Object.fromEntries(Object.entries(dims).map(([d, v]) => [d, v.mean]));
  });
  return { pillarScores, subdims };
}

// The core aggregation entrypoint - service-role, since RLS deliberately
// blocks authenticated reads of rater_submissions. Collapses every raw row
// into group means/pooled text before returning; the return type cannot
// structurally hold an individual peer/direct_report/other_stakeholder row.
export async function get360ReportData(leaderId: string): Promise<ThreeSixtyReport | null> {
  const supabase = createServiceClient();

  const { data: leader } = await supabase
    .from('leaders')
    .select('id, name, customers(name)')
    .eq('id', leaderId)
    .maybeSingle();
  if (!leader) return null;
  const customer = leader.customers as unknown as { name: string } | null;

  const { data: raterRows } = await supabase
    .from('raters')
    .select('id, rater_group, name, status')
    .eq('leader_id', leaderId);
  const raters = raterRows ?? [];

  const completedIds = raters.filter((r) => r.status === 'completed').map((r) => r.id);
  const { data: submissionRows } = completedIds.length
    ? await supabase
        .from('rater_submissions')
        .select('rater_id, computed_scores, open_responses')
        .in('rater_id', completedIds)
    : { data: [] as { rater_id: string; computed_scores: RaterScoreResult; open_responses: Record<string, string> }[] };
  const submissionsByRaterId = new Map((submissionRows ?? []).map((s) => [s.rater_id, s]));

  const presentGroups = ALL_GROUPS.filter((g) => raters.some((r) => r.rater_group === g));

  const groups: GroupAggregate[] = presentGroups.map((group) => {
    const completedInGroup = raters.filter((r) => r.rater_group === group && r.status === 'completed');
    const scores = completedInGroup
      .map((r) => submissionsByRaterId.get(r.id)?.computed_scores)
      .filter((s): s is RaterScoreResult => !!s);
    return aggregateGroup(group, scores);
  });

  const selfAgg = groups.find((g) => g.group === 'self');
  const selfScores: RaterScoreResult = selfAgg ? toRaterScoreResult(selfAgg) : { pillarScores: {}, subdims: {} };

  const { data: diagnosticSubmission } = await supabase
    .from('submissions')
    .select('computed_scores')
    .eq('leader_id', leaderId)
    .maybeSingle();
  const diagnosticScore = (diagnosticSubmission?.computed_scores as ScoreResult | undefined) ?? null;

  const selfInflationGap = diagnosticScore ? computeSelfInflationGap(diagnosticScore, selfScores) : [];
  const groupGaps = computeGroupGaps(selfScores, groups.filter((g) => g.group !== 'self'));

  const openResponses: PillarOpenResponses[] = PILLAR_KEYS.map((pillarKey) => {
    const selfRater = raters.find((r) => r.rater_group === 'self' && r.status === 'completed');
    const selfText = selfRater ? submissionsByRaterId.get(selfRater.id)?.open_responses?.[pillarKey] : undefined;

    const managerRater = raters.find((r) => r.rater_group === 'manager' && r.status === 'completed');
    const managerText = managerRater ? submissionsByRaterId.get(managerRater.id)?.open_responses?.[pillarKey] : undefined;

    const pooled = (group: RaterGroup): string[] => {
      const agg = groups.find((g) => g.group === group);
      if (!agg?.meetsMinimum) return [];
      return raters
        .filter((r) => r.rater_group === group && r.status === 'completed')
        .map((r) => submissionsByRaterId.get(r.id)?.open_responses?.[pillarKey])
        .filter((t): t is string => !!t && t.trim().length > 0);
    };

    return {
      pillarKey,
      self: selfText && selfText.trim().length > 0 ? selfText : undefined,
      manager: managerText && managerText.trim().length > 0 && managerRater
        ? { name: managerRater.name ?? 'Manager', text: managerText }
        : undefined,
      peer: pooled('peer'),
      direct_report: pooled('direct_report'),
      other_stakeholder: pooled('other_stakeholder'),
    };
  });

  return {
    leaderName: leader.name,
    orgName: customer?.name ?? '',
    diagnosticScore,
    groups,
    selfInflationGap,
    groupGaps,
    openResponses,
  };
}

export type SendReportResult = { ok: true; sentAt: string } | { ok: false; error: string };

// No email address is stored on leaders today (only name) - the CHRO
// types it in at send time, same one-off way addLeader only ever asks for
// a name. Mints the leader_report_token if one isn't already active, so
// re-clicking "send" reuses the existing link rather than rotating it.
export async function sendReportToLeader(
  leaderId: string,
  sentByUserId: string,
  leaderEmail: string,
): Promise<SendReportResult> {
  const supabase = createServiceClient();

  const { data: leader } = await supabase
    .from('leaders')
    .select('id, name, customers(name)')
    .eq('id', leaderId)
    .maybeSingle();
  if (!leader) return { ok: false, error: 'Leader not found.' };
  const customer = leader.customers as unknown as { name: string } | null;

  let tokenRow: { id: string; token: string } | null = null;
  const { data: existing } = await supabase
    .from('leader_report_tokens')
    .select('id, token')
    .eq('leader_id', leaderId)
    .is('revoked_at', null)
    .maybeSingle();
  tokenRow = existing;

  if (!tokenRow) {
    const { data: inserted, error: insertError } = await supabase
      .from('leader_report_tokens')
      .insert({ leader_id: leaderId })
      .select('id, token')
      .single();
    if (insertError || !inserted) return { ok: false, error: 'Could not create a report link.' };
    tokenRow = inserted;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const reportUrl = `${appUrl}/report/${tokenRow.token}`;

  const emailResult = await sendThreeSixtyReportEmail({
    to: leaderEmail,
    leaderName: leader.name,
    orgName: customer?.name ?? '',
    reportUrl,
  });
  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error ?? 'Could not send the email.' };
  }

  const sentAt = new Date().toISOString();
  await supabase.from('leader_report_tokens').update({ sent_at: sentAt }).eq('id', tokenRow.id);
  await logAccess({ actorId: sentByUserId, action: '360_report_sent', targetType: 'leader', targetId: leaderId, detail: leader.name });

  return { ok: true, sentAt };
}

// CHRO-console-visible status only ("sent on {date}" / "not yet sent") -
// never the token or URL itself, matching the RLS decision that
// leader_report_tokens has no authenticated-role read policy at all.
export async function getReportSendStatus(leaderId: string): Promise<{ sentAt: string | null }> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('leader_report_tokens')
    .select('sent_at')
    .eq('leader_id', leaderId)
    .is('revoked_at', null)
    .maybeSingle();
  return { sentAt: data?.sent_at ?? null };
}

// No auth - the token itself is the credential, same pattern as
// getLeaderByToken/getRaterByToken.
export async function getLeaderReportByToken(token: string): Promise<ThreeSixtyReport | null> {
  const supabase = createServiceClient();
  const { data: tokenRow } = await supabase
    .from('leader_report_tokens')
    .select('leader_id')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle();
  if (!tokenRow) return null;
  return get360ReportData(tokenRow.leader_id);
}
