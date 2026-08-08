import 'server-only';
import { PILLAR_ORDER } from './data';
import type { ScoreResult } from './scoring';

// Static sample data for Shiva's sales-conversation preview report -
// ported from the prototype's sampleScores(). Never touches the database,
// so it can never be mistaken for a real customer submission.
const SUBDIMS: Record<string, Record<string, number>> = {
  succession: { ownership: 85, decisiveness: 80, development: 88 },
  judgment: { decisiveness: 70, feedback: 35, values: 60 },
  relationship: { consistency: 92, surfacing: 88, individual: 90 },
  global: { adaptation: 78, curiosity: 82, awareness: 55 },
};

export function getSampleScores(): ScoreResult {
  const pillarScores: Record<string, number> = {};
  PILLAR_ORDER.forEach((p) => {
    const vals = p.dims.map((d) => SUBDIMS[p.key][d]);
    pillarScores[p.key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  });
  const overall = Math.round(
    PILLAR_ORDER.reduce((a, p) => a + pillarScores[p.key], 0) / PILLAR_ORDER.length,
  );
  return { overall, pillarScores, subdims: SUBDIMS };
}
