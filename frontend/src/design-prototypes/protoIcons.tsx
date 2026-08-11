/**
 * Prototype iconography (TEMPORARY): animated radar logo, jurisdiction flag chips
 * (pure CSS gradients — zero image assets), organization monogram avatars, incident
 * category icons, and a small donut chart. Direction A "aliveness" layer.
 */

import {
  AlertTriangle, Bot, Database, EyeOff, FlaskConical, Globe, KeyRound,
  MessageSquareX, Scale, ScanFace, ShieldAlert, TerminalSquare,
} from "lucide-react";

/* ---------------- animated radar logo ---------------- */

export function RadarLogo({ size = 34, accent = "#628BFF" }: { size?: number; accent?: string }) {
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
      {/* sweep */}
      <span className="proto-radar-sweep" style={{
        position: "absolute", inset: 2, borderRadius: "50%",
        background: `conic-gradient(from 0deg, ${accent}66 0deg, ${accent}22 40deg, transparent 80deg, transparent 360deg)`,
        animation: "protoRadarSpin 5s linear infinite",
      }} />
      {/* rings + blips */}
      <svg width={size} height={size} viewBox="0 0 34 34" style={{ position: "relative" }}>
        <circle cx="17" cy="17" r="15" fill="none" stroke={accent} strokeWidth="1.4" opacity=".85" />
        <circle cx="17" cy="17" r="10" fill="none" stroke={accent} strokeWidth="0.8" opacity=".4" />
        <circle cx="17" cy="17" r="5" fill="none" stroke={accent} strokeWidth="0.8" opacity=".3" />
        <line x1="2" y1="17" x2="32" y2="17" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <line x1="17" y1="2" x2="17" y2="32" stroke={accent} strokeWidth="0.5" opacity=".2" />
        <circle cx="17" cy="17" r="1.6" fill={accent} />
        <circle className="proto-radar-blip" cx="24" cy="10" r="1.7" fill={accent}
          style={{ animation: "protoRadarBlip 5s linear infinite" }} />
        <circle className="proto-radar-blip" cx="10" cy="22" r="1.4" fill={accent}
          style={{ animation: "protoRadarBlip 5s linear infinite", animationDelay: "2.4s" }} />
      </svg>
    </span>
  );
}

/* ---------------- jurisdiction flag chips (CSS gradients) ---------------- */

