const { DIMENSION_ORDER, DIMENSIONS, bandForScore } = require('./data');

// Scale: 1 = never, 2 = rarely, 3 = sometimes, 4 = often, 5 = always.
// A dimension score is the mean of its three answers, normalized to 0-100.
function normalize(score) {
  return Math.round(((score - 1) / 4) * 100);
}

function scoreDiagnostic(answers) {
  const scores = DIMENSION_ORDER.map((key) => {
    const dim = DIMENSIONS.find((d) => d.key === key);
    const values = dim.questions
      .map((q) => answers[q.key])
      .filter((v) => typeof v === 'number' && v >= 1 && v <= 5);
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

module.exports = { scoreDiagnostic, bandForScore };
