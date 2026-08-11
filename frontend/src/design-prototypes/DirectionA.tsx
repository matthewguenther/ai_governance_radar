/**
 * DIRECTION A — "Refined Intelligence Dashboard" (TEMPORARY PROTOTYPE, rev 2)
 * Owner feedback applied: animated radar mark, jurisdiction flag chips, org
 * monogram avatars, tinted "alive" KPI cards, filled status pills, glowing map
 * markers with legend. Self-contained; inline styles only.
 */

import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowUpRight, BookOpenCheck, GraduationCap, Landmark,
  LayoutDashboard, Newspaper, Radar, Search, Settings, ShieldAlert, Sunrise,
} from "lucide-react";

import { ProtoMap, Sparkline, fmtDate, rel, sparkSeries, useProtoData } from "./shared";
import { Donut, FlagChip, IncidentIcon, OrgAvatar, RadarLogo, orgFor } from "./protoIcons";
import type { EntityOut, ItemOut } from "../lib/types";

/* ---------- tokens ---------- */
const C = {
  bg: "#090C12",
  surface: "linear-gradient(180deg, #131A26 0%, #0F141D 100%)",
  surfaceFlat: "#10151E",
  raised: "#1A2230",
  border: "#1E2836",
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
/** Filled pill — the "alive" status treatment from the reference mockups. */
const fillPill = (color: string): React.CSSProperties => ({
  fontFamily: sans, fontSize: 10.5, fontWeight: 600, letterSpacing: ".04em",
  color, background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 6,
  padding: "2px 8px", textTransform: "capitalize", whiteSpace: "nowrap",
});

const sevColor = (s: string) =>
  s === "critical" ? C.critical : s === "high" ? C.high : s === "medium" ? C.watchC : C.info;
const regStatusColor = (s?: string | null) =>
  ["effective", "enforcement"].includes(s ?? "") ? C.positive
    : s === "signed" ? C.high : s === "passed" ? C.watchC : C.info;

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

/** Item avatar: org logo when an org entity/source matches, else jurisdiction flag. */
function ItemAvatar({ item }: { item: ItemOut }) {
  const entityOrg = item.entities.map((e) => orgFor(e.name)).find(Boolean);
  if (entityOrg) return <OrgAvatar name={item.entities.find((e) => orgFor(e.name))!.name} />;
  if (item.jurisdiction_code) return <FlagChip code={item.jurisdiction_code} size={24} title={item.jurisdiction_code} />;
  return <OrgAvatar name={item.source_name} />;
}

function ItemRowA({ item }: { item: ItemOut }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${C.border}`,
      alignItems: "flex-start", cursor: "pointer", transition: "background .12s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(98,139,255,.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <span style={{ marginTop: 1 }}><ItemAvatar item={item} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 550, color: C.text, lineHeight: 1.35, margin: 0 }}>
          {item.title.replace(/^DEMO: /, "")}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
          <span style={{ fontFamily: sans, fontSize: 11, color: C.sub }}>{item.source_name}</span>
          {item.categories.slice(0, 2).map((c) => (
            <span key={c} style={microPill(C.mute)}>{c}</span>
          ))}
          {item.is_demo && <span style={{ ...microPill(C.mute), borderStyle: "dashed" }}>demo</span>}
          <ConfDots level={item.confidence} />
          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute, marginLeft: "auto" }}>
            {rel(item.published_at ?? item.first_seen_at)}
          </span>
        </div>
      </div>
      <ImpactRing score={item.impact_score} />
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
    { label: "High impact", value: d.summary?.high_impact ?? 0, tone: C.critical, icon: ShieldAlert, delta: "see what's new" },
    { label: "Total changes", value: d.summary?.total_changes ?? 0, tone: C.accent, icon: Activity, delta: "7-day window" },
    { label: "New incidents", value: d.summary?.new_incidents ?? 0, tone: C.high, icon: AlertTriangle, delta: "monitored feeds" },
    { label: "Opportunities", value: d.summary?.new_opportunities ?? 0, tone: C.positive, icon: GraduationCap, delta: "training & events" },
  ];

  const stdCounts = ["final", "updated", "draft"].map((s) => ({
    s, n: d.standards.filter((x) => x.standard?.status === s).length,
  }));
  const stdOther = d.standards.length - stdCounts.reduce((a, x) => a + x.n, 0);

  const publisherOf = (e: EntityOut) => e.standard?.publisher ?? "Other";

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 500px at 70% -10%, rgba(98,139,255,.07), transparent), ${C.bg}`, fontFamily: sans, color: C.text }}>
      {/* Prototype banner */}
      <div style={{ background: C.accentSoft, borderBottom: `1px solid ${C.border}`, padding: "6px 16px", fontFamily: mono, fontSize: 11, color: C.accent, display: "flex", justifyContent: "space-between" }}>
        <span>PROTOTYPE — DIRECTION A · REV 2 (OWNER FEEDBACK APPLIED)</span>
        <Link to="/design" style={{ color: C.accent }}>← All directions</Link>
      </div>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{ width: 218, minHeight: "calc(100vh - 30px)", borderRight: `1px solid ${C.border}`, background: "rgba(16,21,30,.6)", padding: "18px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 18px" }}>
            <RadarLogo size={34} accent={C.accent} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 650, letterSpacing: ".02em" }}>AI Governance</div>
              <div style={{ fontFamily: mono, fontSize: 9.5, color: C.accent, letterSpacing: ".26em" }}>RADAR</div>
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
              <h1 style={{ fontSize: 20, fontWeight: 650, margin: 0, letterSpacing: "-.01em" }}>AI Governance Intelligence</h1>
              <p style={{ fontSize: 12, color: C.sub, margin: "3px 0 0" }}>
                Your command center for AI governance, risk, and policy developments.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.mute }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surfaceFlat, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", width: 240 }}>
                <Search size={13} color={C.mute} />
                <span style={{ fontSize: 12, color: C.mute }}>Search intelligence…</span>
                <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: C.mute, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px" }}>/</span>
              </div>
            </div>
          </div>

          {/* KPIs — tinted "alive" cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {kpis.map((k) => (
              <div key={k.label} style={{
                borderRadius: 12, padding: "13px 16px",
                background: `linear-gradient(135deg, ${k.tone}1C 0%, ${k.tone}08 55%, transparent 100%), ${C.surfaceFlat}`,
                border: `1px solid ${k.tone}3D`,
                boxShadow: C.shadow,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontFamily: mono, fontSize: 30, fontWeight: 600, letterSpacing: "-.02em", color: k.value > 0 ? k.tone : C.mute, fontVariantNumeric: "tabular-nums", lineHeight: 1.15 }}>
                    {k.value}
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.text, marginTop: 3 }}>{k.label}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: C.sub, marginTop: 1 }}>{k.delta}</span>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <k.icon size={15} color={k.tone} style={{ opacity: .9 }} />
                  <div style={{ marginTop: 8, opacity: .85 }}>
                    <Sparkline data={spark} width={64} height={20} stroke={k.tone} fill={`${k.tone}18`} />
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
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.accent }} />Global AI Regulatory Heat Map</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, textTransform: "uppercase", letterSpacing: ".08em" }}>Tracked regulations</span>
              </div>
              <div style={{ padding: "6px 10px 2px" }}>
                <ProtoMap rows={d.map} height={292} style={{
                  ocean: "transparent",
                  land: "#161D2A",
                  landBorder: "#0B0F16",
                  ramp: ["#20304A", "#28405F", "#31517A"],
                  dotColor: (v, max) => (v >= max * 0.66 ? C.critical : v >= max * 0.33 ? C.high : C.emerging),
                }} />
              </div>
              <div style={{ display: "flex", gap: 12, padding: "8px 16px 12px", alignItems: "center" }}>
                {[["High", C.critical], ["Medium", C.high], ["Emerging", C.emerging]].map(([label, col]) => (
                  <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.sub }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: col as string, boxShadow: `0 0 6px ${col}88` }} />
                    {label}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: C.sub, marginLeft: "auto" }}>
                  {d.map.filter((r) => r.regulations > 0).length} active jurisdictions · EU activity applied to members
                </span>
              </div>
            </section>
          </div>

          {/* Row 3: Incidents + Standards + Regulatory pulse */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.high }} />AI Incidents</span>
                <span style={{ ...fillPill(C.critical), textTransform: "uppercase", fontSize: 9.5 }}>New</span>
              </div>
              {d.incidents.slice(0, 4).map((inc) => (
                <div key={inc.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", display: "flex", gap: 11 }}>
                  <IncidentIcon category={inc.category} tone={sevColor(inc.severity)} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 550, color: C.text, margin: 0, lineHeight: 1.3 }}>{inc.title}</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                      <span style={fillPill(sevColor(inc.severity))}>{inc.severity}</span>
                      <span style={{ fontSize: 10.5, color: C.mute }}>{inc.fact_status.replace(/_/g, " ")}</span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: C.mute, marginLeft: "auto" }}>{rel(inc.reported_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.info }} />Standards Watch</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Donut size={34} stroke={6} centerLabel={`${d.standards.length}`} segments={[
                    { value: stdCounts[0].n, color: C.positive },
                    { value: stdCounts[1].n, color: C.high },
                    { value: stdCounts[2].n, color: C.watchC },
                    { value: stdOther, color: C.mute },
                  ]} />
                </span>
              </div>
              {d.standards.slice(0, 4).map((e) => (
                <div key={e.slug} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <OrgAvatar name={`${publisherOf(e)} ${e.name}`} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 550, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</p>
                    <p style={{ fontFamily: mono, fontSize: 10, color: C.mute, margin: "2px 0 0" }}>{fmtDate(e.standard?.last_updated_at ?? e.standard?.published_at)}</p>
                  </div>
                  <span style={fillPill(e.standard?.status === "updated" ? C.high : C.positive)}>{e.standard?.status}</span>
                </div>
              ))}
            </section>

            <section style={card}>
              <div style={cardHead}>
                <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.emerging }} />Regulatory Pulse</span>
                <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mute }}>{d.regulations.length} tracked</span>
              </div>
              {d.regulations.slice(0, 5).map((r) => (
                <div key={r.slug} style={{ padding: "9px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <FlagChip code={r.jurisdiction_code ?? "GLOBAL"} size={22} title={r.jurisdiction_code ?? undefined} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 550, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                    <p style={{ fontFamily: mono, fontSize: 9.5, color: C.mute, margin: "1px 0 0" }}>
                      {r.jurisdiction_code} · eff. {fmtDate(r.regulation?.effective_at)}
                    </p>
                  </div>
                  <span style={fillPill(regStatusColor(r.regulation?.status))}>{r.regulation?.status}</span>
                </div>
              ))}
            </section>
          </div>

          {/* Feed strip */}
          <section style={{ ...card, marginTop: 14 }}>
            <div style={cardHead}>
              <span style={headTitle}><span style={{ width: 3, height: 14, borderRadius: 2, background: C.positive }} />Intelligence Feed</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10.5, color: C.positive }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: C.positive, boxShadow: `0 0 6px ${C.positive}` }} />
                LIVE · {d.feed.length} recent
              </span>
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
