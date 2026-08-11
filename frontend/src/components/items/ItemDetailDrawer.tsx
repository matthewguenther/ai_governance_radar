/** Item intelligence view (§26): what happened, why it matters (impact factors),
 * related entities, evidence, confidence, attribution. Slide-over drawer. */

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import { useClusterMembers } from "../../lib/api";
import { categoryLabel, relativeTime } from "../../lib/format";
import type { ItemOut } from "../../lib/types";
import { ConfidenceBadge, DemoBadge, FactStatusBadge, ImpactBadge } from "../ui/Badge";
import { SourceAttribution } from "../ui/SourceAttribution";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="meta-label">{label}</h3>
      {children}
    </section>
  );
}

export function ItemDetailDrawer({ item, onClose }: { item: ItemOut | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: cluster } = useClusterMembers(item && item.cluster_size > 1 ? item.id : null);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Item detail">
      <button aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-bd-subtle bg-bg-surface p-5 shadow-card outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <ImpactBadge score={item.impact_score} />
            <ConfidenceBadge confidence={item.confidence} />
            <FactStatusBadge status={item.fact_status} />
            <DemoBadge show={item.is_demo} />
          </div>
          <button
            onClick={onClose}
            aria-label="Close detail"
            className="rounded-ctl border border-bd-strong p-1 text-tx-muted transition-colors hover:text-tx-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 text-lg font-semibold text-tx-primary">{item.title}</h2>
        <div className="mt-2">
          <SourceAttribution
            sourceName={item.source_name}
            tier={item.source_tier}
            publishedAt={item.published_at}
            retrievedAt={item.first_seen_at}
            url={item.url}
          />
        </div>

        <div className="mt-5 space-y-5">
          {item.excerpt && (
            <Section label="What happened">
              <p className="text-sm text-tx-secondary">{item.excerpt}</p>
            </Section>
          )}

          {item.impact_factors.length > 0 && (
            <Section label="Why this impact score">
              <ul className="space-y-1">
                {item.impact_factors.map((f) => (
                  <li key={f.factor} className="flex justify-between gap-3 text-xs">
                    <span className="text-tx-secondary">+ {f.factor}</span>
                    <span className="font-mono text-tx-muted">{f.points}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 border-t border-bd-subtle pt-1 text-xs font-medium">
                  <span className="text-tx-primary">Impact score</span>
                  <span className="font-mono text-tx-primary">{item.impact_score}/100</span>
                </li>
              </ul>
            </Section>
          )}

          <Section label="Classification">
            <div className="flex flex-wrap gap-1.5">
              {item.categories.map((c) => (
                <span key={c} className="rounded border border-bd-strong px-2 py-0.5 text-xs text-tx-secondary">
                  {categoryLabel(c)}
                </span>
              ))}
              {item.jurisdiction_code && (
                <span className="rounded border border-bd-strong px-2 py-0.5 font-mono text-xs text-tx-secondary">
                  {item.jurisdiction_code}
                </span>
              )}
              {item.change_type && (
                <span className="rounded border border-bd-strong px-2 py-0.5 text-xs text-tx-secondary">
                  {item.change_type.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </Section>

          {item.entities.length > 0 && (
            <Section label="Related tracked entities">
              <ul className="space-y-1">
                {item.entities.map((e) => (
                  <li key={e.slug}>
                    <Link
                      to={`/entities/${e.slug}`}
                      onClick={onClose}
                      className="text-sm text-accent hover:underline"
                    >
                      {e.name}
                    </Link>
                    {e.current_status && (
                      <span className="ml-2 meta-label">{e.current_status.replace(/_/g, " ")}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {cluster && cluster.length > 1 && (
            <Section label={`Coverage — ${cluster.length} sources`}>
              <ul className="space-y-1.5">
                {cluster.map((m) => (
                  <li key={m.id} className="text-xs">
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {m.source_name}
                    </a>
                    <span className="ml-2 text-tx-muted">T{m.source_tier} · {relativeTime(m.first_seen_at)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-meta text-tx-muted">Highest-tier source is treated as primary evidence.</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
