import { PILLAR_ORDER, IMPACT, SUBDIM_DESC } from '@/lib/assessment/data';
import type { ScoreResult } from '@/lib/assessment/scoring';
import Gauge from './Gauge';
import { Logo } from '@/components/Logo';

const THRESHOLD = 80;

export default function ReportView({
  leaderName,
  orgName,
  chroName,
  scores,
  isPreview = false,
  backHref,
}: {
  leaderName: string;
  orgName: string;
  chroName: string;
  scores: ScoreResult;
  isPreview?: boolean;
  backHref: string;
}) {
  const flagged = PILLAR_ORDER.filter((p) => scores.pillarScores[p.key] <= THRESHOLD);

  return (
    <div className="theme-ink">
      <main className="shell">
        <a className="back-link" href={backHref}>&larr; Back to console</a>
        {isPreview && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            Preview only: sample data, not a real submission.
          </div>
        )}
        <div className="brand-row">
          <Logo height={32} />
          <span className="eyebrow">Readiness Profile</span>
        </div>
        <div className="h1">{leaderName}</div>
        <div className="delivery-line">
          Delivered to {chroName} &middot; {orgName} &nbsp;&middot;&nbsp; cc PerforMetrix
        </div>

        <div className="legend-panel">
          <div className="legend-title">How to read this report</div>
          <ul className="legend-list">
            <li>{leaderName}&apos;s overall PerforMetrix score is the average of the four pillar scores below, each scored out of 100.</li>
            <li>Each pillar breaks into three sub-dimensions. These show what is actually driving that pillar&apos;s number, not just the number itself.</li>
            <li>
              This is a self-assessment only. It is a diagnostic for where to focus, not a final verdict, a fuller
              picture forms once stakeholder input joins it in the coaching programme.
            </li>
          </ul>
          <div className="legend-swatches">
            <div className="legend-swatch">
              <div className="legend-dot dot-brass" />Score above {THRESHOLD}, on track
            </div>
            <div className="legend-swatch">
              <div className="legend-dot dot-rust" />Score at or below {THRESHOLD}, priority gap
            </div>
          </div>
        </div>

        <div className="score-hero">
          <div className="score-big">{scores.overall}</div>
          <div>
            <div className="score-big-label">The overall PerforMetrix score for {leaderName}</div>
            <div style={{ fontSize: 12.5, opacity: 0.6, marginTop: 4 }}>
              Self-assessment only. Stakeholder 360 runs once coaching begins.
            </div>
          </div>
        </div>

        <div className="gauge-grid">
          {PILLAR_ORDER.map((p) => {
            const score = scores.pillarScores[p.key];
            return (
              <div className="gauge-card" key={p.key}>
                <div className="gauge-wrap">
                  <Gauge score={score} />
                  <div className="gauge-value">{score}</div>
                </div>
                <div className="gauge-name">{p.name}</div>
                {score <= THRESHOLD && <div className="gauge-flag">Priority gap</div>}
              </div>
            );
          })}
        </div>

        {flagged.length ? (
          <div className="impact-summary">
            <div className="impact-summary-title">What this could mean for {orgName}</div>
            {flagged.map((p) => (
              <div className="impact-item" key={p.key}>
                <div className="impact-item-name">{p.name}</div>
                <div className="impact-item-text">{IMPACT[p.key]}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="impact-summary clear">
            <div className="impact-summary-title">No priority gaps flagged</div>
            <div className="impact-item-text">
              All four pillars sit above the priority threshold. Worth a lighter-touch programme focused on
              sharpening strengths rather than closing gaps.
            </div>
          </div>
        )}

        {PILLAR_ORDER.map((p) => {
          const score = scores.pillarScores[p.key];
          const isFlagged = score <= THRESHOLD;
          return (
            <div className="pillar-detail" key={p.key}>
              <div className="pillar-detail-head">
                <div className="pillar-detail-name">{p.name}</div>
                <div className="pillar-detail-score">{score} / 100</div>
              </div>
              {p.dims.map((d) => {
                const v = scores.subdims[p.key][d];
                return (
                  <div className="subdim-block" key={d}>
                    <div className="subdim-top">
                      <span className="subdim-name">{p.dimLabels[d]}</span>
                      <span className="subdim-score">{v}</span>
                    </div>
                    <div className="subdim-bar">
                      <div className="subdim-fill" style={{ width: `${v}%` }} />
                    </div>
                    <div className="subdim-desc">{SUBDIM_DESC[p.key][d]}</div>
                  </div>
                );
              })}
              <div className={`pillar-impact ${isFlagged ? 'flagged' : ''}`}>{IMPACT[p.key]}</div>
            </div>
          );
        })}

        <div className="method-note">
          Scoring is ipsative at the item level and normative at the pillar level. Statements and scenarios force a
          trade-off rather than an independent rating, which is what keeps self-report inflation out. Pillar and
          overall scores are then normalized for comparison against the priority gap threshold, set at {THRESHOLD},
          deliberately higher than a typical scale to account for the absence of stakeholder input at this stage.
        </div>
      </main>
    </div>
  );
}

