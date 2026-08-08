// Ported from the prototype's gaugeSvg(): a ring gauge with a fixed tick
// mark at the 80-point priority threshold, regardless of the score shown.
export default function Gauge({ score }: { score: number }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const priority = score <= 80;
  const tickAngle = -90 + 0.8 * 360;
  const rad = (tickAngle * Math.PI) / 180;
  const x1 = 60 + 42 * Math.cos(rad);
  const y1 = 60 + 42 * Math.sin(rad);
  const x2 = 60 + 58 * Math.cos(rad);
  const y2 = 60 + 58 * Math.sin(rad);

  return (
    <svg viewBox="0 0 120 120" width="96" height="96">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#333B4C" strokeWidth="9" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={priority ? '#B65C3F' : '#B4915B'}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9AA3B5" strokeWidth="1.5" />
    </svg>
  );
}
