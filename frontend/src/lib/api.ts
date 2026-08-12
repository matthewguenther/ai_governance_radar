/** Typed API client. All server state flows through TanStack Query hooks below. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DashboardSummary,
  EntityOut,
  IncidentOut,
  ItemOut,
  JurisdictionOut,
  MapRow,
  PageOut,
  SearchOut,
  SourceOut,
  SourceRunOut,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type ItemFilters = {
  category?: string;
  jurisdiction?: string;
  min_impact?: number;
  confidence?: string;
  source_id?: number;
  entity_id?: number;
  include_demo?: boolean;
  collapse_clusters?: boolean;
  sort?: "impact" | "newest" | "first_seen";
  offset?: number;
  limit?: number;
};

function qs(params: Record<string, unknown>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/* ---------------- queries ---------------- */

export const useItems = (filters: ItemFilters) =>
  useQuery({
    queryKey: ["items", filters],
    queryFn: () => request<PageOut>(`/items${qs(filters)}`),
  });

export const useItem = (id: number | null) =>
  useQuery({
    queryKey: ["item", id],
    queryFn: () => request<ItemOut>(`/items/${id}`),
    enabled: id !== null,
  });

export const useClusterMembers = (id: number | null) =>
  useQuery({
    queryKey: ["cluster", id],
    queryFn: () => request<ItemOut[]>(`/items/${id}/cluster`),
    enabled: id !== null,
  });

export const useRegulations = (filters: { country?: string; status?: string; jurisdiction?: string } = {}) =>
  useQuery({
    queryKey: ["regulations", filters],
    queryFn: () => request<EntityOut[]>(`/regulations${qs(filters)}`),
  });

export const useStandards = (
  filters: { publisher?: string; status?: string; country?: string } = {},
) =>
  useQuery({
    queryKey: ["standards", filters],
    queryFn: () => request<EntityOut[]>(`/standards${qs(filters)}`),
  });

export const useEntity = (slug: string | undefined) =>
  useQuery({
    queryKey: ["entity", slug],
    queryFn: () => request<EntityOut>(`/entities/${slug}`),
    enabled: !!slug,
  });

export const useIncidents = (
  filters: { severity?: string; category?: string; sort?: "newest" | "severity" } = {},
) =>
  useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => request<IncidentOut[]>(`/incidents${qs(filters)}`),
  });

export const useIncident = (id: string | undefined) =>
  useQuery({
    queryKey: ["incident", id],
    queryFn: () => request<IncidentOut>(`/incidents/${id}`),
    enabled: !!id,
  });

export const useDashboardSummary = (windowDays?: number) =>
  useQuery({
    queryKey: ["summary", windowDays],
    queryFn: () => request<DashboardSummary>(`/dashboard/summary${qs({ window_days: windowDays })}`),
  });

export const useMapData = () =>
  useQuery({ queryKey: ["map"], queryFn: () => request<MapRow[]>("/dashboard/map") });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ["search", q],
    queryFn: () => request<SearchOut>(`/search${qs({ q })}`),
    enabled: q.trim().length > 0,
  });

export const useSources = () =>
  useQuery({ queryKey: ["sources"], queryFn: () => request<SourceOut[]>("/sources") });

export const useSourceRuns = (sourceId: number | null) =>
  useQuery({
    queryKey: ["source-runs", sourceId],
    queryFn: () => request<SourceRunOut[]>(`/sources/${sourceId}/runs`),
    enabled: sourceId !== null,
  });

export const useJurisdictions = () =>
  useQuery({
    queryKey: ["jurisdictions"],
    queryFn: () => request<JurisdictionOut[]>("/jurisdictions"),
    staleTime: Infinity,
  });

/* ---------------- mutations ---------------- */

export function usePatchSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; enabled?: boolean; polling_interval_minutes?: number }) =>
      request<SourceOut>(`/sources/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      request<SourceOut>("/sources", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useIngestNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceId?: number) =>
      request<SourceRunOut[]>(`/ingest${qs({ source_id: sourceId })}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export const exportConfig = () => request<Record<string, unknown>>("/export");

export function useImportConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      request<{ watches_added: number; sources_updated: number }>("/import", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
}
