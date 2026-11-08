import type { PillarKey, SelfInflationGap, GroupGap } from '@/lib/three-sixty/types';
import { GROUP_LABELS } from './RadarChart';

export default function ComparisonCallouts({
  pillarNames,
  selfInflationGap,
  groupGaps,
}: {
  pillarNames: Record<PillarKey, string>;
  selfInflationGap: SelfInflationGap[];
  groupGaps: GroupGap[];
}) {
  return (
    <div className="callouts">
      {selfInflationGap.length > 0 && (
        <div className="callout-panel">
          <div className="callout-title">Diagnostic self-assessment vs. this instrument&apos;s self-rating</div>
          <p className="sub" style={{ marginBottom: 12 }}>
            Roughly how much the self-view shifts once the diagnostic&apos;s forced trade-off is removed.
            A large gap here says more about how someone responds to unconstrained self-report than about
            actual capability - useful context for the coach, not something to raise directly in the
            coaching conversation.
          </p>
          {selfInflationGap.map((g) => (
            <div className="callout-row" key={g.pillarKey}>
              <span className="callout-pillar">{pillarNames[g.pillarKey]}</span>
              <span className="callout-detail">
                Diagnostic {g.diagnosticScore} &rarr; 360 self-rating {g.selfScore}
                <span className={g.gap >= 0 ? 'callout-up' : 'callout-down'}> ({g.gap >= 0 ? '+' : ''}{g.gap})</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="callout-panel">
        <div className="callout-title">Self-rating vs. each group (genuine signal)</div>
        <p className="sub" style={{ marginBottom: 12 }}>
          Same format on both sides, so this is the comparison worth treating as real. Flagged where a
          group sits 15 points or more from the self-rating, in either direction.
        </p>
        {groupGaps.length === 0 ? (
          <p className="sub">No group sits 15 or more points from the self-rating on any pillar.</p>
        ) : (
          groupGaps.map((g, i) => (
            <div className="callout-row" key={`${g.group}-${g.pillarKey}-${i}`}>
              <span className="callout-pillar">{pillarNames[g.pillarKey]} &middot; {GROUP_LABELS[g.group]}</span>
              <span className="callout-detail">
                {g.direction === 'self_higher'
                  ? `Self rates this higher (${g.selfScore}) than ${GROUP_LABELS[g.group]} sees it (${g.groupScore}) - a strength the leader believes in that this group isn't seeing evidence of.`
                  : `${GROUP_LABELS[g.group]} rates this higher (${g.groupScore}) than self does (${g.selfScore}) - the leader may be underselling something this group already recognises.`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
