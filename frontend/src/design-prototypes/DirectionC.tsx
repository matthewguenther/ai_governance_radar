/**
 * DIRECTION C — "Editorial Intelligence" (TEMPORARY PROTOTYPE)
 * Data-journalism register: warm paper surfaces, serif display headlines, kicker
 * labels, hairline rules instead of card chrome, oxblood accent, terracotta map.
 * Still a modular monitoring dashboard — sections are widgets divided by rules.
 * Self-contained; inline styles only.
 */

import "@fontsource/source-serif-4/500.css";
import "@fontsource/source-serif-4/600.css";
import { Link } from "react-router-dom";

import { ProtoMap, Sparkline, fmtDate, rel, sparkSeries, useProtoData } from "./shared";
import type { ItemOut } from "../lib/types";

/* ---------- tokens ---------- */
const C = {
  paper: "#F7F3EA",
  panel: "#FDFBF6",
  rule: "#D9D2C2",
  ruleStrong: "#0F0D0A",
  ink: "#1C1915",
  sub: "#5C554A",
  mute: "#8D8574",
  accent: "#A63D2F",           // oxblood
  accentSoft: "#F0E4DE",
  critical: "#A63D2F",
  high: "#C07A2B",
  watchC: "#9C8A2E",
  positive: "#4A7C59",
  info: "#3D6B8F",
  emerging: "#6E5A9E",
};
const serif = "'Source Serif 4', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const kicker: React.CSSProperties = {
  fontFamily: mono, fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase",
  color: C.accent, fontWeight: 500,
};

function Kicker({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ borderTop: `2px solid ${C.ruleStrong}`, paddingTop: 7, marginBottom: 10, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
      <span style={kicker}>{children}</span>
      {right && <span style={{ fontFamily: sans, fontSize: 11, color: C.mute }}>{right}</span>}
    </div>
  );
}

function statusWord(s: string | undefined | null, color: string) {
  return (
    <span style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color, borderBottom: `2px solid ${color}55`, paddingBottom: 1 }}>
      {(s ?? "").replace(/_/g, " ")}
    </span>
  );
}

function impactWord(score: number) {
  const [word, col] =
    score >= 70 ? ["High impact", C.critical] : score >= 50 ? ["Elevated", C.high]
    : score >= 30 ? ["Watch", C.watchC] : ["Routine", C.mute];
  return (
    <span style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 600, color: col, textTransform: "uppercase", letterSpacing: ".06em" }}>
      {word} <span style={{ fontFamily: mono, fontWeight: 400 }}>{score}</span>
    </span>
  );
}

function Story({ item, lede = false }: { item: ItemOut; lede?: boolean }) {
  return (
    <article style={{ padding: lede ? "0 0 14px" : "10px 0", borderBottom: `1px solid ${C.rule}`, cursor: "pointer" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
        {impactWord(item.impact_score)}
        <span style={{ fontFamily: sans, fontSize: 10.5, color: C.mute }}>
          {item.source_name} · {rel(item.published_at ?? item.first_seen_at)} ago
          {item.is_demo && " · demonstration data"}
        </span>
      </div>
      <h3 style={{ fontFamily: serif, fontSize: lede ? 21 : 15.5, fontWeight: 600, lineHeight: 1.25, margin: 0, color: C.ink, letterSpacing: "-.005em" }}>
        {item.title.replace(/^DEMO: /, "")}
      </h3>
      {lede && item.excerpt && (
        <p style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.55, color: C.sub, margin: "6px 0 0", maxWidth: "58ch" }}>
          {item.excerpt.replace(/^Demonstration item\.\s*/, "")}
        </p>
      )}
      <div style={{ marginTop: 5, display: "flex", gap: 12 }}>
        {item.jurisdiction_code && <span style={{ fontFamily: mono, fontSize: 10, color: C.sub, letterSpacing: ".08em" }}>{item.jurisdiction_code}</span>}
        <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, letterSpacing: ".08em", textTransform: "uppercase" }}>
          {item.categories.slice(0, 2).join(" / ")} · confidence {item.confidence}
        </span>
      </div>
    </article>
  );
}

const NAV = ["Overview", "The Brief", "Regulation", "Standards", "Incidents", "The Wire", "Watchlist"];

