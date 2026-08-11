/** Jurisdiction coverage map (§21).
 *
 * What it conveys — stated plainly in the UI, because an unexplained world map
 * invites the reader to assume it ranks countries: this shows **what this
 * instance tracks**, i.e. governance instruments in the curated registry plus
 * recent intelligence volume per jurisdiction. It is a coverage map, not a
 * global AI-regulation ranking, and every marker leads somewhere real.
 *
 * Size is capped so the map supports the dashboard rather than dominating it on
 * large displays.
 */

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";
import { useNavigate } from "react-router-dom";

import { InfoTip } from "../ui/InfoTip";
import { T } from "../../lib/tokens";
import type { MapRow } from "../../lib/types";

type Metric = "instruments" | "recent_items";

const METRIC_LABELS: Record<Metric, string> = {
  instruments: "Tracked governance instruments",
  recent_items: "Intelligence volume, last 30 days",
};

const METRIC_HELP: Record<Metric, string> = {
  instruments:
    "How many laws, frameworks, and national standards this instance tracks for each " +
    "jurisdiction — a measure of your coverage, not of how regulated a country is. " +
    "Thin coverage means we should add records, not that the country is inactive.",
  recent_items:
    "How many items were collected for each jurisdiction in the last 30 days. This " +
    "reflects both real-world activity and which sources you have enabled.",
};

const LAND = "#161D2A";
const LAND_ACTIVE = ["#20304A", "#28405F", "#31517A"];
const BORDER = "#0B0F16";

const LEGEND: [string, string][] = [
  ["High", T.critical],
  ["Medium", T.high],
  ["Emerging", T.emerging],
];

export function WorldMap({ rows }: { rows: MapRow[] }) {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<Metric>("instruments");
  const [hover, setHover] = useState<{ name: string; row?: MapRow; x: number; y: number } | null>(null);

  const { features, path, centroids } = useMemo(() => {
    const topo = world as unknown as Parameters<typeof feature>[0];
    const countries = (topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } })
      .objects.countries;
    const fc = feature(topo, countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    const projection = geoNaturalEarth1().fitSize([760, 380], fc);
    const p = geoPath(projection);
    const cents = new Map<string, [number, number]>();
    fc.features.forEach((f) => {
      const c = p.centroid(f);
      if (Number.isFinite(c[0])) cents.set(String(f.id ?? "").padStart(3, "0"), c as [number, number]);
    });
    return { features: fc.features, path: p, centroids: cents };
  }, []);

  const byIso = useMemo(() => {
    const m = new Map<string, MapRow>();
    rows.forEach((r) => r.iso_numeric && m.set(r.iso_numeric.padStart(3, "0"), r));
    return m;
  }, [rows]);

  const max = Math.max(1, ...rows.map((r) => r[metric]));
  const active = rows.filter((r) => r[metric] > 0).sort((a, b) => b[metric] - a[metric]);

  const fillColor = (value: number) => {
    if (value <= 0) return LAND;
    const idx = Math.min(LAND_ACTIVE.length - 1, Math.floor((value / max) * LAND_ACTIVE.length));
    return LAND_ACTIVE[Math.max(0, idx)];
  };
  const dotColor = (value: number) =>
    value >= max * 0.66 ? T.critical : value >= max * 0.33 ? T.high : T.emerging;

  const open = (row: MapRow) =>
    navigate(
      metric === "instruments"
        ? `/regulatory?country=${row.link_code}`
        : `/items?jurisdiction=${row.link_code}`,
    );

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-tx-secondary">
          <span className="meta-label">Metric</span>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="rounded-ctl border border-bd-subtle bg-bg-base px-2 py-1 text-xs text-tx-primary"
          >
            {Object.entries(METRIC_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <InfoTip content={METRIC_HELP[metric]} />
        </label>
        <div className="flex items-center gap-3" aria-hidden>
          {LEGEND.map(([label, col]) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-[10.5px] text-tx-secondary">
              <span
                className="inline-block h-[7px] w-[7px] rounded-full"
                style={{ background: col, boxShadow: `0 0 6px ${col}88` }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox="40 10 690 350"
        role="img"
        aria-label={`World map of ${METRIC_LABELS[metric]} by jurisdiction`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
      >
        {features.map((f) => {
          const iso = String(f.id ?? "").padStart(3, "0");
          const row = byIso.get(iso);
          const value = row ? row[metric] : 0;
          return (
            <path
              key={iso + (f.properties?.name ?? "")}
              d={path(f) ?? undefined}
              fill={fillColor(value)}
              stroke={BORDER}
              strokeWidth={0.5}
              tabIndex={row && value > 0 ? 0 : -1}
              role={row && value > 0 ? "button" : undefined}
              aria-label={row && value > 0 ? `${row.name}: ${value} — open details` : undefined}
              className={row && value > 0 ? "cursor-pointer transition-opacity hover:opacity-80 focus:opacity-80" : ""}
              onClick={() => row && value > 0 && open(row)}
              onKeyDown={(e) => e.key === "Enter" && row && value > 0 && open(row)}
              onMouseMove={(e) => {
                const rect = (e.target as SVGPathElement).ownerSVGElement!.getBoundingClientRect();
                setHover({
                  name: (f.properties?.name as string) ?? "Unknown",
                  row,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }}
            />
          );
        })}
        {rows.filter((r) => r[metric] > 0 && r.iso_numeric).map((r) => {
          const c = centroids.get(r.iso_numeric!.padStart(3, "0"));
          if (!c) return null;
          const col = dotColor(r[metric]);
          const radius = 2.5 + 2.5 * Math.sqrt(r[metric] / max);
          return (
            <g key={`dot-${r.code}`} pointerEvents="none">
              <circle cx={c[0]} cy={c[1]} r={radius + 4} fill={col} opacity={0.18} />
              <circle cx={c[0]} cy={c[1]} r={radius + 1.5} fill={col} opacity={0.35} />
              <circle cx={c[0]} cy={c[1]} r={radius} fill={col} stroke="rgba(255,255,255,.5)" strokeWidth={0.6} />
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-ctl border border-bd-strong bg-bg-raised px-2.5 py-1.5 text-xs shadow-card"
          style={{ left: Math.min(hover.x + 10, 380), top: hover.y + 10 }}
        >
          <p className="font-medium text-tx-primary">{hover.row?.name ?? hover.name}</p>
          {hover.row ? (
            <>
              <p className="text-tx-secondary">
                {hover.row.instruments} tracked instrument{hover.row.instruments === 1 ? "" : "s"}
              </p>
              <p className="text-tx-secondary">{hover.row.recent_items} items, last 30 days</p>
              {hover.row.via.includes("EU") && (
                <p className="text-meta text-tx-muted">
                  Covered by EU-level instruments — opens the EU record
                </p>
              )}
            </>
          ) : (
            <p className="text-tx-muted">Not tracked yet</p>
          )}
        </div>
      )}

      <p className="mt-2 text-meta leading-relaxed text-tx-muted">
        <span className="text-tx-secondary">Coverage map</span> — {METRIC_LABELS[metric]} in this
        instance, not a ranking of national AI regulation.{" "}
        {active.length
          ? active.map((r) => `${r.name} ${r[metric]}`).join(" · ")
          : "no tracked activity yet"}
      </p>
    </div>
  );
}
