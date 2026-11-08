import type { PillarKey, PillarOpenResponses } from '@/lib/three-sixty/types';
import { GROUP_LABELS } from './RadarChart';

export default function OpenResponsesSection({
  pillarNames,
  openResponses,
}: {
  pillarNames: Record<PillarKey, string>;
  openResponses: PillarOpenResponses[];
}) {
  return (
    <div className="open-responses">
      <div className="panel-title" style={{ marginBottom: 4 }}>Open-ended responses</div>
      <p className="sub" style={{ marginBottom: 16 }}>
        Shown verbatim. Manager responses are attributed; peer, direct-report, and other-stakeholder
        responses are pooled with no link back to who said what, once that group has met its minimum.
      </p>
      {openResponses.map((pr) => {
        const pooled = [
          ...pr.peer.map((text) => ({ label: GROUP_LABELS.peer, text })),
          ...pr.direct_report.map((text) => ({ label: GROUP_LABELS.direct_report, text })),
          ...pr.other_stakeholder.map((text) => ({ label: GROUP_LABELS.other_stakeholder, text })),
        ];
        const hasAny = pr.self || pr.manager || pooled.length > 0;
        if (!hasAny) return null;
        return (
          <div className="open-pillar-block" key={pr.pillarKey}>
            <div className="open-pillar-name">{pillarNames[pr.pillarKey]}</div>
            {pr.self && (
              <div className="open-response">
                <div className="open-response-source">Self</div>
                <div className="open-response-text">{pr.self}</div>
              </div>
            )}
            {pr.manager && (
              <div className="open-response">
                <div className="open-response-source">{pr.manager.name} &middot; Manager</div>
                <div className="open-response-text">{pr.manager.text}</div>
              </div>
            )}
            {pooled.map((r, i) => (
              <div className="open-response" key={i}>
                <div className="open-response-source">{r.label}</div>
                <div className="open-response-text">{r.text}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
