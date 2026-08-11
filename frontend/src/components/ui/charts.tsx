/** Small inline visualizations: sparkline, donut, impact ring, confidence dots. */

import { CONFIDENCE_DEFS, IMPACT_EXPLAINER, impactBand } from "../../lib/definitions";
import { T, impactColor } from "../../lib/tokens";

export function Sparkline({ data, width = 64, height = 20, stroke, fill }: {
  data: number[]; width?: number; height?: number; stroke: string; fill?: string;
}) {
  const max = Math.max(1, ...data);
  const step = width / Math.max(1, data.length - 1);
  const pts = data.map((v, i) =>
    `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 6)).toFixed(1)}`);
  return (
    <svg width={width} height={height} aria-hidden style={{ display: "block" }}>
      {fill && <polygon points={`0,${height} ${pts.join(" ")} ${width},${height}`} fill={fill} />}
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

export function Donut({ segments, size = 34, stroke = 6, centerLabel }: {
  segments: { value: number; color: string }[];
  size?: number; stroke?: number; centerLabel?: string;
}) {
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} aria-hidden>
      {segments.filter((s) => s.value > 0).map((s, i) => {
        const len = (s.value / total) * circ;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${Math.max(0, len - 1.5)} ${circ - len + 1.5}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        );
        offset += len;
        return el;
      })}
      {centerLabel && (
        <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace" fontSize={size * 0.26}
          fontWeight={600} fill={T.txPrimary}>
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

export function ImpactRing({ score }: { score: number }) {
  const r = 11, circ = 2 * Math.PI * r;
  const col = impactColor(score);
  const band = impactBand(score);
  return (
    <svg width={28} height={28} role="img" aria-label={`Impact score ${score} of 100 — ${band.label}`}
      style={{ flexShrink: 0 }}>
      <title>{`${band.label} — ${score}/100. ${band.meaning}\n\n${IMPACT_EXPLAINER}`}</title>
      <circle cx={14} cy={14} r={r} fill="none" stroke={T.bgRaised} strokeWidth={2.5} />
      <circle cx={14} cy={14} r={r} fill="none" stroke={col} strokeWidth={2.5}
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 14 14)" />
      <text x={14} y={17} textAnchor="middle" fontFamily="'JetBrains Mono', monospace"
        fontSize={8.5} fill={T.txPrimary}>{score}</text>
    </svg>
  );
}

export function ConfDots({ level }: { level: string }) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span title={CONFIDENCE_DEFS[level] ?? `Confidence: ${level}`} aria-label={`Confidence ${level}`}
      style={{ display: "inline-flex", gap: 2.5, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4.5, height: 4.5, borderRadius: 3,
          background: i < n ? T.txSecondary : "transparent",
          border: `1px solid ${T.txMuted}`,
        }} />
      ))}
    </span>
  );
}
