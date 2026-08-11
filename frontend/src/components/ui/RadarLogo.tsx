/** Brand mark: blue radar structure, bright green sweep beam + contact blips.
 * Animation keyframes live in styles/index.css (reduced-motion safe). */

import { T } from "../../lib/tokens";

/** Brighter than the semantic positive green so the sweep reads clearly at small
 * sizes without becoming distracting. */
const SWEEP = "#4FE58F";

export function RadarLogo({ size = 48 }: { size?: number }) {
  const accent = T.accent;
  return (
    <span
      aria-hidden
      style={{ position: "relative", width: size, height: size, display: "block", flexShrink: 0 }}
    >
      <span
        className="radar-sweep"
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, ${SWEEP}E6 0deg, ${SWEEP}66 42deg, ${SWEEP}1A 72deg, transparent 96deg, transparent 360deg)`,
          animation: "radar-spin 5s linear infinite",
        }}
      />
      <svg width={size} height={size} viewBox="0 0 34 34" style={{ position: "relative", display: "block" }}>
        <circle cx="17" cy="17" r="15" fill="none" stroke={accent} strokeWidth="1.4" opacity=".85" />
        <circle cx="17" cy="17" r="10" fill="none" stroke={accent} strokeWidth="0.8" opacity=".4" />
        <circle cx="17" cy="17" r="5" fill="none" stroke={accent} strokeWidth="0.8" opacity=".3" />
        <line x1="2" y1="17" x2="32" y2="17" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <line x1="17" y1="2" x2="17" y2="32" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <circle cx="17" cy="17" r="1.6" fill={accent} />
        <circle
          className="radar-blip"
          cx="24"
          cy="10"
          r="1.9"
          fill={SWEEP}
          style={{ animation: "radar-blip 5s linear infinite", filter: `drop-shadow(0 0 3px ${SWEEP})` }}
        />
        <circle
          className="radar-blip"
          cx="10"
          cy="22"
          r="1.5"
          fill={SWEEP}
          style={{
            animation: "radar-blip 5s linear infinite",
            animationDelay: "2.4s",
            filter: `drop-shadow(0 0 3px ${SWEEP})`,
          }}
        />
      </svg>
    </span>
  );
}
