/**
 * DIRECTION A — "Refined Intelligence Dashboard" (TEMPORARY PROTOTYPE)
 * Premium polish of the existing aesthetic: deep navy surfaces with subtle top-lit
 * gradients, one consistent elevation, refined outline micro-pills, strong Inter
 * hierarchy, sparklines, glowing map markers. Self-contained; inline styles only.
 */

import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowUpRight, BookOpenCheck, Landmark, LayoutDashboard,
  Newspaper, Radar, Search, Settings, Sunrise,
} from "lucide-react";

import { ProtoMap, Sparkline, fmtDate, rel, sparkSeries, useProtoData } from "./shared";
import type { ItemOut } from "../lib/types";

/* ---------- tokens ---------- */
const C = {
  bg: "#090C12",
  surface: "linear-gradient(180deg, #131A26 0%, #0F141D 100%)",
  surfaceFlat: "#10151E",
  raised: "#1A2230",
  border: "#1E2836",
  borderStrong: "#2C3A4E",
  text: "#E8EDF5",
  sub: "#8FA0B5",
  mute: "#5C6B80",
  accent: "#628BFF",
  accentSoft: "rgba(98,139,255,.12)",
  critical: "#F2564D",
  high: "#F2913D",
  watchC: "#E5C445",
  positive: "#3FBF77",
  info: "#5B9BD8",
  emerging: "#A78BFA",
  shadow: "0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.045)",
};
const sans = "'Inter', system-ui, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, monospace";

const card: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
  boxShadow: C.shadow, overflow: "hidden",
};
const cardHead: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
};
const headTitle: React.CSSProperties = {
  fontFamily: sans, fontSize: 13, fontWeight: 600, letterSpacing: ".01em", color: C.text,
  display: "flex", alignItems: "center", gap: 8,
};
const microPill = (color: string): React.CSSProperties => ({
  fontFamily: mono, fontSize: 10, fontWeight: 500, letterSpacing: ".05em",
  color, border: `1px solid ${color}55`, borderRadius: 5, padding: "1.5px 6px",
  textTransform: "uppercase", whiteSpace: "nowrap",
});

function impactColor(s: number) {
  return s >= 70 ? C.critical : s >= 50 ? C.high : s >= 30 ? C.watchC : C.info;
}

function ImpactRing({ score }: { score: number }) {
  const r = 11, circ = 2 * Math.PI * r;
  const col = impactColor(score);
  return (
    <svg width={28} height={28} aria-label={`Impact ${score}`} style={{ flexShrink: 0 }}>
      <circle cx={14} cy={14} r={r} fill="none" stroke={C.raised} strokeWidth={2.5} />
      <circle cx={14} cy={14} r={r} fill="none" stroke={col} strokeWidth={2.5}
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 14 14)" />
      <text x={14} y={17} textAnchor="middle" fontFamily={mono} fontSize={8.5} fill={C.text}>{score}</text>
    </svg>
  );
}

function ConfDots({ level }: { level: string }) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span title={`Confidence ${level}`} style={{ display: "inline-flex", gap: 2.5, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4.5, height: 4.5, borderRadius: 3,
          background: i < n ? C.sub : "transparent", border: `1px solid ${C.mute}`,
        }} />
      ))}
    </span>
  );
}

