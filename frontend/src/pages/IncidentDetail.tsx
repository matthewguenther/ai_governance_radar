/** Incident detail (§24) — security-intelligence-report layout. */

import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ConfidenceBadge, DemoBadge, FactStatusBadge, SeverityBadge } from "../components/ui/Badge";
import { CardSkeleton, ErrorState } from "../components/ui/States";
import { useIncident } from "../lib/api";
import { shortDate, titleCase } from "../lib/format";

function Block({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <section>
      <h2 className="meta-label">{label}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-tx-secondary">{text}</p>
    </section>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const incident = useIncident(id);

  if (incident.isPending) return <div className="card"><CardSkeleton rows={6} /></div>;
  if (incident.isError)
    return (
      <div className="card">
        <ErrorState
          title="Incident not found"
          detail={String(incident.error)}
          onRetry={() => incident.refetch()}
        />
      </div>
    );

  const inc = incident.data;
  return (
    <>
      <Link to="/incidents" className="mb-4 inline-flex items-center gap-1.5 text-xs text-tx-muted hover:text-tx-secondary">
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> All incidents
      </Link>

      <div className="flex flex-wrap items-center gap-1.5">
        <SeverityBadge severity={inc.severity} />
        <FactStatusBadge status={inc.fact_status} />
        <ConfidenceBadge confidence={inc.confidence} />
        <DemoBadge show={inc.is_demo} />
      </div>
      <h1 className="mt-2 max-w-3xl text-xl font-semibold text-tx-primary">{inc.title}</h1>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Metadata panel */}
        <aside className="card h-fit p-4 lg:order-2">
          <h2 className="meta-label mb-3">Metadata</h2>
          <dl className="space-y-2 text-xs">
            {[
              ["Occurred", shortDate(inc.occurred_at)],
              ["Reported", shortDate(inc.reported_at)],
              ["Category", titleCase(inc.category)],
              ["System / vendor", inc.system_vendor ?? "—"],
              ["System type", inc.system_type ?? "—"],
              ["Geography", inc.geography ?? "—"],
              ["Affected domain", inc.affected_domain ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-tx-muted">{k}</dt>
                <dd className="text-right text-tx-secondary">{v}</dd>
              </div>
            ))}
          </dl>

          {inc.related_framework_slugs.length > 0 && (
            <>
              <h2 className="meta-label mb-2 mt-5">Related frameworks</h2>
              <ul className="space-y-1">
                {inc.related_framework_slugs.map((slug) => (
                  <li key={slug}>
                    <Link to={`/entities/${slug}`} className="text-xs text-accent hover:underline">
                      {slug.replace(/-/g, " ").toUpperCase()}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="meta-label mb-2 mt-5">Source evidence</h2>
          {inc.source_links.length === 0 ? (
            <p className="text-xs text-tx-muted">No sources recorded.</p>
          ) : (
            <ul className="space-y-1.5">
              {inc.source_links.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 text-xs text-accent hover:underline"
                  >
                    <ExternalLink aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Report body */}
        <div className="card space-y-5 p-5 lg:col-span-2 lg:order-1">
          <Block label="What happened" text={inc.what_happened} />
          <Block label="Root cause" text={inc.root_cause} />
          <Block label="Governance relevance" text={inc.governance_relevance} />
          <Block label="Security relevance" text={inc.security_relevance} />
          <Block label="Mitigation / lessons" text={inc.mitigation} />
        </div>
      </div>
    </>
  );
}
