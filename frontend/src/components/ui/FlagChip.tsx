/** Jurisdiction flag chip: real SVG flags, circular center-crop framing.
 * Countries: flag-icons CSS set. US states: us-state-flags React components.
 * Both bundle assets locally (no runtime fetches — local-first preserved).
 *
 * Centering: flag content is absolutely positioned at the frame's center rather
 * than laid out by the packages' own wrappers — us-state-flags renders a
 * flex/flex-start container narrower than its 3:2 SVG, and flag-icons sizes to
 * the border-box while flowing in the content-box. Both drift off-center
 * otherwise. State flags are scaled so their height covers the circle.
 */

import "flag-icons/css/flag-icons.min.css";
import USStateFlags from "us-state-flags/USStateFlags";
import { Globe } from "lucide-react";

const COUNTRY_CODES: Record<string, string> = {
  US: "us", GB: "gb", SG: "sg", JP: "jp", CN: "cn", KR: "kr", CA: "ca", AU: "au",
  IN: "in", AE: "ae", BR: "br", FR: "fr", DE: "de", IT: "it", ES: "es", NL: "nl",
  IE: "ie", EU: "eu", "INTL-UN": "un",
};

/** Natural pixel size of the us-state-flags "sm" render (3:2). */
const STATE_FLAG_W = 36;
const STATE_FLAG_H = 24;

const frame = (size: number): React.CSSProperties => ({
  position: "relative",
  boxSizing: "border-box",
  width: size,
  height: size,
  minWidth: size,
  borderRadius: "50%",
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,.22)",
  boxShadow: "0 1px 4px rgba(0,0,0,.4)",
  overflow: "hidden",
  display: "inline-block",
  verticalAlign: "middle",
  lineHeight: 0,
  background: "#252E3C",
});

const centered: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
};

export function FlagChip({ code, size = 22, title }: { code: string; size?: number; title?: string }) {
  if (code.startsWith("US-")) {
    const abbr = code === "US-NYC" ? "NY" : code.slice(3);
    // Scale the 36x24 flag so its height covers the circle (small margin for
    // states whose artwork letterboxes inside the forced 3:2 box).
    const scale = (size / STATE_FLAG_H) * 1.08;
    return (
      <span title={title ?? code} style={frame(size)}>
        <USStateFlags
          state={abbr}
          showFlag
          flagSize="sm"
          flagAlt={`${abbr} state flag`}
          style={{
            ...centered,
            width: STATE_FLAG_W,
            height: STATE_FLAG_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            pointerEvents: "none",
          }}
        />
      </span>
    );
  }

  const cc = COUNTRY_CODES[code];
  if (cc) {
    return (
      <span title={title ?? code} style={frame(size)}>
        <span
          className={`fi fi-${cc}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            // Explicit dimensions: flag-icons' `.fi` sets `width: 1.333em`, which
            // would otherwise win over inset-based sizing and skew the flag.
            width: "100%",
            height: "100%",
            display: "block",
            // `.fi:before` injects a non-breaking space; zero it out so the
            // background box is the only thing that occupies the chip.
            fontSize: 0,
            lineHeight: 0,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </span>
    );
  }

  return (
    <span title={title ?? code} style={frame(size)}>
      <Globe
        aria-hidden
        size={size * 0.6}
        color="#8FA0B5"
        strokeWidth={1.6}
        style={{ ...centered, transform: "translate(-50%, -50%)" }}
      />
    </span>
  );
}
