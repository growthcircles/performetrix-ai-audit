// Hand-rolled SVG radar chart, same house style as Gauge.tsx (pure
// Math.cos/sin, no charting dependency). 4 axes (pillars) at 90 degrees
// apart, one polygon per present/qualifying rater group.
import type { PillarKey, RaterGroup } from '@/lib/three-sixty/types';

export const GROUP_COLORS: Record<RaterGroup, string> = {
  self: '#B4915B',
  manager: '#5B8AB4',
  peer: '#B65C3F',
  direct_report: '#8B7FD6',
  other_stakeholder: '#5CB6AA',
};

export const GROUP_LABELS: Record<RaterGroup, string> = {
  self: 'Self',
  manager: 'Manager',
  peer: 'Peers',
  direct_report: 'Direct reports',
  other_stakeholder: 'Other stakeholders',
};

type RadarSeries = { group: RaterGroup; values: Partial<Record<PillarKey, number>> };

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 95;
const LABEL_RADIUS = 112;

function pointFor(index: number, total: number, value: number) {
  const angle = -90 + (index * 360) / total;
  const rad = (angle * Math.PI) / 180;
  const r = (value / 100) * RADIUS;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

export default function RadarChart({
  pillars,
  series,
}: {
  pillars: { key: PillarKey; name: string }[];
  series: RadarSeries[];
}) {
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="radar-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height={SIZE} style={{ maxWidth: SIZE }}>
        {rings.map((r) => (
          <polygon
            key={r}
            points={pillars.map((_, i) => {
              const p = pointFor(i, pillars.length, r * 100);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#333B4C"
            strokeWidth="1"
          />
        ))}
        {pillars.map((_, i) => {
          const p = pointFor(i, pillars.length, 100);
          return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#333B4C" strokeWidth="1" />;
        })}
        {series.map(({ group, values }) => {
          const points = pillars
            .map((pillar, i) => {
              const v = values[pillar.key];
              if (v === undefined) return null;
              return pointFor(i, pillars.length, v);
            })
            .filter((p): p is { x: number; y: number } => !!p);
          if (points.length < 3) return null;
          return (
            <polygon
              key={group}
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill={GROUP_COLORS[group]}
              fillOpacity={0.08}
              stroke={GROUP_COLORS[group]}
              strokeWidth="2"
            />
          );
        })}
        {pillars.map((pillar, i) => {
          const p = pointFor(i, pillars.length, (LABEL_RADIUS / RADIUS) * 100);
          // Center-anchoring every label clips the left/right axes at the
          // SVG edge - anchor outward (away from center) instead, so labels
          // grow into the surrounding margin rather than off the viewBox.
          const anchor = p.x < CENTER - 4 ? 'end' : p.x > CENTER + 4 ? 'start' : 'middle';
          return (
            <text
              key={pillar.key}
              x={p.x}
              y={p.y}
              fill="var(--ink-text-dim, #9AA3B5)"
              fontSize="10.5"
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {pillar.name}
            </text>
          );
        })}
      </svg>
      <div className="radar-legend">
        {series.map(({ group }) => (
          <div className="radar-legend-item" key={group}>
            <span className="radar-legend-dot" style={{ background: GROUP_COLORS[group] }} />
            {GROUP_LABELS[group]}
          </div>
        ))}
      </div>
    </div>
  );
}
