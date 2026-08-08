'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { PublicPillar, ForcedAnswer, Session } from '@/lib/assessment/types';
import { submitAssessmentAction } from './actions';

type Step = { pillarKey: string; kind: 'forced' | 'scenario'; index: number };

function buildSteps(pillars: PublicPillar[]): Step[] {
  const steps: Step[] = [];
  pillars.forEach((p) => {
    if (p.type === 'forced') {
      p.blocks!.forEach((_, i) => steps.push({ pillarKey: p.key, kind: 'forced', index: i }));
    } else {
      p.scenarios!.forEach((_, i) => steps.push({ pillarKey: p.key, kind: 'scenario', index: i }));
    }
  });
  return steps;
}

function buildInitialSession(pillars: PublicPillar[]): Session {
  const session: Session = {};
  pillars.forEach((p) => {
    session[p.key] = p.type === 'forced' ? p.blocks!.map(() => ({})) : p.scenarios!.map(() => null);
  });
  return session;
}

export default function AssessmentFlow({
  token,
  orgName,
  pillars,
}: {
  token: string;
  orgName: string;
  pillars: PublicPillar[];
}) {
  const steps = useMemo(() => buildSteps(pillars), [pillars]);
  const [stepIdx, setStepIdx] = useState(0);
  const [session, setSession] = useState<Session>(() => buildInitialSession(pillars));
  const [status, setStatus] = useState<'in-progress' | 'submitting' | 'done' | 'error'>('in-progress');
  const [error, setError] = useState<string | null>(null);

  if (status === 'done') {
    return (
      <div className="theme-paper">
        <main className="shell confirm-box">
          <div className="confirm-mark">&#10003;</div>
          <div className="h1" style={{ fontSize: 26 }}>Thanks, that&apos;s submitted</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            Your responses have been sent for review. Nothing here is visible to your colleagues.
          </p>
        </main>
      </div>
    );
  }

  const step = steps[stepIdx];
  const pillar = pillars.find((p) => p.key === step.pillarKey)!;
  const isLast = stepIdx === steps.length - 1;
  const pct = Math.round((stepIdx / steps.length) * 100);

  let canNext = false;
  let body: ReactNode = null;

  if (step.kind === 'forced') {
    const block = pillar.blocks![step.index];
    const answer = session[pillar.key][step.index] as ForcedAnswer;
    canNext = Object.keys(answer).length === 3;

    const handleRank = (dim: string) => {
      if (answer[dim]) return;
      const used = Object.values(answer);
      const nextRank = 3 - used.length;
      setSession((prev) => {
        const next = structuredClone(prev);
        (next[pillar.key] as ForcedAnswer[])[step.index] = { ...answer, [dim]: nextRank };
        return next;
      });
    };

    const resetBlock = () => {
      setSession((prev) => {
        const next = structuredClone(prev);
        (next[pillar.key] as ForcedAnswer[])[step.index] = {};
        return next;
      });
    };

    body = (
      <>
        <p className="rank-hint">Click the statements in order, most like you first, least like you last.</p>
        {pillar.dims.map((dim) => {
          const rank = answer[dim];
          return (
            <div
              key={dim}
              className={`rank-card ${rank ? 'ranked' : ''}`}
              onClick={() => handleRank(dim)}
            >
              {rank ? <div className="rank-badge">{rank}</div> : <div className="rank-empty" />}
              <div className="rank-text">{block[dim]}</div>
            </div>
          );
        })}
        <div className="reset-link" onClick={resetBlock}>Start this block over</div>
      </>
    );
  } else {
    const scenario = pillar.scenarios![step.index];
    const chosen = session[pillar.key][step.index] as string | null;
    canNext = !!chosen;

    const choose = (key: string) => {
      setSession((prev) => {
        const next = structuredClone(prev);
        (next[pillar.key] as (string | null)[])[step.index] = key;
        return next;
      });
    };

    body = (
      <>
        <p className="rank-hint">
          Read the situation, then choose the single response closest to how you&apos;d actually act.
          There&apos;s no correct answer, pick what you&apos;d really do.
        </p>
        <div className="scenario-context">{scenario.context}</div>
        {scenario.options.map((o) => (
          <div
            key={o.key}
            className={`option-card ${chosen === o.key ? 'selected' : ''}`}
            onClick={() => choose(o.key)}
          >
            <div className="option-key">{o.key}</div>
            <div className="option-text">{o.text}</div>
          </div>
        ))}
      </>
    );
  }

  const handleNext = async () => {
    if (!isLast) {
      setStepIdx((i) => i + 1);
      return;
    }
    setStatus('submitting');
    setError(null);
    const result = await submitAssessmentAction(token, session);
    if (result.ok) {
      setStatus('done');
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <div className="theme-paper">
      <main className="shell">
        <div className="eyebrow">FutureReady Assessment{orgName ? ` · ${orgName}` : ''}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="step-label">
          {pillar.name} · Part {step.index + 1} of {step.kind === 'forced' ? pillar.blocks!.length : pillar.scenarios!.length}
        </div>
        {body}
        {status === 'error' && <p className="form-error">{error}</p>}
        <div className="step-actions">
          {stepIdx > 0 ? (
            <span className="reset-link" onClick={() => setStepIdx((i) => i - 1)}>Back</span>
          ) : (
            <span />
          )}
          <button
            className="btn btn-paper"
            disabled={!canNext || status === 'submitting'}
            onClick={handleNext}
          >
            {status === 'submitting' ? 'Submitting…' : isLast ? 'Submit' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}
