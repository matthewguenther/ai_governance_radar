/** Jurisdiction flag chip: real SVG flags, circular center-crop framing.
 * Countries: flag-icons CSS set. US states: us-state-flags React components.
 * Both bundle assets locally (no runtime fetches — local-first preserved). */

import "flag-icons/css/flag-icons.min.css";
import USStateFlags from "us-state-flags/USStateFlags";
import { Globe } from "lucide-react";

const COUNTRY_CODES: Record<string, string> = {
  US: "us", GB: "gb", SG: "sg", JP: "jp", CN: "cn", KR: "kr", CA: "ca", AU: "au",
  IN: "in", AE: "ae", BR: "br", FR: "fr", DE: "de", IT: "it", ES: "es", NL: "nl",
  IE: "ie", EU: "eu", "INTL-UN": "un",
};

const frame = (size: number): React.CSSProperties => ({
  width: size, height: size, borderRadius: "50%", flexShrink: 0,
  border: "1px solid rgba(255,255,255,.22)", boxShadow: "0 1px 4px rgba(0,0,0,.4)",
  overflow: "hidden", display: "inline-grid", placeItems: "center",
  background: "#252E3C",
});

export function FlagChip({ code, size = 22, title }: { code: string; size?: number; title?: string }) {
  if (code.startsWith("US-")) {
    const abbr = code === "US-NYC" ? "NY" : code.slice(3);
    return (
      <span title={title ?? code} style={frame(size)}>
        <USStateFlags
          state={abbr} showFlag flagSize="sm" flagAlt={`${abbr} state flag`}
          style={{ width: size * 1.6, height: size * 1.1, pointerEvents: "none" }}
        />
      </span>
    );
  }
  const cc = COUNTRY_CODES[code];
  if (cc) {
    return (
      <span title={title ?? code} style={frame(size)}>
        <span
          className={`fi fi-${cc} fis`}
          style={{ width: size, height: size, backgroundSize: "cover", display: "block" }}
        />
      </span>
    );
  }
  return (
    <span title={title ?? code} style={frame(size)}>
      <Globe size={size * 0.6} color="#8FA0B5" strokeWidth={1.6} aria-hidden />
    </span>
  );
}
