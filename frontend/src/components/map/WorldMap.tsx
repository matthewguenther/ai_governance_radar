/** SVG choropleth via d3-geo + vendored world-atlas data (DEC-022), approved
 * Direction A treatment: dark land, glowing activity markers sized by value,
 * High/Medium/Emerging legend. Metric explicitly labeled (§21); color encodes
 * activity volume, never "good/bad" regulation. Fully keyboard accessible with
 * a text alternative below the map. */

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";
import { useNavigate } from "react-router-dom";

import { T } from "../../lib/tokens";
import type { MapRow } from "../../lib/types";

type Metric = "regulations" | "recent_items";

const METRIC_LABELS: Record<Metric, string> = {
  regulations: "Tracked AI regulations (count)",
  recent_items: "Intelligence activity, last 30 days (items)",
};

const LAND = "#161D2A";
const LAND_ACTIVE = ["#20304A", "#28405F", "#31517A"]; // subtle fill under the markers
const BORDER = "#0B0F16";

function fillColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return LAND;
  const idx = Math.min(LAND_ACTIVE.length - 1, Math.floor((value / max) * LAND_ACTIVE.length));
  return LAND_ACTIVE[Math.max(0, idx)];
}

function dotColor(value: number, max: number): string {
  if (value >= max * 0.66) return T.critical;
  if (value >= max * 0.33) return T.high;
  return T.emerging;
}

const LEGEND: [string, string][] = [
  ["High", T.critical],
  ["Medium", T.high],
  ["Emerging", T.emerging],
];

export function WorldMap({ rows }: { rows: MapRow[] }) {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<Metric>("regulations");
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

  return (
    <div className="relative">
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
        aria-label={`World map of ${METRIC_LABELS[metric]}`}
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
              fill={fillColor(value, max)}
              stroke={BORDER}
              strokeWidth={0.5}
              tabIndex={row ? 0 : -1}
              role={row ? "button" : undefined}
              aria-label={row ? `${row.name}: ${value} — open regulations` : undefined}
              className={row ? "cursor-pointer transition-opacity hover:opacity-80 focus:opacity-80" : ""}
              onClick={() => row && navigate(`/regulatory?country=${row.code.split("-")[0]}`)}
              onKeyDown={(e) => e.key === "Enter" && row && navigate(`/regulatory?country=${row.code.split("-")[0]}`)}
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
        {/* glowing activity markers, sized by value */}
        {rows.filter((r) => r[metric] > 0 && r.iso_numeric).map((r) => {
          const c = centroids.get(r.iso_numeric!.padStart(3, "0"));
          if (!c) return null;
          const col = dotColor(r[metric], max);
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
          style={{ left: Math.min(hover.x + 10, 560), top: hover.y + 10 }}
        >
          <p className="font-medium text-tx-primary">{hover.row?.name ?? hover.name}</p>
          {hover.row ? (
            <>
              <p className="text-tx-secondary">{hover.row.regulations} tracked regulations</p>
              <p className="text-tx-secondary">{hover.row.recent_items} items, 30 days</p>
              {hover.row.members.includes("EU") && (
                <p className="text-meta text-tx-muted">includes EU-level activity</p>
              )}
            </>
          ) : (
            <p className="text-tx-muted">No tracked activity</p>
          )}
        </div>
      )}

      {/* Accessible text alternative */}
      <p className="mt-2 text-meta text-tx-muted">
        {METRIC_LABELS[metric]}:{" "}
        {active.length
          ? active.map((r) => `${r.name} ${r[metric]}`).join(" · ")
          : "no tracked activity yet"}
      </p>
    </div>
  );
}
