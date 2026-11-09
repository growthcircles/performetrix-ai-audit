import 'server-only';
import { DIMENSION_ORDER, DIMENSIONS, bandForScore } from './data';
import type { Answer, DiagnosticResult, DimensionScore, MaturityBand } from './types';

// Scale: 1 = never, 2 = rarely, 3 = sometimes, 4 = often, 5 = always.
// A dimension score is the mean of its three answers, then normalized to 0-100.
function normalize(score: number): number {
  return Math.round(((score - 1) / 4) * 100);
}

export function scoreDiagnostic(answers: Answer): DiagnosticResult {
  const scores: DimensionScore[] = DIMENSION_ORDER.map((key) => {
    const dim = require('./data').DIMENSIONS.find((d) => d.key === key)!;
    const values = dim.questions
      .map((q) => answers[q.key])
      .filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5);
    const mean = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    const normalized = normalize(mean);
    const band = bandForScore(normalized);
    return { key, name: dim.name, score: normalized, band };
  });

  const overall = Math.round(
    scores.reduce((a, s) => a + s.score, 0) / scores.length,
  );

  return {
    dimensions: scores,
    overall,
    band: bandForScore(overall),
    answeredAt: new Date().toISOString(),
  };
}

export { bandForScore, type MaturityBand };