/** Brand mark: blue radar structure, green sweep beam + contact blips.
 * Animation keyframes live in styles/index.css (reduced-motion safe). */

import { T } from "../../lib/tokens";

export function RadarLogo({ size = 34 }: { size?: number }) {
  const accent = T.accent;
  const sweep = T.positive;
  return (
    <span
      aria-hidden
      style={{ position: "relative", width: size, height: size, display: "inline-block", flexShrink: 0 }}
    >
      <span
        className="radar-sweep"
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, ${sweep}77 0deg, ${sweep}26 40deg, transparent 80deg, transparent 360deg)`,
          animation: "radar-spin 5s linear infinite",
        }}
      />
      <svg width={size} height={size} viewBox="0 0 34 34" style={{ position: "relative" }}>
        <circle cx="17" cy="17" r="15" fill="none" stroke={accent} strokeWidth="1.4" opacity=".85" />
        <circle cx="17" cy="17" r="10" fill="none" stroke={accent} strokeWidth="0.8" opacity=".4" />
        <circle cx="17" cy="17" r="5" fill="none" stroke={accent} strokeWidth="0.8" opacity=".3" />
        <line x1="2" y1="17" x2="32" y2="17" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <line x1="17" y1="2" x2="17" y2="32" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <circle cx="17" cy="17" r="1.6" fill={accent} />
        <circle className="radar-blip" cx="24" cy="10" r="1.7" fill={sweep}
          style={{ animation: "radar-blip 5s linear infinite" }} />
        <circle className="radar-blip" cx="10" cy="22" r="1.4" fill={sweep}
          style={{ animation: "radar-blip 5s linear infinite", animationDelay: "2.4s" }} />
      </svg>
    </span>
  );
}
