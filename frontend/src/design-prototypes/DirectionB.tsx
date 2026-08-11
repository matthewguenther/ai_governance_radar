/**
 * DIRECTION B — "Modern Intelligence Terminal" (TEMPORARY PROTOTYPE)
 * Analyst workstation: neutral carbon surfaces, flush tiled modules with
 * domain-coded header ticks, mono-first data voice, HH:MM timestamps, impact
 * meters, confidence dots, UTC status strip. Phosphor-teal identity (not
 * Bloomberg amber). Self-contained; inline styles only.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ProtoMap, fmtTime, useProtoData } from "./shared";
import type { ItemOut } from "../lib/types";

/* ---------- tokens ---------- */
const C = {
  bg: "#0B0D0E",
  surface: "#101314",
  raised: "#171B1D",
  border: "#212628",
  borderStrong: "#31383B",
  text: "#E4E9EA",
  sub: "#93A0A4",
  mute: "#5C686C",
  signal: "#3BC9B4",           // phosphor identity — narrow use
  critical: "#E4574D",
  high: "#D9822E",
  watchC: "#CBB33A",
  positive: "#4CAE72",
  info: "#5B9BD8",
  emerging: "#9E86D8",
};
const mono = "'JetBrains Mono', ui-monospace, monospace";
const sans = "'Inter', system-ui, sans-serif";

const DOMAIN: Record<string, string> = {
  regulation: C.high, standard: C.info, incident: C.critical, security: C.critical,
  research: C.emerging, news: C.mute, training: C.positive, event: C.positive,
  watchlist: C.signal, system: C.mute, ranking: C.info,
};

const tag = (color: string, dashed = false): React.CSSProperties => ({
  fontFamily: mono, fontSize: 9.5, letterSpacing: ".06em", textTransform: "uppercase",
  color, border: `1px ${dashed ? "dashed" : "solid"} ${color}66`, borderRadius: 2,
  padding: "1px 5px", whiteSpace: "nowrap",
});

function Meter({ score }: { score: number }) {
  const col = score >= 70 ? C.critical : score >= 50 ? C.high : score >= 30 ? C.watchC : C.mute;
  const steps = score >= 70 ? 4 : score >= 50 ? 3 : score >= 30 ? 2 : 1;
  return (
    <span title={`Impact ${score}/100`} style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <span style={{ display: "inline-flex", gap: 1.5 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ width: 3.5, height: 10, background: i < steps ? col : C.raised, border: `1px solid ${i < steps ? col : C.borderStrong}` }} />
        ))}
      </span>
      <span style={{ fontFamily: mono, fontSize: 10.5, color: col, minWidth: 17, fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </span>
  );
}

function Conf({ level }: { level: string }) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const col = level === "low" ? C.watchC : C.sub;
  return (
    <span title={`Confidence: ${level}`} style={{ fontFamily: mono, fontSize: 9.5, color: col, letterSpacing: 1 }}>
      {"●".repeat(n)}{"○".repeat(3 - n)}
    </span>
  );
}

function Module({ title, domain, count, right, children, span }: {
  title: string; domain: string; count?: string; right?: React.ReactNode;
  children: React.ReactNode; span?: number;
}) {
  const dc = DOMAIN[domain] ?? C.mute;
  return (
    <section style={{ background: C.surface, border: `1px solid ${C.border}`, gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
      <div style={{ borderTop: `2px solid ${dc}`, display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".12em", color: C.text, textTransform: "uppercase" }}>{title}</span>
        {count && <span style={{ fontFamily: mono, fontSize: 10, color: C.mute }}>{count}</span>}
        <span style={{ marginLeft: "auto" }}>{right}</span>
      </div>
      {children}
    </section>
  );
}

function Row({ item }: { item: ItemOut }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "6px 10px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.raised; e.currentTarget.style.boxShadow = `inset 2px 0 0 ${DOMAIN[item.categories[0]] ?? C.mute}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
      <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, width: 42, flexShrink: 0 }}>{fmtTime(item.published_at ?? item.first_seen_at)}</span>
      <Meter score={item.impact_score} />
      <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: C.text, lineHeight: 1.35, minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.title.replace(/^DEMO: /, "")}
      </span>
      <span style={{ fontFamily: mono, fontSize: 9.5, color: C.mute, flexShrink: 0, textTransform: "uppercase" }}>
        {item.jurisdiction_code ?? item.categories[0]}
      </span>
      {item.is_demo && <span style={tag(C.mute, true)}>demo</span>}
      <Conf level={item.confidence} />
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: mono, fontSize: 11, color: C.text, fontVariantNumeric: "tabular-nums" }}>
      {now.toISOString().slice(11, 19)} <span style={{ color: C.mute }}>UTC</span>
    </span>
  );
}

