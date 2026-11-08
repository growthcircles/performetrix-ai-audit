import 'server-only';
import { ITEMS, PILLARS } from './data';
import type {
  Session,
  RaterGroup,
  PillarKey,
  RaterScoreResult,
  GroupAggregate,
  SelfInflationGap,
  GroupGap,
} from './types';
import type { ScoreResult } from '@/lib/assessment/scoring';

export type { RaterScoreResult, GroupAggregate, SelfInflationGap, GroupGap };

const GROUP_GAP_THRESHOLD = 15;

function normalize(avg: number): number {
  return Math.round(((avg - 1) / 4) * 100);
}

// Every closed item must have a key in session.answers - an explicit null
// ("not able to observe") counts as answered, a missing key does not. Open
// prompts are optional per the spec, so completeness never checks them.
export function isSessionComplete(session: Session): boolean {
  return ITEMS.every((item) => session.answers[item.id] !== undefined);
}

// Per sub-dim: average the non-null items of its 3 (excluding "not able to
// observe" entirely, not treating it as neutral). A sub-dim with all 3
// answered "not able to observe" is excluded from this respondent's scores
// rather than invented from zero data. Pillar score is the mean of its
// present sub-dim scores.
export function scoreRaterSession(session: Session): RaterScoreResult {
  const pillarScores: RaterScoreResult['pillarScores'] = {};
  const subdims: RaterScoreResult['subdims'] = {};

  PILLARS.forEach((pillar) => {
    const dimScores: Record<string, number> = {};
    pillar.dims.forEach((dim) => {
      const items = ITEMS.filter((i) => i.pillarKey === pillar.key && i.dimKey === dim);
      const answered = items.map((i) => session.answers[i.id]).filter((v): v is number => v !== null && v !== undefined);
      if (answered.length > 0) {
        const avg = answered.reduce((a, b) => a + b, 0) / answered.length;
        dimScores[dim] = normalize(avg);
      }
    });
    if (Object.keys(dimScores).length > 0) {
      subdims[pillar.key] = dimScores;
      const vals = Object.values(dimScores);
      pillarScores[pillar.key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
  });

  return { pillarScores, subdims };
}

const AGGREGATED_GROUPS: RaterGroup[] = ['peer', 'direct_report', 'other_stakeholder'];

// self/manager always meet minimum (n<=1, single named data point, no
// range). peer/direct_report/other_stakeholder need >= `minimum` completed
// respondents before any score is returned - below that, only n and
// meetsMinimum:false come back, so a partial score can never be surfaced.
export function aggregateGroup(
  group: RaterGroup,
  respondentScores: RaterScoreResult[],
  minimum = 3,
): GroupAggregate {
  const n = respondentScores.length;
  const isAggregated = AGGREGATED_GROUPS.includes(group);
  const meetsMinimum = isAggregated ? n >= minimum : n >= 1;

  if (!meetsMinimum) {
    return { group, n, meetsMinimum: false, pillarScores: {}, subdims: {} };
  }

  const pillarScores: GroupAggregate['pillarScores'] = {};
  const subdims: GroupAggregate['subdims'] = {};

  PILLARS.forEach((pillar) => {
    const dimAgg: Record<string, { mean: number; min?: number; max?: number }> = {};
    pillar.dims.forEach((dim) => {
      const vals = respondentScores
        .map((r) => r.subdims[pillar.key]?.[dim])
        .filter((v): v is number => v !== undefined);
      if (vals.length === 0) return;
      const mean = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      dimAgg[dim] = isAggregated
        ? { mean, min: Math.min(...vals), max: Math.max(...vals) }
        : { mean };
    });
    if (Object.keys(dimAgg).length > 0) {
      subdims[pillar.key] = dimAgg;
      const means = Object.values(dimAgg).map((d) => d.mean);
      const pillarMean = Math.round(means.reduce((a, b) => a + b, 0) / means.length);
      if (isAggregated) {
        const pillarVals = respondentScores.map((r) => r.pillarScores[pillar.key]).filter((v): v is number => v !== undefined);
        pillarScores[pillar.key] = { mean: pillarMean, min: Math.min(...pillarVals), max: Math.max(...pillarVals) };
      } else {
        pillarScores[pillar.key] = { mean: pillarMean };
      }
    }
  });

  return { group, n, meetsMinimum: true, pillarScores, subdims };
}

// Diagnostic self-assessment score vs. this instrument's self-rated score,
// per pillar. Shown as an informational gap regardless of magnitude - the
// spec applies the >=15 flagging rule only to the self-vs-other-group
// comparison below, not to this one.
export function computeSelfInflationGap(
  diagnosticScores: ScoreResult,
  selfScores: RaterScoreResult,
): SelfInflationGap[] {
  const out: SelfInflationGap[] = [];
  (Object.keys(diagnosticScores.pillarScores) as PillarKey[]).forEach((pillarKey) => {
    const selfScore = selfScores.pillarScores[pillarKey];
    if (selfScore === undefined) return;
    const diagnosticScore = diagnosticScores.pillarScores[pillarKey];
    out.push({ pillarKey, diagnosticScore, selfScore, gap: selfScore - diagnosticScore });
  });
  return out;
}

// This instrument's self-rated score vs. each other present, minimum-met
// group's score, per pillar. Flags any gap >= 15 points in either
// direction - this is the comparison the spec calls "genuine signal."
export function computeGroupGaps(
  selfScores: RaterScoreResult,
  groupAggregates: GroupAggregate[],
  threshold = GROUP_GAP_THRESHOLD,
): GroupGap[] {
  const out: GroupGap[] = [];
  groupAggregates.forEach((agg) => {
    if (!agg.meetsMinimum || agg.group === 'self') return;
    (Object.keys(agg.pillarScores) as PillarKey[]).forEach((pillarKey) => {
      const selfScore = selfScores.pillarScores[pillarKey];
      const groupScore = agg.pillarScores[pillarKey]?.mean;
      if (selfScore === undefined || groupScore === undefined) return;
      const gap = groupScore - selfScore;
      if (Math.abs(gap) >= threshold) {
        out.push({ group: agg.group, pillarKey, selfScore, groupScore, gap, direction: gap > 0 ? 'group_higher' : 'self_higher' });
      }
    });
  });
  return out;
}
