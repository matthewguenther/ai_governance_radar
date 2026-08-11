/**
 * DESIGN PROTOTYPES — shared data + map. TEMPORARY: delete this folder after a
 * direction is chosen. Real application data, zero production-UI dependencies.
 */

import { useMemo } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";

import {
  useDashboardSummary,
  useIncidents,
  useItems,
  useMapData,
  useRegulations,
  useStandards,
} from "../lib/api";
import type { ItemOut, MapRow } from "../lib/types";

export function useProtoData() {
  const summary = useDashboardSummary(7);
  const top = useItems({ min_impact: 50, sort: "impact", limit: 7, collapse_clusters: true });
  const feed = useItems({ sort: "first_seen", limit: 12, collapse_clusters: true });
  const regulations = useRegulations();
  const incidents = useIncidents();
  const standards = useStandards();
  const map = useMapData();
  return {
    summary: summary.data,
    top: top.data?.items ?? [],
    feed: feed.data?.items ?? [],
    regulations: regulations.data ?? [],
    incidents: incidents.data ?? [],
    standards: standards.data ?? [],
    map: map.data ?? [],
    ready:
      !!summary.data && !!top.data && !!regulations.data && !!incidents.data &&
      !!standards.data && !!map.data,
  };
}

/** Per-day item counts for sparklines (real data, last n days). */
export function sparkSeries(items: ItemOut[], days = 14): number[] {
  const counts = new Array(days).fill(0);
  const now = Date.now();
  items.forEach((i) => {
    const t = new Date(i.published_at ?? i.first_seen_at).getTime();
    const age = Math.floor((now - t) / 86400000);
    if (age >= 0 && age < days) counts[days - 1 - age] += 1;
  });
  return counts;
}

export function Sparkline({ data, width = 96, height = 28, stroke, fill }: {
  data: number[]; width?: number; height?: number; stroke: string; fill?: string;
}) {
  const max = Math.max(1, ...data);
  const step = width / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 6)).toFixed(1)}`);
  return (
    <svg width={width} height={height} aria-hidden style={{ display: "block" }}>
      {fill && (
        <polygon points={`0,${height} ${pts.join(" ")} ${width},${height}`} fill={fill} />
      )}
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

export interface ProtoMapStyle {
  ocean: string;
  land: string;
  landBorder: string;
  ramp: string[];          // low → high activity
  graticule?: string;      // color, omit for none
  marker?: string;         // crosshair/dot color for active countries, omit for none
}

export function ProtoMap({ rows, style, height = 340 }: {
  rows: MapRow[]; style: ProtoMapStyle; height?: number;
}) {
  const { features, path, graticulePath, centroids } = useMemo(() => {
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
    return {
      features: fc.features,
      path: p,
      graticulePath: p(geoGraticule10()),
      centroids: cents,
    };
  }, []);

  const byIso = useMemo(() => {
    const m = new Map<string, MapRow>();
    rows.forEach((r) => r.iso_numeric && m.set(r.iso_numeric.padStart(3, "0"), r));
    return m;
  }, [rows]);
  const max = Math.max(1, ...rows.map((r) => r.regulations));

  const color = (v: number) => {
    if (v <= 0) return style.land;
    const idx = Math.min(style.ramp.length - 1, Math.floor((v / max) * style.ramp.length));
    return style.ramp[Math.max(0, idx)];
  };

  return (
    <svg viewBox="40 10 690 350" role="img" aria-label="Global regulatory activity"
      style={{ width: "100%", height, display: "block", background: style.ocean }}>
      {style.graticule && graticulePath && (
        <path d={graticulePath} fill="none" stroke={style.graticule} strokeWidth={0.4} />
      )}
      {features.map((f) => {
        const iso = String(f.id ?? "").padStart(3, "0");
        const row = byIso.get(iso);
        return (
          <path key={iso + (f.properties?.name ?? "")} d={path(f) ?? undefined}
            fill={color(row?.regulations ?? 0)} stroke={style.landBorder} strokeWidth={0.5}>
            <title>{row ? `${row.name}: ${row.regulations} tracked regulations` : (f.properties?.name as string)}</title>
          </path>
        );
      })}
      {style.marker &&
        rows.filter((r) => r.regulations > 0 && r.iso_numeric).map((r) => {
          const c = centroids.get(r.iso_numeric!.padStart(3, "0"));
          if (!c) return null;
          return (
            <g key={r.code} stroke={style.marker} strokeWidth={0.8} opacity={0.9}>
              <line x1={c[0] - 5} y1={c[1]} x2={c[0] - 2} y2={c[1]} />
              <line x1={c[0] + 2} y1={c[1]} x2={c[0] + 5} y2={c[1]} />
              <line x1={c[0]} y1={c[1] - 5} x2={c[0]} y2={c[1] - 2} />
              <line x1={c[0]} y1={c[1] + 2} x2={c[0]} y2={c[1] + 5} />
            </g>
          );
        })}
    </svg>
  );
}

export const fmtTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
};

export const fmtDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const rel = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
