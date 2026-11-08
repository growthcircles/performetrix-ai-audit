import { PILLARS } from '@/lib/three-sixty/data';
import type { ThreeSixtyReport, PillarKey } from '@/lib/three-sixty/types';
import RadarChart, { GROUP_LABELS } from './RadarChart';
import SubdimBarSection from './SubdimBarSection';
import ComparisonCallouts from './ComparisonCallouts';
import OpenResponsesSection from './OpenResponsesSection';
import { Logo } from '@/components/Logo';

export default function ThreeSixtyReportView({
  orgName,
  threeSixty,
  isLeaderView = false,
  backHref,
}: {
  orgName: string;
  threeSixty: ThreeSixtyReport;
  isLeaderView?: boolean;
  backHref?: string;
}) {
  const pillarNames = Object.fromEntries(PILLARS.map((p) => [p.key, p.name])) as Record<PillarKey, string>;

  const radarSeries = threeSixty.groups
    .filter((g) => g.meetsMinimum && Object.keys(g.pillarScores).length > 0)
    .map((g) => ({
      group: g.group,
      values: Object.fromEntries(
        Object.entries(g.pillarScores).map(([k, v]) => [k, v!.mean]),
      ) as Partial<Record<PillarKey, number>>,
    }));

  return (
    <div className="theme-ink">
      <main className="shell">
        {backHref && <a className="back-link" href={backHref}>&larr; Back to console</a>}
        <div className="brand-row">
          <Logo height={32} />
          <span className="eyebrow">360 Readiness Profile</span>
        </div>
        <div className="h1">{threeSixty.leaderName}</div>
        {!isLeaderView && <div className="delivery-line">{orgName}</div>}

        <div className="legend-panel">
          <div className="legend-title">How to read this report</div>
          <ul className="legend-list">
            <li>
              Each pillar shows a line per group that has responded: self, manager, peers, direct
              reports, and other stakeholders where present.
            </li>
            <li>
              Peer, direct-report, and other-stakeholder scores only appear once at least 3 people in
              that group have responded - individual responses are never shown, only the group average.
            </li>
            <li>
              Groups are never blended together. Where a manager and direct reports see something
              differently, that disagreement is itself a finding, not noise to be averaged away.
            </li>
          </ul>
        </div>

        {radarSeries.length > 0 && (
          <RadarChart pillars={PILLARS.map((p) => ({ key: p.key, name: p.name }))} series={radarSeries} />
        )}

        {PILLARS.map((pillar) => (
          <div className="pillar-detail" key={pillar.key}>
            <div className="pillar-detail-head">
              <div className="pillar-detail-name">{pillar.name}</div>
            </div>
            {pillar.dims.map((dim) => (
              <SubdimBarSection
                key={dim}
                pillarKey={pillar.key}
                dimKey={dim}
                dimLabel={pillar.dimLabels[dim]}
                groups={threeSixty.groups}
              />
            ))}
          </div>
        ))}

        <ComparisonCallouts
          pillarNames={pillarNames}
          selfInflationGap={threeSixty.selfInflationGap}
          groupGaps={threeSixty.groupGaps}
        />

        <OpenResponsesSection pillarNames={pillarNames} openResponses={threeSixty.openResponses} />

        <div className="method-note">
          Closed items use a 1-5 observed-frequency scale ({`"never observed this"`} to
          {` "consistently observed this"`}), with {`"not able to observe"`} excluded from scoring
          entirely rather than treated as a neutral middle value. Each item is normalized onto the same
          0-100 scale as the diagnostic self-assessment. Groups shown: {threeSixty.groups.map((g) => GROUP_LABELS[g.group]).join(', ')}.
        </div>
      </main>
    </div>
  );
}