function ItemRowA({ item }: { item: ItemOut }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${C.border}`,
      alignItems: "flex-start", cursor: "pointer", transition: "background .12s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(98,139,255,.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <ImpactRing score={item.impact_score} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 550, color: C.text, lineHeight: 1.35, margin: 0 }}>
          {item.title.replace(/^DEMO: /, "")}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
          <span style={{ fontFamily: sans, fontSize: 11, color: C.sub }}>{item.source_name}</span>
          {item.categories.slice(0, 2).map((c) => (
            <span key={c} style={microPill(C.mute)}>{c}</span>
          ))}
          {item.jurisdiction_code && <span style={microPill(C.info)}>{item.jurisdiction_code}</span>}
          {item.is_demo && <span style={{ ...microPill(C.mute), borderStyle: "dashed" }}>demo</span>}
          <ConfDots level={item.confidence} />
          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute, marginLeft: "auto" }}>
            {rel(item.published_at ?? item.first_seen_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Sunrise, label: "Morning Brief" },
  { icon: Landmark, label: "Regulatory" },
  { icon: BookOpenCheck, label: "Standards" },
  { icon: AlertTriangle, label: "Incidents" },
  { icon: Newspaper, label: "Feed" },
  { icon: Radar, label: "Watchlist" },
  { icon: Settings, label: "Settings" },
];

export default function DirectionA() {
  const d = useProtoData();
  const spark = sparkSeries(d.feed, 14);

  const kpis = [
    { label: "High impact", value: d.summary?.high_impact ?? 0, tone: C.critical, delta: "+3 vs prior wk" },
    { label: "Total changes", value: d.summary?.total_changes ?? 0, tone: C.accent, delta: "7-day window" },
    { label: "New incidents", value: d.summary?.new_incidents ?? 0, tone: C.high, delta: "monitored feeds" },
    { label: "Opportunities", value: d.summary?.new_opportunities ?? 0, tone: C.positive, delta: "training & events" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 500px at 70% -10%, rgba(98,139,255,.07), transparent), ${C.bg}`, fontFamily: sans, color: C.text }}>
      {/* Prototype banner */}
      <div style={{ background: C.accentSoft, borderBottom: `1px solid ${C.border}`, padding: "6px 16px", fontFamily: mono, fontSize: 11, color: C.accent, display: "flex", justifyContent: "space-between" }}>
        <span>PROTOTYPE — DIRECTION A · REFINED INTELLIGENCE DASHBOARD</span>
        <Link to="/design" style={{ color: C.accent }}>← All directions</Link>
      </div>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{ width: 218, minHeight: "calc(100vh - 30px)", borderRight: `1px solid ${C.border}`, background: "rgba(16,21,30,.6)", padding: "18px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 18px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #3D5FCC)`, display: "grid", placeItems: "center", boxShadow: "0 4px 14px rgba(98,139,255,.35)" }}>
              <Radar size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 650, letterSpacing: ".02em" }}>Governance Radar</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.sub, letterSpacing: ".14em" }}>INTELLIGENCE</div>
            </div>
          </div>
          {NAV.map(({ icon: Icon, label, active }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
              fontSize: 13, fontWeight: active ? 550 : 450,
              color: active ? C.text : C.sub,
              background: active ? C.accentSoft : "transparent",
              border: `1px solid ${active ? C.accent + "44" : "transparent"}`,
              marginBottom: 2, cursor: "pointer",
            }}>
              <Icon size={15} color={active ? C.accent : C.mute} />
              {label}
              {label === "Watchlist" && (
                <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, background: C.critical + "22", color: C.critical, borderRadius: 10, padding: "0 6px" }}>4</span>
              )}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "20px 24px 40px", minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 650, margin: 0, letterSpacing: "-.01em" }}>Intelligence Overview</h1>
              <p style={{ fontFamily: mono, fontSize: 11, color: C.mute, margin: "3px 0 0" }}>
                7-DAY WINDOW · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surfaceFlat, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", width: 260 }}>
                <Search size={13} color={C.mute} />
                <span style={{ fontSize: 12, color: C.mute }}>Search intelligence…</span>
                <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.mute, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px" }}>/</span>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {kpis.map((k) => (
              <div key={k.label} style={{ ...card, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".12em", color: C.sub, textTransform: "uppercase" }}>{k.label}</div>
                  <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 650, letterSpacing: "-.02em", marginTop: 4, color: k.value > 0 ? C.text : C.mute, fontVariantNumeric: "tabular-nums" }}>
                    {k.value}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.mute, marginTop: 2 }}>{k.delta}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: k.tone, display: "inline-block", boxShadow: `0 0 8px ${k.tone}66` }} />
                  <div style={{ marginTop: 14, opacity: .8 }}>
                    <Sparkline data={spark} width={72} height={24} stroke={k.tone} fill={`${k.tone}18`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: Top Developments + Map */}
          <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 14, marginTop: 14 }}>
            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.critical }} />Top Developments</span>
                <span style={{ fontFamily: sans, fontSize: 11.5, color: C.accent, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>View all <ArrowUpRight size={12} /></span>
              </div>
              {d.top.slice(0, 5).map((i) => <ItemRowA key={i.id} item={i} />)}
            </section>

            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.accent }} />Global Regulatory Activity</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, textTransform: "uppercase", letterSpacing: ".08em" }}>Tracked regulations</span>
              </div>
              <div style={{ padding: "6px 10px 2px" }}>
                <ProtoMap rows={d.map} height={300} style={{
                  ocean: "transparent",
                  land: "#151C28",
                  landBorder: "#0B0F16",
                  ramp: ["#1D3A5F", "#2A5A96", "#3D7BC4", "#628BFF"],
                  marker: "#9DB8FF",
                }} />
              </div>
              <div style={{ display: "flex", gap: 14, padding: "8px 16px 12px", alignItems: "center" }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.mute }}>0</span>
                <div style={{ flex: "0 0 120px", height: 6, borderRadius: 3, background: `linear-gradient(90deg, #1D3A5F, #628BFF)` }} />
                <span style={{ fontFamily: mono, fontSize: 10, color: C.mute }}>8</span>
                <span style={{ fontSize: 11, color: C.sub, marginLeft: "auto" }}>
                  {d.map.filter((r) => r.regulations > 0).length} active jurisdictions · EU activity applied to member states
                </span>
              </div>
            </section>
          </div>

          {/* Row 3: Incidents + Standards + Regulatory pulse */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.high }} />AI Incidents</span>
                <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute }}>{d.incidents.length} tracked</span>
              </div>
              {d.incidents.slice(0, 4).map((inc) => (
                <div key={inc.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={microPill(inc.severity === "critical" ? C.critical : inc.severity === "high" ? C.high : C.watchC)}>{inc.severity}</span>
                    <span style={microPill(C.mute)}>{inc.fact_status.replace("_", " ")}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, marginLeft: "auto" }}>{rel(inc.reported_at)}</span>
                  </div>
                  <p style={{ fontSize: 12.5, fontWeight: 500, color: C.text, margin: 0, lineHeight: 1.3 }}>{inc.title}</p>
                </div>
              ))}
            </section>

            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.info }} />Standards Watch</span>
                <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute }}>{d.standards.length} tracked</span>
              </div>
              {d.standards.slice(0, 4).map((s) => (
                <div key={s.slug} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: C.raised, display: "grid", placeItems: "center",
                    fontFamily: mono, fontSize: 8.5, color: C.sub, border: `1px solid ${C.border}`,
                  }}>{s.standard?.publisher.slice(0, 4)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</p>
                    <p style={{ fontFamily: mono, fontSize: 10, color: C.mute, margin: "2px 0 0" }}>{fmtDate(s.standard?.last_updated_at ?? s.standard?.published_at)}</p>
                  </div>
                  <span style={microPill(s.standard?.status === "updated" ? C.high : C.positive)}>{s.standard?.status}</span>
                </div>
              ))}
            </section>

            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.emerging }} />Regulatory Pulse</span>
                <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute }}>{d.regulations.length} tracked</span>
              </div>
              {d.regulations.slice(0, 4).map((r) => (
                <div key={r.slug} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.sub, width: 46, flexShrink: 0 }}>{r.jurisdiction_code}</span>
                  <p style={{ fontSize: 12.5, fontWeight: 500, margin: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                  <span style={microPill(r.regulation?.status === "effective" || r.regulation?.status === "enforcement" ? C.critical : r.regulation?.status === "signed" ? C.high : C.info)}>
                    {r.regulation?.status}
                  </span>
                </div>
              ))}
              <div style={{ padding: "10px 16px", fontSize: 11, color: C.mute }}>
                Verified against official sources · staleness surfaced per record
              </div>
            </section>
          </div>

          {/* Feed strip */}
          <section style={{ ...card, marginTop: 14 }}>
            <div style={cardHead}>
              <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.positive }} />Intelligence Feed</span>
              <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute }}>LIVE · {d.feed.length} recent</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {d.feed.slice(0, 6).map((i) => <ItemRowA key={i.id} item={i} />)}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
