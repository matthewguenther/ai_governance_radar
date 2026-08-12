/** Standards & Frameworks (§23): publisher tabs, at-a-glance strip, update cards. */

import { useSearchParams, Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

import { PageHeader } from "../components/layout/PageHeader";
import { DemoBadge, StatusPill } from "../components/ui/Badge";
import { OrgAvatar } from "../components/ui/OrgAvatar";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useStandards } from "../lib/api";
import { shortDate, titleCase } from "../lib/format";

const TABS = ["All", "NIST", "ISO", "OWASP", "MITRE", "Other"];

export default function Standards() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("publisher") ?? "All";
  const all = useStandards();

  const filtered = all.data?.filter((e) => {
    if (tab === "All") return true;
    if (tab === "Other") return !["NIST", "ISO", "OWASP", "MITRE"].includes(e.standard?.publisher ?? "");
    return e.standard?.publisher === tab;
  });

  const glance = (status: string) =>
    all.data?.filter((e) => e.standard?.status === status).length ?? 0;

  return (
    <>
      <PageHeader
        title="Standards & Frameworks"
        detail="Lifecycle tracking for AI governance standards — curated records with official sources."
      />

      {/* At a glance (§23) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["final", "Final"],
          ["updated", "Updated"],
          ["draft", "Draft"],
          ["public_comment", "Public comment"],
          ["withdrawn", "Withdrawn"],
        ].map(([key, label]) => (
          <div key={key} className="card flex items-center gap-2 px-3 py-2">
            <span className="font-mono text-lg font-medium tabular-nums text-tx-primary">{glance(key)}</span>
            <span className="meta-label">{label}</span>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Publisher" className="mb-4 flex flex-wrap gap-1 border-b border-bd-subtle">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setParams(t === "All" ? {} : { publisher: t }, { replace: true })}
            className={`border-b-2 px-3 py-2 text-xs transition-colors ${
              tab === t
                ? "border-accent text-tx-primary"
                : "border-transparent text-tx-muted hover:text-tx-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {all.isPending ? (
        <div className="card"><CardSkeleton rows={5} /></div>
      ) : all.isError ? (
        <div className="card"><ErrorState detail={String(all.error)} onRetry={() => all.refetch()} /></div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="card">
          <EmptyState title={`No ${tab} standards tracked`} detail="Try another publisher tab." />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const s = e.standard!;
            return (
              <article key={e.slug} className="card hover-card flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <OrgAvatar name={`${s.publisher} ${e.name}`} size={24} />
                    <span className="meta-label">{s.publisher}</span>
                  </span>
                  <StatusPill status={s.status} kind="standard" />
                </div>
                <Link to={`/entities/${e.slug}`} className="mt-1.5 text-sm font-semibold text-tx-primary hover:text-accent">
                  {e.name}
                </Link>
                <DemoBadge show={e.is_demo} />
                <p className="mt-1 line-clamp-3 flex-1 text-xs text-tx-secondary">{e.description}</p>
                <dl className="mt-3 space-y-1 text-xs">
                  {s.version && (
                    <div className="flex justify-between">
                      <dt className="text-tx-muted">Version</dt>
                      <dd className="font-mono text-tx-secondary">{s.version}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-tx-muted">Published</dt>
                    <dd className="text-tx-secondary">{shortDate(s.published_at)}</dd>
                  </div>
                  {s.last_updated_at && (
                    <div className="flex justify-between">
                      <dt className="text-tx-muted">Last updated</dt>
                      <dd className="text-tx-secondary">{shortDate(s.last_updated_at)}</dd>
                    </div>
                  )}
                  {s.change_magnitude && (
                    <div className="flex justify-between">
                      <dt className="text-tx-muted">Change magnitude</dt>
                      <dd className="text-tx-secondary">{titleCase(s.change_magnitude)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-bd-subtle pt-3">
                  <a
                    href={s.official_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    Official source <ExternalLink aria-hidden className="h-3 w-3" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
