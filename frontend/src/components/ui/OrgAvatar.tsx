/** Organization monogram avatar with recognizable brand-adjacent colors. */

const ORGS: [RegExp, string, string][] = [
  [/nist/i, "NIST", "#2D6FBF"],
  [/\biso\b|iso\/iec/i, "ISO", "#C0392B"],
  [/owasp/i, "OWSP", "#37517E"],
  [/mitre|atlas/i, "MITRE", "#7C4DCC"],
  [/imda|aiverify|singapore model/i, "IMDA", "#0FA3A3"],
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
    <span
      title={name}
      style={{
        width: size, height: size, borderRadius: 7, flexShrink: 0,
        background: `linear-gradient(135deg, ${base}, ${base}CC)`,
        border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 2px 6px rgba(0,0,0,.35)",
        display: "inline-grid", placeItems: "center",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: code.length > 3 ? size * 0.26 : size * 0.34,
        fontWeight: 600, color: "#FFFFFF", letterSpacing: "-.02em",
      }}
    >
      {code}
    </span>
  );
}