export default function DirectionC() {
  const d = useProtoData();
  const spark = sparkSeries(d.feed, 14);
  const [lede, ...rest] = d.top;

  const numbers = [
    { n: d.summary?.high_impact ?? 0, label: "high-impact developments", tone: C.critical },
    { n: d.summary?.total_changes ?? 0, label: "tracked changes this week", tone: C.ink },
    { n: d.summary?.new_incidents ?? 0, label: "new incident records", tone: C.high },
    { n: d.summary?.new_opportunities ?? 0, label: "professional opportunities", tone: C.positive },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: sans }}>
      <div style={{ background: C.accentSoft, borderBottom: `1px solid ${C.rule}`, padding: "6px 16px", fontFamily: mono, fontSize: 11, color: C.accent, display: "flex", justifyContent: "space-between" }}>
        <span>PROTOTYPE — DIRECTION C · EDITORIAL INTELLIGENCE</span>
        <Link to="/design" style={{ color: C.accent }}>← All directions</Link>
      </div>

      {/* Masthead */}
      <header style={{ maxWidth: 1240, margin: "0 auto", padding: "18px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: `3px double ${C.ruleStrong}`, paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, letterSpacing: "-.01em" }}>
              AI Governance Radar
            </span>
            <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: ".2em", color: C.mute, textTransform: "uppercase" }}>
              Intelligence · Monitoring · Analysis
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <span style={{ fontFamily: sans, fontSize: 11.5, color: C.sub }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span style={{ fontFamily: mono, fontSize: 10, color: C.positive }}>● 9/11 sources reporting</span>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.accent, borderBottom: `1px solid ${C.accent}`, cursor: "pointer" }}>Search</span>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 26, padding: "9px 0", borderBottom: `1px solid ${C.rule}` }}>
          {NAV.map((n, i) => (
            <span key={n} style={{
              fontFamily: sans, fontSize: 12.5, fontWeight: i === 0 ? 650 : 450,
              color: i === 0 ? C.ink : C.sub, cursor: "pointer",
              borderBottom: i === 0 ? `2px solid ${C.accent}` : "2px solid transparent", paddingBottom: 7, marginBottom: -10,
            }}>{n}</span>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.mute, alignSelf: "center" }}>7-DAY WINDOW</span>
        </nav>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 28px 60px" }}>
        {/* Numbers band */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28, marginBottom: 26 }}>
          {numbers.map((k) => (
            <div key={k.label} style={{ borderTop: `1px solid ${C.ruleStrong}`, paddingTop: 8, display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 600, lineHeight: 1, color: k.n > 0 ? k.tone : C.mute, fontVariantNumeric: "tabular-nums" }}>{k.n}</div>
                <div style={{ fontFamily: sans, fontSize: 11.5, color: C.sub, marginTop: 4, lineHeight: 1.3 }}>{k.label}</div>
              </div>
              <div style={{ marginTop: 6 }}><Sparkline data={spark} width={64} height={22} stroke={C.mute} /></div>
            </div>
          ))}
        </div>

        {/* Lead grid: developments | map */}
        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 34 }}>
          <section>
            <Kicker right="ranked by impact score, explained per item">Top Developments</Kicker>
            {lede && <Story item={lede} lede />}
            <div style={{ columnGap: 26 }}>
              {rest.slice(0, 4).map((i) => <Story key={i.id} item={i} />)}
            </div>
          </section>

          <div>
            <section>
              <Kicker right="tracked AI regulations">The Regulatory Map</Kicker>
              <div style={{ background: C.panel, border: `1px solid ${C.rule}` }}>
                <ProtoMap rows={d.map} height={252} style={{
                  ocean: C.panel,
                  land: "#EAE3D3",
                  landBorder: "#FDFBF6",
                  ramp: ["#E3C9AC", "#D3A177", "#BC6F4A", "#A63D2F"],
                }} />
              </div>
              <p style={{ fontFamily: sans, fontSize: 10.5, color: C.mute, margin: "6px 0 0", lineHeight: 1.5 }}>
                Shading indicates the number of tracked AI regulations; EU-level activity is
                applied to member states. Source: curated registry · verified Jan 2026.
              </p>
            </section>

            <section style={{ marginTop: 24 }}>
              <Kicker right={`${d.incidents.length} on record`}>Incident Ledger</Kicker>
              {d.incidents.slice(0, 3).map((inc) => (
                <div key={inc.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.rule}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    {statusWord(inc.severity, inc.severity === "critical" ? C.critical : inc.severity === "high" ? C.high : C.watchC)}
                    <span style={{ fontFamily: sans, fontSize: 10.5, color: C.mute }}>{inc.fact_status.replace(/_/g, " ")} · {fmtDate(inc.reported_at)}</span>
                  </div>
                  <p style={{ fontFamily: serif, fontSize: 14.5, fontWeight: 600, margin: "3px 0 0", lineHeight: 1.3 }}>{inc.title}</p>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Bottom band: regulation table | standards | wire */}
        <div style={{ display: "grid", gridTemplateColumns: "5fr 3fr 4fr", gap: 34, marginTop: 34 }}>
          <section>
            <Kicker right="curated · evidence-linked">Regulation Status</Kicker>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Jurisdiction", "Instrument", "Status", "Effective"].map((h) => (
                    <th key={h} style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: C.mute, textAlign: "left", padding: "0 8px 6px 0", borderBottom: `1px solid ${C.ruleStrong}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.regulations.map((r) => (
                  <tr key={r.slug} style={{ borderBottom: `1px solid ${C.rule}` }}>
                    <td style={{ fontFamily: mono, fontSize: 10.5, color: C.sub, padding: "8px 8px 8px 0", whiteSpace: "nowrap" }}>{r.jurisdiction_code}</td>
                    <td style={{ fontFamily: serif, fontSize: 13.5, fontWeight: 600, padding: "8px 8px 8px 0" }}>{r.name}</td>
                    <td style={{ padding: "8px 8px 8px 0" }}>
                      {statusWord(r.regulation?.status,
                        ["effective", "enforcement"].includes(r.regulation?.status ?? "") ? C.critical
                          : r.regulation?.status === "signed" ? C.high : C.info)}
                    </td>
                    <td style={{ fontFamily: mono, fontSize: 10.5, color: C.sub, padding: "8px 0", whiteSpace: "nowrap" }}>{fmtDate(r.regulation?.effective_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <Kicker right={`${d.standards.length} tracked`}>Standards Shelf</Kicker>
            {d.standards.slice(0, 6).map((s) => (
              <div key={s.slug} style={{ padding: "7px 0", borderBottom: `1px solid ${C.rule}`, display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: ".1em", color: C.accent, width: 46, flexShrink: 0 }}>{s.standard?.publisher}</span>
                <span style={{ fontFamily: serif, fontSize: 13.5, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>{s.name}</span>
                {statusWord(s.standard?.status, s.standard?.status === "updated" ? C.high : C.positive)}
              </div>
            ))}
          </section>

          <section>
            <Kicker right="latest across all sources">The Wire</Kicker>
            {d.feed.slice(0, 7).map((i) => (
              <div key={i.id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.rule}`, alignItems: "baseline", cursor: "pointer" }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, width: 30, flexShrink: 0 }}>{rel(i.published_at ?? i.first_seen_at)}</span>
                <span style={{ fontFamily: sans, fontSize: 12.5, lineHeight: 1.4, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {i.title.replace(/^DEMO: /, "")}
                </span>
                {i.impact_score >= 70 && <span style={{ color: C.critical, fontSize: 10 }}>▲</span>}
              </div>
            ))}
            <p style={{ fontFamily: sans, fontSize: 10.5, color: C.mute, marginTop: 8 }}>
              Every item retains its source, publication date, and retrieval date.
            </p>
          </section>
        </div>

        <footer style={{ marginTop: 40, borderTop: `2px solid ${C.ruleStrong}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: sans, fontSize: 10.5, color: C.mute }}>
            AI Governance Radar is an information tool, not legal advice. Verify against linked official sources.
          </span>
          <span style={{ fontFamily: mono, fontSize: 10, color: C.mute }}>OPEN SOURCE · LOCAL-FIRST · NO LLM REQUIRED</span>
        </footer>
      </main>
    </div>
  );
}
