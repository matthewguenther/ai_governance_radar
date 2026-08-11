/** DESIGN PROTOTYPES index (TEMPORARY) — compare three visual directions. */

import { Link } from "react-router-dom";

const wrap: React.CSSProperties = {
  minHeight: "100vh", background: "#101113", color: "#E8EAED",
  fontFamily: "'Inter', system-ui, sans-serif", display: "grid", placeItems: "center",
};

const DIRECTIONS = [
  {
    to: "/design/a", code: "A", name: "Refined Intelligence Dashboard — REV 2 ★ owner-preferred",
    tone: "#628BFF",
    blurb: "Premium polish of the current concept, now with the 'alive' layer: animated radar mark, jurisdiction flag chips, org avatars (NIST/ISO/OWASP/MITRE), tinted KPI cards, glowing map markers, filled status pills.",
  },
  {
    to: "/design/b", code: "B", name: "Modern Intelligence Terminal",
    tone: "#3BC9B4",
    blurb: "Analyst workstation: carbon surfaces, flush tiled modules with domain rules, mono data voice, HH:MM wire rows, UTC status strip, impact meters.",
  },
  {
    to: "/design/c", code: "C", name: "Editorial Intelligence",
    tone: "#A63D2F",
    blurb: "Data-journalism register on warm paper: serif headlines, kicker labels, hairline rules instead of cards, terracotta map, statuses as typography.",
  },
];

export default function DesignIndex() {
  return (
    <div style={wrap}>
      <div style={{ maxWidth: 720, padding: 32 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".18em", color: "#8A8F98", margin: 0 }}>
          TEMPORARY DESIGN PLAYGROUND — NOT PRODUCTION UI
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 650, margin: "8px 0 4px" }}>AI Governance Radar — V2 visual directions</h1>
        <p style={{ fontSize: 13.5, color: "#A5ABB5", lineHeight: 1.55, margin: "0 0 24px" }}>
          Three treatments of the same dashboard: identical modules, identical live data from
          your database, three different products. Judge: which one do you want to open every
          morning? The production UI at <Link to="/" style={{ color: "#8AB4FF" }}>/</Link> is untouched.
        </p>
        {DIRECTIONS.map((d) => (
          <Link key={d.code} to={d.to} style={{
            display: "flex", gap: 18, alignItems: "center", textDecoration: "none",
            border: "1px solid #26282D", borderLeft: `3px solid ${d.tone}`,
            background: "#16181B", padding: "16px 20px", marginBottom: 10, color: "inherit",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: d.tone, width: 30 }}>{d.code}</span>
            <span>
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{d.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#A5ABB5", marginTop: 3, lineHeight: 1.5 }}>{d.blurb}</span>
            </span>
            <span style={{ marginLeft: "auto", color: d.tone, fontSize: 18 }}>→</span>
          </Link>
        ))}
        <p style={{ fontSize: 11.5, color: "#6B7078", marginTop: 18 }}>
          Prototypes are desktop-first mockups of the dashboard route; they read live data but
          navigation within them is non-functional by design. Delete
          <code style={{ color: "#A5ABB5" }}> frontend/src/design-prototypes/ </code>
          after a direction is chosen.
        </p>
      </div>
    </div>
  );
}