const FLAG_CSS: Record<string, React.CSSProperties> = {
  US: {
    backgroundImage:
      "linear-gradient(#3C3B6E, #3C3B6E), repeating-linear-gradient(180deg, #B22234 0 2.5px, #FFFFFF 2.5px 5px)",
    backgroundSize: "55% 45%, 100% 100%", backgroundRepeat: "no-repeat", backgroundPosition: "left top",
  },
  "US-CO": {
    backgroundImage:
      "radial-gradient(circle at 48% 50%, #C8102E 0 26%, transparent 27%), linear-gradient(180deg, #1E4C9A 0 32%, #FFFFFF 32% 68%, #1E4C9A 68%)",
  },
  "US-CA": {
    backgroundImage:
      "radial-gradient(circle at 30% 32%, #B71234 0 16%, transparent 17%), linear-gradient(180deg, #FFFFFF 0 78%, #B71234 78%)",
  },
  "US-NY": { backgroundImage: "linear-gradient(90deg, #0057B8 0 34%, #FFFFFF 34% 66%, #FF7F00 66%)" },
  "US-NYC": { backgroundImage: "linear-gradient(90deg, #0057B8 0 34%, #FFFFFF 34% 66%, #FF7F00 66%)" },
  "US-TX": {
    backgroundImage:
      "linear-gradient(90deg, #002868 0 36%, transparent 36%), linear-gradient(180deg, #FFFFFF 0 50%, #BF0A30 50%)",
  },
  "US-UT": { backgroundImage: "radial-gradient(circle at 50% 50%, #F4B41A 0 24%, transparent 25%), linear-gradient(#0A2E6B, #0A2E6B)" },
  "US-CT": { backgroundImage: "radial-gradient(circle at 50% 52%, #FFFFFF 0 22%, transparent 23%), linear-gradient(#0B2F6B, #0B2F6B)" },
  "US-IL": { backgroundImage: "radial-gradient(circle at 50% 50%, #E68A2E 0 24%, transparent 25%), linear-gradient(#F4F1E9, #F4F1E9)" },
  "US-WA": { backgroundImage: "radial-gradient(circle at 50% 50%, #E8D26F 0 24%, transparent 25%), linear-gradient(#1D6B3C, #1D6B3C)" },
  EU: { backgroundImage: "radial-gradient(circle at 50% 50%, #FFCC00 0 20%, transparent 21%), linear-gradient(#003399, #003399)" },
  GB: {
    backgroundImage:
      "linear-gradient(0deg, transparent 41%, #C8102E 41% 59%, transparent 59%), linear-gradient(90deg, transparent 41%, #C8102E 41% 59%, transparent 59%), linear-gradient(0deg, transparent 33%, #FFFFFF 33% 67%, transparent 67%), linear-gradient(90deg, transparent 33%, #FFFFFF 33% 67%, transparent 67%), linear-gradient(#012169, #012169)",
  },
  SG: { backgroundImage: "linear-gradient(180deg, #EF3340 0 50%, #FFFFFF 50%)" },
  JP: { backgroundImage: "radial-gradient(circle at 50% 50%, #BC002D 0 26%, transparent 27%), linear-gradient(#FFFFFF, #FFFFFF)" },
  CN: { backgroundImage: "radial-gradient(circle at 30% 30%, #FFDE00 0 15%, transparent 16%), linear-gradient(#DE2910, #DE2910)" },
  KR: { backgroundImage: "radial-gradient(circle at 50% 42%, #CD2E3A 0 20%, transparent 21%), radial-gradient(circle at 50% 58%, #0047A0 0 20%, transparent 21%), linear-gradient(#FFFFFF, #FFFFFF)" },
  CA: { backgroundImage: "linear-gradient(90deg, #D80621 0 30%, #FFFFFF 30% 70%, #D80621 70%)" },
  AU: { backgroundImage: "radial-gradient(circle at 65% 60%, #FFFFFF 0 12%, transparent 13%), radial-gradient(circle at 30% 30%, #FFFFFF 0 14%, transparent 15%), linear-gradient(#00247D, #00247D)" },
  IN: { backgroundImage: "linear-gradient(180deg, #FF9933 0 34%, #FFFFFF 34% 66%, #138808 66%)" },
  AE: { backgroundImage: "linear-gradient(90deg, #EF3340 0 28%, transparent 28%), linear-gradient(180deg, #009639 0 34%, #FFFFFF 34% 66%, #141414 66%)" },
  BR: { backgroundImage: "radial-gradient(circle at 50% 50%, #FFDF00 0 26%, transparent 27%), linear-gradient(#009B3A, #009B3A)" },
  FR: { backgroundImage: "linear-gradient(90deg, #002395 0 34%, #FFFFFF 34% 66%, #ED2939 66%)" },
  DE: { backgroundImage: "linear-gradient(180deg, #141414 0 34%, #DD0000 34% 66%, #FFCE00 66%)" },
  IT: { backgroundImage: "linear-gradient(90deg, #009246 0 34%, #FFFFFF 34% 66%, #CE2B37 66%)" },
  ES: { backgroundImage: "linear-gradient(180deg, #AA151B 0 28%, #F1BF00 28% 72%, #AA151B 72%)" },
  NL: { backgroundImage: "linear-gradient(180deg, #AE1C28 0 34%, #FFFFFF 34% 66%, #21468B 66%)" },
  IE: { backgroundImage: "linear-gradient(90deg, #169B62 0 34%, #FFFFFF 34% 66%, #FF883E 66%)" },
};

export function FlagChip({ code, size = 20, title }: { code: string; size?: number; title?: string }) {
  const css = FLAG_CSS[code];
  if (!css) {
    return (
      <span title={title ?? code} style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "#252E3C", border: "1px solid #3A4656",
        display: "inline-grid", placeItems: "center",
      }}>
        <Globe size={size * 0.6} color="#8FA0B5" strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <span title={title ?? code} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: "1px solid rgba(255,255,255,.22)", boxShadow: "0 1px 4px rgba(0,0,0,.4)",
      display: "inline-block", ...css,
    }} />
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
