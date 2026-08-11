/** Incidents list (§9) with severity/category filters. */

import { Link, useSearchParams } from "react-router-dom";

import { PageHeader } from "../components/layout/PageHeader";
import { ConfidenceBadge, DemoBadge, FactStatusBadge, SeverityBadge } from "../components/ui/Badge";
import { IncidentIcon } from "../components/ui/IncidentIcon";
import { severityColor } from "../lib/tokens";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useIncidents } from "../lib/api";
import { relativeTime, titleCase } from "../lib/format";

const SEVERITIES = ["critical", "high", "medium", "low"];
const CATEGORIES = [
  "prompt_injection", "data_leakage", "bias_discrimination", "deepfake_abuse",
  "hallucination_harm", "excessive_agency", "agent_failure", "model_theft",
  "data_poisoning", "ai_cyberattack", "privacy", "other",
];

export default function Incidents() {
  const [params, setParams] = useSearchParams();
  const severity = params.get("severity") ?? "";
  const category = params.get("category") ?? "";
  const incidents = useIncidents({ severity: severity || undefined, category: category || undefined });

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
        detail="Curated AI incident intelligence. Fact status is always labeled; details are never fabricated."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Severity</span>
          <select
            value={severity}
            onChange={(e) => setFilter("severity", e.target.value)}
            className="rounded-ctl border border-bd-subtle bg-bg-surface px-2 py-1.5 text-xs text-tx-primary"
          >
            <option value="">All</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-tx-secondary">
          <span className="meta-label">Category</span>
          <select
            value={category}
            onChange={(e) => setFilter("category", e.target.value)}
            className="rounded-ctl border border-bd-subtle bg-bg-surface px-2 py-1.5 text-xs text-tx-primary"
          >
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
    </>
  );
}