const NAV = [
  ["OVR", "Overview", true], ["BRF", "Brief", false], ["REG", "Regulatory", false],
  ["STD", "Standards", false], ["INC", "Incidents", false], ["FEED", "Feed", false],
  ["WTC", "Watchlist", false], ["SYS", "Sources", false],
] as const;

export default function DirectionB() {
  const d = useProtoData();

  const stats = [
    { label: "HIGH IMPACT", value: d.summary?.high_impact ?? 0, tone: C.critical },
    { label: "CHANGES / 7D", value: d.summary?.total_changes ?? 0, tone: C.text },
    { label: "INCIDENTS", value: d.summary?.new_incidents ?? 0, tone: C.high },
    { label: "OPPORTUNITIES", value: d.summary?.new_opportunities ?? 0, tone: C.positive },
    { label: "WATCHED Δ", value: d.summary?.watch_changed ?? 0, tone: C.signal },
  ];

  const glance = ["final", "updated", "draft"].map((s) => ({
    s, n: d.standards.filter((x) => x.standard?.status === s).length,
  }));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, color: C.text }}>
      <div style={{ background: "#123B35", borderBottom: `1px solid ${C.border}`, padding: "6px 14px", fontFamily: mono, fontSize: 11, color: C.signal, display: "flex", justifyContent: "space-between" }}>
        <span>PROTOTYPE — DIRECTION B · MODERN INTELLIGENCE TERMINAL</span>
        <Link to="/design" style={{ color: C.signal }}>← ALL DIRECTIONS</Link>
      </div>

      {/* Status strip */}
      <header style={{ display: "flex", alignItems: "center", gap: 18, padding: "8px 14px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: C.signal }} />
          <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: ".14em", color: C.text }}>AIGR<span style={{ color: C.signal }}>▮</span>TERMINAL</span>
        </span>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, letterSpacing: ".1em" }}>7-DAY WINDOW</span>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute, border: `1px solid ${C.border}`, background: C.bg, padding: "4px 12px", width: 320, letterSpacing: ".04em" }}>
            ⌕ QUERY: regulations, incidents, standards…
          </span>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: C.positive }}>● SOURCES 9/11</span>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute }}>INGEST 14m</span>
        <Clock />
      </header>

      <div style={{ display: "flex" }}>
        {/* Rail */}
        <nav style={{ width: 118, borderRight: `1px solid ${C.border}`, background: C.surface, flexShrink: 0, minHeight: "calc(100vh - 70px)" }}>
          {NAV.map(([code, label, active]) => (
            <div key={code} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
              borderBottom: `1px solid ${C.border}`, cursor: "pointer",
              background: active ? C.bg : "transparent",
              boxShadow: active ? `inset 2px 0 0 ${C.signal}` : "none",
            }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: active ? C.signal : C.mute, width: 30 }}>{code}</span>
              <span style={{ fontSize: 11, color: active ? C.text : C.sub }}>{label}</span>
            </div>
          ))}
          <div style={{ padding: "12px 10px", fontFamily: mono, fontSize: 9, color: C.mute, lineHeight: 1.8 }}>
            F1 HELP<br />F3 SEARCH<br />F8 INGEST<br />ESC CLOSE
          </div>
        </nav>

        {/* Mosaic */}
        <main style={{ flex: 1, minWidth: 0, padding: 1, display: "flex", flexDirection: "column", gap: 1, background: C.border }}>
          {/* Stat band */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ background: C.surface, padding: "10px 14px", borderTop: `2px solid ${s.tone === C.text ? C.borderStrong : s.tone}` }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: ".14em", color: C.mute }}>{s.label}</div>
                <div style={{ fontFamily: mono, fontSize: 30, fontWeight: 500, color: s.value > 0 ? s.tone : C.mute, fontVariantNumeric: "tabular-nums", lineHeight: 1.15 }}>
                  {String(s.value).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>

          {/* Developments + map */}
          <div style={{ display: "grid", gridTemplateColumns: "5fr 6fr", gap: 1 }}>
            <Module title="Top Developments" domain="regulation" count={`${d.top.length}`}
              right={<span style={{ fontFamily: mono, fontSize: 9.5, color: C.signal, cursor: "pointer" }}>VIEW ALL →</span>}>
              {d.top.slice(0, 7).map((i) => <Row key={i.id} item={i} />)}
            </Module>

            <Module title="Global Regulatory Grid" domain="standard"
              right={<span style={{ fontFamily: mono, fontSize: 9.5, color: C.mute }}>METRIC: TRACKED REGULATIONS</span>}>
              <ProtoMap rows={d.map} height={286} style={{
                ocean: C.surface,
                land: "#181D1F",
                landBorder: "#0B0D0E",
                ramp: ["#1C3A38", "#1F544D", "#2A7A6C", "#3BC9B4"],
                graticule: "#1A2022",
                marker: "#7FE7D6",
              }} />
              <div style={{ fontFamily: mono, fontSize: 9.5, color: C.mute, padding: "6px 10px", borderTop: `1px solid ${C.border}`, letterSpacing: ".04em", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {d.map.filter((r) => r.regulations > 0).sort((a, b) => b.regulations - a.regulations)
                  .map((r) => `${r.code} ${r.regulations}`).join("  ·  ") || "NO SIGNAL"}
              </div>
            </Module>
          </div>

          {/* Incidents + Regulatory + Standards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <Module title="Incident Intel" domain="incident" count={`${d.incidents.length}`}>
              {d.incidents.slice(0, 5).map((inc) => (
                <div key={inc.id} style={{ padding: "7px 10px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={tag(inc.severity === "critical" ? C.critical : inc.severity === "high" ? C.high : C.watchC)}>{inc.severity.slice(0, 4)}</span>
                    <span style={tag(C.mute)}>{inc.fact_status.replace(/_/g, " ").slice(0, 12)}</span>
                    <span style={{ fontFamily: mono, fontSize: 9.5, color: C.mute, marginLeft: "auto" }}>{fmtTime(inc.reported_at)}</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: "4px 0 0", lineHeight: 1.3, color: C.text }}>{inc.title}</p>
                </div>
              ))}
            </Module>

            <Module title="Regulatory Status" domain="regulation" count={`${d.regulations.length}`}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {d.regulations.slice(0, 6).map((r) => (
                    <tr key={r.slug} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ fontFamily: mono, fontSize: 9.5, color: C.sub, padding: "7px 10px", width: 52 }}>{r.jurisdiction_code}</td>
                      <td style={{ fontSize: 12, fontWeight: 500, color: C.text, padding: "7px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}>{r.name}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", width: 96 }}>
                        <span style={tag(["effective", "enforcement"].includes(r.regulation?.status ?? "") ? C.critical : r.regulation?.status === "signed" ? C.high : C.info)}>
                          {r.regulation?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Module>

            <Module title="Standards Watch" domain="standard"
              right={<span style={{ fontFamily: mono, fontSize: 9.5, color: C.mute }}>{glance.map((g) => `${g.s.slice(0, 3).toUpperCase()} ${g.n}`).join(" · ")}</span>}>
              {d.standards.slice(0, 6).map((s) => (
                <div key={s.slug} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: mono, fontSize: 9.5, color: DOMAIN.standard, width: 44, flexShrink: 0 }}>{s.standard?.publisher}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  <span style={tag(s.standard?.status === "updated" ? C.high : C.positive)}>{s.standard?.status?.slice(0, 7)}</span>
                </div>
              ))}
            </Module>
          </div>

          {/* Wire feed */}
          <Module title="Intelligence Wire" domain="news" count={`${d.feed.length} RECENT`}
            right={<span style={{ fontFamily: mono, fontSize: 9.5, color: C.signal }}>● LIVE</span>}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1 }}>
              {d.feed.slice(0, 10).map((i) => <Row key={i.id} item={i} />)}
            </div>
          </Module>
        </main>
      </div>
    </div>
  );
}
