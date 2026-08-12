/** Regulatory Radar (§22): dense table + timeline views, filters, provenance. */

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { PageHeader } from "../components/layout/PageHeader";
import { ConfidenceBadge, DemoBadge, StatusPill } from "../components/ui/Badge";
import { FlagChip } from "../components/ui/FlagChip";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useJurisdictions, useRegulations } from "../lib/api";
import { shortDate, titleCase } from "../lib/format";

const STATUSES = ["proposed", "introduced", "passed", "signed", "effective", "amended", "enforcement"];

export default function Regulations() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"table" | "timeline">("table");
  const country = params.get("country") ?? "";
  const status = params.get("status") ?? "";
  const regs = useRegulations({ country: country || undefined, status: status || undefined });
  const jurisdictions = useJurisdictions();

  const countries = useMemo(() => {
    const set = new Set<string>();
    jurisdictions.data?.forEach((j) => {
      if (j.kind === "country" || j.kind === "supranational") set.add(j.code);
    });
    return [...set].sort();
  }, [jurisdictions.data]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const timeline = useMemo(() => {
    if (!regs.data) return [];
    return regs.data
      .flatMap((e) => e.events.map((ev) => ({ entity: e, event: ev })))
      .sort((a, b) => b.event.occurred_at.localeCompare(a.event.occurred_at));
  }, [regs.data]);

  return (
    <>
      <PageHeader
        title="Regulatory Radar"
        detail="Curated regulation records grounded in official sources — never auto-written by ingestion."
        actions={
          <div className="flex rounded-ctl border border-bd-subtle" role="tablist" aria-label="View">
            {(["table", "timeline"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  view === v ? "bg-bg-raised text-tx-primary" : "text-tx-muted hover:text-tx-secondary"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Jurisdiction</span>
          <select
            value={country}
            onChange={(e) => setFilter("country", e.target.value)}
            className="rounded-ctl border border-bd-subtle bg-bg-surface px-2 py-1.5 text-xs text-tx-primary"
          >
            <option value="">All</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {jurisdictions.data?.find((j) => j.code === c)?.name ?? c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Status</span>
          <select
            value={status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-ctl border border-bd-subtle bg-bg-surface px-2 py-1.5 text-xs text-tx-primary"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </select>
        </label>
      </div>

      {regs.isPending ? (
        <div className="card"><CardSkeleton rows={5} /></div>
      ) : regs.isError ? (
        <div className="card"><ErrorState detail={String(regs.error)} onRetry={() => regs.refetch()} /></div>
      ) : regs.data.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No regulations match these filters"
            detail="Your selected jurisdiction/status combination has no tracked regulations."
            action={
              <button onClick={() => setParams({}, { replace: true })} className="text-xs text-accent hover:underline">
                Clear filters
              </button>
            }
          />
        </div>
      ) : view === "table" ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-bd-strong bg-bg-raised/60 text-left">
                {["Jurisdiction", "Regulation", "Status", "Last update", "Effective", "Confidence"].map((h) => (
                  <th key={h} className="meta-label whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regs.data.map((e) => {
                const r = e.regulation!;
                const lastUpdate = r.last_amended_at ?? r.signed_at ?? r.passed_at ?? r.introduced_at;
                return (
                  <tr key={e.slug} className="border-b border-bd-subtle transition-colors last:border-b-0 hover:bg-bg-raised/40">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="flex items-center gap-2 font-mono text-xs text-tx-secondary">
                        <FlagChip code={e.jurisdiction_code ?? "GLOBAL"} size={20} title={e.jurisdiction_code ?? undefined} />
                        {e.jurisdiction_code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link to={`/entities/${e.slug}`} className="font-medium text-tx-primary hover:text-accent">
                        {e.name}
                      </Link>
                      <DemoBadge show={e.is_demo} />
                      <p className="mt-0.5 text-meta text-tx-muted">{titleCase(r.government_level)}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5"><StatusPill status={r.status} kind="regulation" /></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-tx-secondary">{shortDate(lastUpdate)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-tx-secondary">{shortDate(r.effective_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5"><ConfidenceBadge confidence={r.confidence} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-5">
          {timeline.length === 0 ? (
            <EmptyState title="No regulatory events" />
          ) : (
            <ol className="relative space-y-5 border-l border-bd-strong pl-5">
              {timeline.map(({ entity, event }) => (
                <li key={`${entity.slug}-${event.id}`} className="relative">
                  <span aria-hidden className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-bg-surface bg-accent" />
                  <p className="font-mono text-meta text-tx-muted">{shortDate(event.occurred_at)}</p>
                  <p className="mt-0.5 text-sm">
                    <Link to={`/entities/${entity.slug}`} className="font-medium text-tx-primary hover:text-accent">
                      {entity.name}
                    </Link>
                    <span className="ml-2 meta-label">{titleCase(event.event_type)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-tx-secondary">{event.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
