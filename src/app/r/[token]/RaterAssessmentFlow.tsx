'use client';

import { useMemo, useState } from 'react';
import type { PublicPillar, Session, RaterGroup, PillarKey } from '@/lib/three-sixty/types';
import { submitRaterAssessmentAction } from './actions';
import { Logo } from '@/components/Logo';

type FlatItem = { pillarKey: PillarKey; itemId: string; text: string };

type Step =
  | { kind: 'intro' }
  | { kind: 'item'; itemIndex: number; pos: number; total: number }
  | { kind: 'open'; pillarKey: PillarKey; pos: number; total: number };

// Fisher-Yates - items shuffle across pillars so question order never
// groups by pillar, same anti-hinting rationale as the diagnostic's
// AssessmentFlow.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildFlatItems(pillars: PublicPillar[]): FlatItem[] {
  return shuffle(
    pillars.flatMap((p) => p.items.map((item) => ({ pillarKey: p.key, itemId: item.id, text: item.text }))),
  );
}

function buildSteps(items: FlatItem[], pillars: PublicPillar[]): Step[] {
  const steps: Step[] = [{ kind: 'intro' }];
  items.forEach((_, i) => steps.push({ kind: 'item', itemIndex: i, pos: i + 1, total: items.length }));
  pillars.forEach((p, i) => steps.push({ kind: 'open', pillarKey: p.key, pos: i + 1, total: pillars.length }));
  return steps;
}

const SCALE = [
  { value: 1, label: 'Never observed this' },
  { value: 2, label: 'Rarely observed this' },
  { value: 3, label: 'Sometimes observed this' },
  { value: 4, label: 'Often observed this' },
  { value: 5, label: 'Consistently observed this' },
];

export default function RaterAssessmentFlow({
  token,
  leaderName,
  orgName,
  raterGroup,
  pillars,
}: {
  token: string;
  leaderName: string;
  orgName: string;
  raterGroup: RaterGroup;
  pillars: PublicPillar[];
}) {
  const items = useMemo(() => buildFlatItems(pillars), [pillars]);
  const steps = useMemo(() => buildSteps(items, pillars), [items, pillars]);
  const [stepIdx, setStepIdx] = useState(0);
  const [session, setSession] = useState<Session>({ answers: {}, openResponses: {} });
  const [status, setStatus] = useState<'in-progress' | 'submitting' | 'done' | 'error'>('in-progress');
  const [error, setError] = useState<string | null>(null);

  const isSelf = raterGroup === 'self';
  const subjectLabel = isSelf ? 'yourself' : leaderName;

  if (status === 'done') {
    return (
      <div className="theme-ink">
        <main className="shell confirm-box">
          <div style={{ marginBottom: 18 }}><Logo height={36} /></div>
          <div className="confirm-mark">&#10003;</div>
          <div className="h1" style={{ fontSize: 26 }}>Thanks, that&apos;s submitted</div>
          <p className="sub" style={{ margin: '0 auto' }}>
            Your responses have been sent for review. Individual responses are never shared with the
            leader or anyone else directly - only group averages, once enough people have responded.
          </p>
        </main>
      </div>
    );
  }

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const pct = Math.round((stepIdx / steps.length) * 100);

  let canNext = false;
  let stepLabel = '';
  let heading: string | null = null;
  let body: React.ReactNode = null;
  let nextLabel = isLast ? 'Submit' : 'Next';

  if (step.kind === 'intro') {
    canNext = true;
    nextLabel = 'Continue';
    stepLabel = 'Instructions';
    heading = isSelf ? 'Rating yourself' : `Rating ${leaderName}`;
    body = (
      <>
        <p className="sub">
          For each statement, rate how often you have personally observed {subjectLabel} do this, based
          only on what you&apos;ve actually seen or heard. If you haven&apos;t had the opportunity to
          observe this directly, choose &quot;Not able to observe&quot; rather than guessing.
        </p>
        <p className="sub">
          There are {items.length} statements, followed by 4 short open-ended questions. The open
          questions are optional, but a specific example is more useful than a general impression.
        </p>
      </>
    );
  } else if (step.kind === 'item') {
    const item = items[step.itemIndex];
    const chosen = session.answers[item.itemId];
    canNext = chosen !== undefined;
    stepLabel = `Question ${step.pos} of ${step.total}`;

    const choose = (value: number | null) => {
      setSession((prev) => ({ ...prev, answers: { ...prev.answers, [item.itemId]: value } }));
    };

    body = (
      <>
        <div className="scenario-context">{item.text}</div>
        {SCALE.map((s) => (
          <div
            key={s.value}
            className={`option-card ${chosen === s.value ? 'selected' : ''}`}
            onClick={() => choose(s.value)}
          >
            <div className="option-key">{s.value}</div>
            <div className="option-text">{s.label}</div>
          </div>
        ))}
        <div
          className={`option-card ${chosen === null ? 'selected' : ''}`}
          onClick={() => choose(null)}
        >
          <div className="option-key">N/A</div>
          <div className="option-text">Not able to observe</div>
        </div>
      </>
    );
  } else {
    const pillar = pillars.find((p) => p.key === step.pillarKey)!;
    const text = session.openResponses[step.pillarKey] ?? '';
    canNext = true;
    stepLabel = `Open question ${step.pos} of ${step.total} · optional`;
    heading = pillar.name;

    const setText = (value: string) => {
      setSession((prev) => ({ ...prev, openResponses: { ...prev.openResponses, [step.pillarKey]: value } }));
    };

    body = (
      <>
        <p className="rank-hint">{pillar.openPrompt}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Optional - a specific example is more useful than a general impression."
          style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, padding: 10, background: 'var(--ink-3)', border: '1px solid var(--ink-line)', color: 'inherit', borderRadius: 2 }}
        />
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
    const result = await submitRaterAssessmentAction(token, session);
    if (result.ok) {
      setStatus('done');
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <div className="theme-ink">
      <main className="shell">
        <div className="brand-row">
          <Logo />
          <span className="eyebrow">360 Assessment{orgName ? ` · ${orgName}` : ''}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="step-label">{stepLabel}</div>
        {heading && <div className="h1" style={{ fontSize: 26 }}>{heading}</div>}
        {body}
        {status === 'error' && <p className="form-error">{error}</p>}
        <div className="step-actions">
          {stepIdx > 0 ? (
            <span className="reset-link" onClick={() => setStepIdx((i) => i - 1)}>Back</span>
          ) : (
            <span />
          )}
          <button
            className="btn"
            disabled={!canNext || status === 'submitting'}
            onClick={handleNext}
          >
            {status === 'submitting' ? 'Submitting…' : nextLabel}
          </button>
        </div>
      </main>
    </div>
  );
}
