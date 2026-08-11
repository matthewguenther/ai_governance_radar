/**
 * Prototype iconography (TEMPORARY): animated radar logo, jurisdiction flag chips
 * (pure CSS gradients — zero image assets), organization monogram avatars, incident
 * category icons, and a small donut chart. Direction A "aliveness" layer.
 */

import "flag-icons/css/flag-icons.min.css";
import USStateFlags from "us-state-flags/USStateFlags";
import {
  AlertTriangle, Bot, Database, EyeOff, FlaskConical, Globe, KeyRound,
  MessageSquareX, Scale, ScanFace, ShieldAlert, TerminalSquare,
} from "lucide-react";

/* ---------------- animated radar logo ---------------- */

export function RadarLogo({ size = 34, accent = "#628BFF", sweep = "#3FBF77" }: {
  size?: number;
  /** rings / crosshairs / center — the radar hardware (blue) */
  accent?: string;
  /** beam + contact blips — the live signal (green, per owner feedback) */
  sweep?: string;
}) {
  return (
    <span style={{ position: "relative", width: size, height: size, display: "inline-block", flexShrink: 0 }} aria-hidden>
      <style>{`
        @keyframes protoRadarSpin { to { transform: rotate(360deg); } }
        @keyframes protoRadarBlip { 0%, 12% { opacity: .95; } 45%, 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .proto-radar-sweep { animation: none !important; opacity: .35; }
          .proto-radar-blip { animation: none !important; opacity: .7; }
        }
      `}</style>
      {/* sweep beam (green) */}
      <span className="proto-radar-sweep" style={{
        position: "absolute", inset: 2, borderRadius: "50%",
        background: `conic-gradient(from 0deg, ${sweep}77 0deg, ${sweep}26 40deg, transparent 80deg, transparent 360deg)`,
        animation: "protoRadarSpin 5s linear infinite",
      }} />
      {/* radar structure (blue) + contact blips (green) */}
      <svg width={size} height={size} viewBox="0 0 34 34" style={{ position: "relative" }}>
        <circle cx="17" cy="17" r="15" fill="none" stroke={accent} strokeWidth="1.4" opacity=".85" />
        <circle cx="17" cy="17" r="10" fill="none" stroke={accent} strokeWidth="0.8" opacity=".4" />
        <circle cx="17" cy="17" r="5" fill="none" stroke={accent} strokeWidth="0.8" opacity=".3" />
        <line x1="2" y1="17" x2="32" y2="17" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <line x1="17" y1="2" x2="17" y2="32" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <circle cx="17" cy="17" r="1.6" fill={accent} />
        <circle className="proto-radar-blip" cx="24" cy="10" r="1.7" fill={sweep}
          style={{ animation: "protoRadarBlip 5s linear infinite" }} />
        <circle className="proto-radar-blip" cx="10" cy="22" r="1.4" fill={sweep}
          style={{ animation: "protoRadarBlip 5s linear infinite", animationDelay: "2.4s" }} />
      </svg>
    </span>
  );
}

/* ---------------- jurisdiction flag chips (real flag assets) ----------------
 * Countries: `flag-icons` SVG set (CSS classes, bundled locally by Vite).
 * US states: `us-state-flags` React SVG components (offline, no fetches).
 * Fallback (intergov bodies without flags in the sets): neutral globe chip.
 */

const COUNTRY_CODES: Record<string, string> = {
  US: "us", GB: "gb", SG: "sg", JP: "jp", CN: "cn", KR: "kr", CA: "ca", AU: "au",
  IN: "in", AE: "ae", BR: "br", FR: "fr", DE: "de", IT: "it", ES: "es", NL: "nl",
  IE: "ie", EU: "eu", "INTL-UN": "un",
};

const chipFrame = (size: number): React.CSSProperties => ({
  width: size, height: size, borderRadius: "50%", flexShrink: 0,
  border: "1px solid rgba(255,255,255,.22)", boxShadow: "0 1px 4px rgba(0,0,0,.4)",
  overflow: "hidden", display: "inline-grid", placeItems: "center",
  background: "#252E3C",
});

