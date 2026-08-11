/** Incidents & Risks (§9): recent reports from monitored sources (timeliness) plus
 * curated, analyzed incident records (depth). Default ordering is recency. */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { PageHeader } from "../components/layout/PageHeader";
import { ConfidenceBadge, DemoBadge, FactStatusBadge, SeverityBadge } from "../components/ui/Badge";
import { IncidentIcon } from "../components/ui/IncidentIcon";
import { InfoTip } from "../components/ui/InfoTip";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useIncidents, useItems } from "../lib/api";
import { CONFIDENCE_EXPLAINER, SEVERITY_DEFS } from "../lib/definitions";
import { relativeTime, titleCase } from "../lib/format";
import { severityColor } from "../lib/tokens";
import type { ItemOut } from "../lib/types";

const SEVERITIES = ["critical", "high", "medium", "low"];
const CATEGORIES = [
  "prompt_injection", "data_leakage", "bias_discrimination", "deepfake_abuse",
  "hallucination_harm", "excessive_agency", "agent_failure", "model_theft",
  "data_poisoning", "ai_cyberattack", "privacy", "other",
];

const select = "rounded-ctl border border-bd-subtle bg-bg-surface px-2 py-1.5 text-xs text-tx-primary";

function SeverityLegend() {
  return (
    <InfoTip
      align="right"
      content={
        <span className="space-y-1.5">
          <span className="block font-medium text-tx-primary">How severity is assigned</span>
          {SEVERITIES.map((s) => (
            <span key={s} className="block">
              <span className="font-semibold capitalize text-tx-primary">{s}:</span>{" "}
              {SEVERITY_DEFS[s].replace(/^[A-Z][a-z]+ — /, "")}
            </span>
          ))}
          <span className="block pt-1 text-tx-muted">{CONFIDENCE_EXPLAINER}</span>
        </span>
      }
    >
      <span className="cursor-help text-[11px] text-tx-muted underline decoration-dotted underline-offset-2 hover:text-tx-secondary">
        What do these ratings mean?
      </span>
    </InfoTip>
  );
}

export default function Incidents() {
  const [params, setParams] = useSearchParams();
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  const severity = params.get("severity") ?? "";
  const category = params.get("category") ?? "";
  const sort = (params.get("sort") ?? "newest") as "newest" | "severity";

  const incidents = useIncidents({
    severity: severity || undefined,
    category: category || undefined,
    sort,
  });
  const reports = useItems({
    category: "incident", sort: "newest", limit: 8, collapse_clusters: true,
  });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Incidents & Risks"
        detail="Live reports from monitored incident sources, plus analyzed incident records. Fact status is always labelled; details are never fabricated."
        actions={<SeverityLegend />}
      />

      {/* Recent reports — the timeliness half */}
      <section className="card mb-5">
        <header className="flex items-center justify-between border-b border-bd-subtle px-4 py-2.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-tx-primary">
            <span aria-hidden className="live-dot" />
            Recent incident reports
          </h2>
          <Link to="/items?category=incident" className="text-xs text-accent hover:underline">
            View all reports
          </Link>
        </header>
        {reports.isPending ? (
          <CardSkeleton rows={3} />
        ) : reports.isError ? (
          <ErrorState detail={String(reports.error)} onRetry={() => reports.refetch()} />
        ) : reports.data.items.length === 0 ? (
          <EmptyState
            title="No incident reports collected yet"
            detail="Enable the AI Incident Database source in Settings, then run ingestion."
          />
        ) : (
          reports.data.items.map((item) => (
            <ItemRow key={item.id} item={item} onOpen={setOpenItem} />
          ))
        )}
      </section>

      {/* Curated records — the depth half */}
      <h2 className="mb-2 text-sm font-semibold text-tx-primary">Analyzed incident records</h2>
      <p className="mb-3 text-xs text-tx-muted">
        Human-reviewed write-ups with governance and security analysis, mapped to frameworks.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Sort</span>
          <select value={sort} onChange={(e) => setFilter("sort", e.target.value)} className={select}>
            <option value="newest">Newest first</option>
            <option value="severity">Most severe first</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Severity</span>
          <select value={severity} onChange={(e) => setFilter("severity", e.target.value)} className={select}>
            <option value="">All</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Category</span>
          <select value={category} onChange={(e) => setFilter("category", e.target.value)} className={select}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>
      </div>

      {incidents.isPending ? (
        <div className="card"><CardSkeleton rows={5} /></div>
      ) : incidents.isError ? (
        <div className="card"><ErrorState detail={String(incidents.error)} onRetry={() => incidents.refetch()} /></div>
      ) : incidents.data.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No incidents match these filters"
            action={
              <button onClick={() => setParams({}, { replace: true })} className="text-xs text-accent hover:underline">
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {incidents.data.map((inc) => (
            <li key={inc.id}>
              <Link to={`/incidents/${inc.id}`} className="card hover-card flex gap-3.5 p-4">
                <IncidentIcon category={inc.category} tone={severityColor(inc.severity)} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={inc.severity} />
                    <FactStatusBadge status={inc.fact_status} />
                    <ConfidenceBadge confidence={inc.confidence} />
                    <DemoBadge show={inc.is_demo} />
                    <span className="ml-auto font-mono text-meta text-tx-muted">
                      {relativeTime(inc.reported_at)}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-tx-primary">{inc.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-tx-secondary">{inc.what_happened}</span>
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-meta text-tx-muted">
                    <span>{titleCase(inc.category)}</span>
                    {inc.system_vendor && <span>{inc.system_vendor}</span>}
                    {inc.geography && <span>{inc.geography}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
