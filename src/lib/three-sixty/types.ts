// Plain type definitions only, no runtime code and no 'server-only' import
// - safe to import from Client Components. Mirrors the split used by
// src/lib/assessment/types.ts for the diagnostic instrument.

export type RaterGroup = 'self' | 'manager' | 'peer' | 'direct_report' | 'other_stakeholder';

export type PillarKey = 'succession' | 'global' | 'judgment' | 'relationship';

// Item answers: 1-5, or null for "Not able to observe". A key that's
// simply absent means "not yet answered" (different from an explicit null).
export type Session = {
  answers: Record<string, number | null>;
  openResponses: Partial<Record<PillarKey, string>>;
};

// Sanitized shapes safe to send to the client: item/prompt text with the
// wording already resolved for the rater's group (self vs. other) and the
// leader's name substituted, no internal pillar/dim keys attached to items.
export type PublicItem = { id: string; text: string };
export type PublicPillar = {
  key: PillarKey;
  name: string;
  items: PublicItem[];
  openPrompt: string;
};

// A single respondent's scores (one rater, or the leader's own self-rating).
export type RaterScoreResult = {
  pillarScores: Partial<Record<PillarKey, number>>;
  subdims: Partial<Record<PillarKey, Record<string, number>>>;
};

export type SubdimAggregate = { mean: number; min?: number; max?: number };
export type PillarAggregate = { mean: number; min?: number; max?: number };

// A group's aggregated scores (peer/direct_report/other_stakeholder once
// minimum met; self/manager stand alone with n<=1). meetsMinimum:false
// means the group is present but below its threshold - no score fields are
// populated in that case, by construction, so a partial score can never
// leak through this type.
export type GroupAggregate = {
  group: RaterGroup;
  n: number;
  meetsMinimum: boolean;
  pillarScores: Partial<Record<PillarKey, PillarAggregate>>;
  subdims: Partial<Record<PillarKey, Record<string, SubdimAggregate>>>;
};

export type SelfInflationGap = { pillarKey: PillarKey; diagnosticScore: number; selfScore: number; gap: number };
export type GroupGap = { group: RaterGroup; pillarKey: PillarKey; selfScore: number; groupScore: number; gap: number; direction: 'self_higher' | 'group_higher' };

// Pooled, de-identified open-text responses for one pillar. manager is
// attributed by name (never anonymized); other groups are a flat pooled
// list with no rater linkage retained.
export type PillarOpenResponses = {
  pillarKey: PillarKey;
  self?: string;
  manager?: { name: string; text: string };
  peer: string[];
  direct_report: string[];
  other_stakeholder: string[];
};

// Composed report shape returned by get360ReportData - the single object
// every report-rendering surface (coach view, CHRO view, leader-delivery
// view) is built from. Structurally cannot hold individual peer/
// direct_report/other_stakeholder rows - only GroupAggregate entries.
export type ThreeSixtyReport = {
  leaderName: string;
  orgName: string;
  diagnosticScore: import('@/lib/assessment/scoring').ScoreResult | null;
  groups: GroupAggregate[];
  selfInflationGap: SelfInflationGap[];
  groupGaps: GroupGap[];
  openResponses: PillarOpenResponses[];
};