export function FlagChip({ code, size = 20, title }: { code: string; size?: number; title?: string }) {
  // US states/cities: US-CO → CO (NYC uses New York's flag)
  if (code.startsWith("US-")) {
    const abbr = code === "US-NYC" ? "NY" : code.slice(3);
    return (
      <span title={title ?? code} style={chipFrame(size)}>
        {/* flag is 3:2; render taller than the circle so it center-crops to fill */}
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
      <span title={title ?? code} style={chipFrame(size)}>
        <span
          className={`fi fi-${cc} fis`}
          style={{ width: size, height: size, backgroundSize: "cover", display: "block" }}
        />
      </span>
    );
  }

  // Intergovernmental bodies (OECD, UNESCO, G7, GLOBAL, …): neutral globe
  return (
    <span title={title ?? code} style={chipFrame(size)}>
      <Globe size={size * 0.6} color="#8FA0B5" strokeWidth={1.6} />
    </span>
  );
}

/* ---------------- organization monogram avatars ---------------- */

const ORGS: [RegExp, string, string][] = [
  [/nist/i, "NIST", "#2D6FBF"],
  [/\biso\b|iso\/iec/i, "ISO", "#C0392B"],
  [/owasp/i, "OWSP", "#37517E"],
  [/mitre|atlas/i, "MITRE", "#7C4DCC"],
  [/imda|aiverify|singapore/i, "IMDA", "#0FA3A3"],
  [/ieee/i, "IEEE", "#00629B"],
  [/cisa/i, "CISA", "#B33A3A"],
  [/gov\.uk/i, "GOV", "#1D70B8"],
  [/federal register/i, "FR", "#2C6E49"],
  [/arxiv/i, "arXiv", "#B31B1B"],
  [/stanford|hai/i, "HAI", "#8C1515"],
  [/eur-lex|eu ai act/i, "EU", "#003399"],
  [/oecd/i, "OECD", "#0F6CBD"],
  [/demo/i, "DEMO", "#4A5568"],
];

export function orgFor(name: string): { code: string; color: string } | null {
  for (const [re, code, color] of ORGS) if (re.test(name)) return { code, color };
  return null;
}

export function OrgAvatar({ name, size = 26 }: { name: string; size?: number }) {
  const org = orgFor(name);
  const code = org?.code ?? name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  const base = org?.color ?? "#3A4656";
  return (
    <span title={name} style={{
      width: size, height: size, borderRadius: 7, flexShrink: 0,
      background: `linear-gradient(135deg, ${base}, ${base}CC)`,
      border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 2px 6px rgba(0,0,0,.35)",
      display: "inline-grid", placeItems: "center",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: code.length > 3 ? size * 0.26 : size * 0.34,
      fontWeight: 600, color: "#FFFFFF", letterSpacing: "-.02em",
    }}>
      {code}
    </span>
  );
}

/* ---------------- incident category icons ---------------- */

const INCIDENT_ICONS: Record<string, typeof AlertTriangle> = {
  prompt_injection: TerminalSquare,
  data_leakage: Database,
  bias_discrimination: Scale,
  deepfake_abuse: ScanFace,
  hallucination_harm: MessageSquareX,
  excessive_agency: Bot,
  agent_failure: Bot,
  sandbox_escape: ShieldAlert,
  model_theft: KeyRound,
  data_poisoning: FlaskConical,
  ai_cyberattack: ShieldAlert,
  system_compromise: ShieldAlert,
  privacy: EyeOff,
};

export function IncidentIcon({ category, tone, size = 28 }: { category: string; tone: string; size?: number }) {
  const Icon = INCIDENT_ICONS[category] ?? AlertTriangle;
  return (
    <span style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: `${tone}1E`, border: `1px solid ${tone}55`,
      display: "inline-grid", placeItems: "center",
    }}>
      <Icon size={size * 0.55} color={tone} strokeWidth={1.8} />
    </span>
  );
}

/* ---------------- donut ---------------- */

export function Donut({ segments, size = 44, stroke = 7, centerLabel, textColor = "#E8EDF5" }: {
  segments: { value: number; color: string }[];
  size?: number; stroke?: number; centerLabel?: string; textColor?: string;
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
            strokeDasharray={`${len - 1.5} ${circ - len + 1.5}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        );
        offset += len;
        return el;
      })}
      {centerLabel && (
        <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'JetBrains Mono', monospace" fontSize={size * 0.26} fontWeight={600} fill={textColor}>
          {centerLabel}
        </text>
      )}
    </svg>
  );
}
