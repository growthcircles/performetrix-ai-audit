import 'server-only';
import { PILLAR_ORDER } from './data';
import type { ForcedAnswer, Session } from './types';

export type { ForcedAnswer, Session };

export type ScoreResult = {
  overall: number;
  pillarScores: Record<string, number>;
  subdims: Record<string, Record<string, number>>;
};

function normalize(sum: number): number {
  return Math.round(((sum - 2) / 4) * 100);
}

// Validates that every step in the session has a complete answer, before
// any scoring happens. Never trust that the client only ever sent what the
// UI would have produced.
export function isSessionComplete(session: Session): boolean {
  return PILLAR_ORDER.every((pillar) => {
    const answer = session[pillar.key];
    if (pillar.type === 'forced') {
      const blocks = answer as ForcedAnswer[] | undefined;
      if (!blocks || blocks.length !== pillar.blocks!.length) return false;
      return blocks.every((block) => {
        const ranks = pillar.dims.map((d) => block?.[d]);
        return (
          ranks.every((r) => r === 1 || r === 2 || r === 3) &&
          new Set(ranks).size === 3
        );
      });
    }
    const choices = answer as (string | null)[] | undefined;
    if (!choices || choices.length !== pillar.scenarios!.length) return false;
    return choices.every((choiceKey, i) =>
      pillar.scenarios![i].options.some((o) => o.key === choiceKey),
    );
  });
}

export function scoreSession(session: Session): ScoreResult {
  const pillarScores: Record<string, number> = {};
  const subdims: Record<string, Record<string, number>> = {};

  PILLAR_ORDER.forEach((pillar) => {
    const dimSums: Record<string, number> = {};
    pillar.dims.forEach((d) => (dimSums[d] = 0));

    if (pillar.type === 'forced') {
      const blocks = session[pillar.key] as ForcedAnswer[];
      blocks.forEach((block) => {
        pillar.dims.forEach((d) => {
          dimSums[d] += block[d] || 0;
        });
      });
    } else {
      const choices = session[pillar.key] as (string | null)[];
      choices.forEach((choiceKey, i) => {
        const scenario = pillar.scenarios![i];
        const opt = scenario.options.find((o) => o.key === choiceKey);
        if (opt) {
          pillar.dims.forEach((d) => {
            dimSums[d] += opt.dims[d];
          });
        }
      });
    }

    const dimScores: Record<string, number> = {};
    pillar.dims.forEach((d) => (dimScores[d] = normalize(dimSums[d])));
    subdims[pillar.key] = dimScores;

    const vals = pillar.dims.map((d) => dimScores[d]);
    pillarScores[pillar.key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });

  const overall = Math.round(
    PILLAR_ORDER.reduce((a, p) => a + pillarScores[p.key], 0) / PILLAR_ORDER.length,
  );

  return { overall, pillarScores, subdims };
}
