// Extends the diagnostic report's plain <div style={{width}}> bar pattern
// with one bar per present/qualifying rater group, plus a min-max range
// whisker for aggregated groups (peer/direct_report/other_stakeholder).
import type { PillarKey, GroupAggregate, RaterGroup } from '@/lib/three-sixty/types';
import { GROUP_COLORS, GROUP_LABELS } from './RadarChart';

const GROUP_ORDER: RaterGroup[] = ['self', 'manager', 'peer', 'direct_report', 'other_stakeholder'];

export default function SubdimBarSection({
  pillarKey,
  dimKey,
  dimLabel,
  dimDesc,
  groups,
}: {
  pillarKey: PillarKey;
  dimKey: string;
  dimLabel: string;
  dimDesc?: string;
  groups: GroupAggregate[];
}) {
  const rows = GROUP_ORDER
    .map((group) => groups.find((g) => g.group === group))
    .filter((g): g is GroupAggregate => !!g);

  return (
    <div className="subdim-block">
      <div className="subdim-top">
        <span className="subdim-name">{dimLabel}</span>
      </div>
      {dimDesc && <div className="subdim-desc" style={{ marginBottom: 10 }}>{dimDesc}</div>}
      {rows.map((agg) => {
        const dim = agg.subdims[pillarKey]?.[dimKey];
        if (!agg.meetsMinimum || !dim) {
          return (
            <div className="group-bar-row" key={agg.group}>
              <div className="group-bar-label">{GROUP_LABELS[agg.group]}</div>
              <div className="group-bar-awaiting">
                {agg.n === 0 ? 'Not yet started' : `Awaiting more responses (${agg.n} of 3 minimum)`}
              </div>
            </div>
          );
        }
        const hasRange = dim.min !== undefined && dim.max !== undefined && dim.min !== dim.max;
        return (
          <div className="group-bar-row" key={agg.group}>
            <div className="group-bar-label">{GROUP_LABELS[agg.group]}</div>
            <div className="group-bar-track">
              {hasRange && (
                <div
                  className="group-bar-range"
                  style={{ left: `${dim.min}%`, width: `${dim.max! - dim.min!}%`, background: GROUP_COLORS[agg.group] }}
                />
              )}
              <div className="group-bar-fill" style={{ width: `${dim.mean}%`, background: GROUP_COLORS[agg.group] }} />
            </div>
            <div className="group-bar-score">
              {dim.mean}{hasRange ? ` (${dim.min}–${dim.max})` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
