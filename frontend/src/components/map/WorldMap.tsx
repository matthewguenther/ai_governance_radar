/** SVG choropleth via d3-geo + topojson-client + vendored world-atlas data (DEC-022).
 * Metric is explicitly labeled (§21); color encodes activity volume, not "good/bad".
 * A table fallback (Settings ▸ jurisdictions or the caption list) keeps it accessible. */

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";
import { useNavigate } from "react-router-dom";

import type { MapRow } from "../../lib/types";

type Metric = "regulations" | "recent_items";

const METRIC_LABELS: Record<Metric, string> = {
  regulations: "Tracked AI regulations (count)",
  recent_items: "Intelligence activity, last 30 days (items)",
};

// Blues ramp — communicates volume only, never quality (§21).
const RAMP = ["#1A2029", "#173753", "#1E4F82", "#2D6FB4", "#4D9FFF"];

function color(value: number, max: number): string {
  if (value <= 0 || max <= 0) return RAMP[0];
  const idx = Math.min(RAMP.length - 1, 1 + Math.floor((value / max) * (RAMP.length - 2)));
  return RAMP[idx];
}

export function WorldMap({ rows }: { rows: MapRow[] }) {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<Metric>("regulations");
  const [hover, setHover] = useState<{ name: string; row?: MapRow; x: number; y: number } | null>(null);

  const { features, path } = useMemo(() => {
    const topo = world as unknown as Parameters<typeof feature>[0];
    const countries = (topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } })
      .objects.countries;
    const fc = feature(topo, countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    const projection = geoNaturalEarth1().fitSize([760, 380], fc);
    return { features: fc.features, path: geoPath(projection) };
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
        <div className="flex items-center gap-1 text-meta text-tx-muted" aria-hidden>
          <span>0</span>
          {RAMP.map((c) => (
            <span key={c} className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>{max}</span>
        </div>
      </div>

      <svg
        viewBox="0 0 760 380"
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
              fill={color(value, max)}
              stroke="#0B0E14"
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
