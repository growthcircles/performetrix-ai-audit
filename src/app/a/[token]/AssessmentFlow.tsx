'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { PublicPillar, ForcedAnswer, Session } from '@/lib/assessment/types';
import { submitAssessmentAction } from './actions';
import { Logo } from '@/components/Logo';

type Step =
  | { kind: 'welcome' }
  | { kind: 'intro'; section: 'forced' | 'scenario' }
  | { kind: 'forced'; pillarKey: string; index: number; pos: number; total: number }
  | { kind: 'scenario'; pillarKey: string; index: number; pos: number; total: number };

// Fisher-Yates - items are shuffled across pillars within each section so
// question order never groups by pillar, which would otherwise hint at
// which trait a given question is measuring.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSteps(pillars: PublicPillar[]): Step[] {
  const forcedItems = shuffle(
    pillars
      .filter((p) => p.type === 'forced')
      .flatMap((p) => p.blocks!.map((_, index) => ({ pillarKey: p.key, index }))),
  );
  const scenarioItems = shuffle(
    pillars
      .filter((p) => p.type === 'scenario')
      .flatMap((p) => p.scenarios!.map((_, index) => ({ pillarKey: p.key, index }))),
  );

  const steps: Step[] = [{ kind: 'welcome' }, { kind: 'intro', section: 'forced' }];
  forcedItems.forEach((item, i) =>
    steps.push({ kind: 'forced', pillarKey: item.pillarKey, index: item.index, pos: i + 1, total: forcedItems.length }),
  );
  steps.push({ kind: 'intro', section: 'scenario' });
  scenarioItems.forEach((item, i) =>
    steps.push({ kind: 'scenario', pillarKey: item.pillarKey, index: item.index, pos: i + 1, total: scenarioItems.length }),
  );
  return steps;
}

function buildInitialSession(pillars: PublicPillar[]): Session {
  const session: Session = {};
  pillars.forEach((p) => {
    session[p.key] = p.type === 'forced' ? p.blocks!.map(() => ({})) : p.scenarios!.map(() => null);
  });
  return session;
}

function welcomeContent(leaderName: string, orgName: string, totalQuestions: number) {
  return {
    eyebrow: 'FutureReady Leadership Assessment',
    heading: `Welcome, ${leaderName}`,
    body: (
      <>
        <p className="sub">
          {orgName ? `${orgName} has` : 'Your organisation has'} asked you to complete this FutureReady
          Leadership Assessment as part of its leadership development programme.
        </p>
        <p className="sub">
          It measures four pillars of leadership readiness: Succession-Ready, Judgment-Ready,
          Relationship-Ready, and Globally-Ready - each built from three underlying sub-dimensions. It&apos;s
          a self-assessment: a diagnostic for where to focus, not a test with a pass or fail.
        </p>
        <p className="sub">
          There are {totalQuestions} short screens across two sections, one ranking exercise and one set
          of judgment scenarios, and it should take about 10&ndash;15 minutes. Your individual results are
          confidential: only your CHRO and the executive coach at FutureReady Leadership see them, and
          nothing is shared with colleagues.
        </p>
      </>
    ),
  };
}

function introContent(section: 'forced' | 'scenario', total: number) {
  if (section === 'forced') {
    return {
      eyebrow: 'Assessment · Part 1 of 2',
      heading: 'Forced-choice ranking',
      body: (
        <>
          <p className="sub">
            In this section, each screen shows you three statements. Rank them <em>in the order they describe you</em> - most like you first, least like you last.
          </p>
          <p className="sub">
            There&apos;s no &quot;correct&quot; ranking, and no option to rate a statement as low or high on its own. You&apos;re forced to choose between things that might all feel somewhat true, which is deliberate: it&apos;s what keeps the results honest rather than everyone scoring themselves highly across the board.
          </p>
          <p className="sub">
            Go with your first instinct rather than overthinking the order. There are {total} screens in this section.
          </p>
        </>
      ),
    };
  }
  return {
    eyebrow: 'Assessment · Part 2 of 2',
    heading: 'Judgment scenarios',
    body: (
      <>
        <p className="sub">
          This section presents realistic leadership situations, each with four possible responses. Read the situation, then pick the single response <em>closest to how you&apos;d actually act</em> - not how you think you should act.
        </p>
        <p className="sub">
          There&apos;s no correct answer. The situations are designed to be ambiguous on purpose, so go with your genuine instinct rather than the &quot;safest-sounding&quot; option.
        </p>
        <p className="sub">
          There are {total} scenarios in this section.
        </p>
      </>
    ),
  };
}

export default function AssessmentFlow({
  token,
  leaderName,
  orgName,
  pillars,
}: {
  token: string;
  leaderName: string;
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
      <div className="theme-ink">
        <main className="shell confirm-box">
          <div style={{ marginBottom: 18 }}><Logo height={36} /></div>
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
  const isLast = stepIdx === steps.length - 1;
  const pct = Math.round((stepIdx / steps.length) * 100);

  let canNext = false;
  let stepLabel = '';
  let heading: string | null = null;
  let body: ReactNode = null;
  let nextLabel = isLast ? 'Submit' : 'Next';

  if (step.kind === 'welcome') {
    canNext = true;
    nextLabel = 'Begin';
    const totalQuestions = steps.filter((s) => s.kind === 'forced' || s.kind === 'scenario').length;
    const content = welcomeContent(leaderName, orgName, totalQuestions);
    stepLabel = content.eyebrow;
    heading = content.heading;
    body = content.body;
  } else if (step.kind === 'intro') {
    canNext = true;
    nextLabel = 'Continue';
    const total = step.section === 'forced'
      ? steps.filter((s) => s.kind === 'forced').length
      : steps.filter((s) => s.kind === 'scenario').length;
    const content = introContent(step.section, total);
    stepLabel = content.eyebrow;
    heading = content.heading;
    body = content.body;
  } else if (step.kind === 'forced') {
    const pillar = pillars.find((p) => p.key === step.pillarKey)!;
    const block = pillar.blocks![step.index];
    const answer = session[pillar.key][step.index] as ForcedAnswer;
    canNext = Object.keys(answer).length === 3;
    stepLabel = `Forced-choice ranking · Question ${step.pos} of ${step.total}`;

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
          // Badge shows click order (1st, 2nd, 3rd), not the underlying
          // score weight, so the order you click in doesn't visibly map to
          // "higher number = more points" and invite gaming the ranking.
          const clickOrder = rank ? 4 - rank : null;
          return (
            <div
              key={dim}
              className={`rank-card ${rank ? 'ranked' : ''}`}
              onClick={() => handleRank(dim)}
            >
              {clickOrder ? <div className="rank-badge">{clickOrder}</div> : <div className="rank-empty" />}
              <div className="rank-text">{block[dim]}</div>
            </div>
          );
        })}
        <div className="reset-link" onClick={resetBlock}>Start this block over</div>
      </>
    );
  } else {
    const pillar = pillars.find((p) => p.key === step.pillarKey)!;
    const scenario = pillar.scenarios![step.index];
    const chosen = session[pillar.key][step.index] as string | null;
    canNext = !!chosen;
    stepLabel = `Judgment scenarios · Question ${step.pos} of ${step.total}`;

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
    <div className="theme-ink">
      <main className="shell">
        <div className="brand-row">
          <Logo />
          <span className="eyebrow">Assessment{orgName ? ` · ${orgName}` : ''}</span>
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
