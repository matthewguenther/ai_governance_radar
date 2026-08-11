/** Entity detail: full regulation/standard record + timeline + linked evidence items. */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { ConfidenceBadge, DemoBadge, StatusPill } from "../components/ui/Badge";
import { FlagChip } from "../components/ui/FlagChip";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { WatchButton } from "../components/ui/WatchButton";
import { useEntity, useItems } from "../lib/api";
import { shortDate, titleCase, verificationAgeDays } from "../lib/format";
import type { ItemOut } from "../lib/types";

const STALE_DAYS = 90;

export default function EntityDetail() {
  const { slug } = useParams();
  const entity = useEntity(slug);
  const items = useItems({ entity_id: entity.data?.id, limit: 10, sort: "first_seen" });
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  if (entity.isPending) return <div className="card"><CardSkeleton rows={6} /></div>;
  if (entity.isError)
    return (
      <div className="card">
        <ErrorState title="Entity not found" detail={String(entity.error)} onRetry={() => entity.refetch()} />
      </div>
    );

  const e = entity.data;
  const reg = e.regulation;
  const std = e.standard;
  const verifiedAge = reg ? verificationAgeDays(reg.last_verified_at) : null;

  return (
    <>
      <Link
        to={e.entity_type === "regulation" ? "/regulatory" : "/standards"}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-tx-muted hover:text-tx-secondary"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {e.jurisdiction_code && (
              <FlagChip code={e.jurisdiction_code} size={22} title={e.jurisdiction_code} />
            )}
            <span className="meta-label">{titleCase(e.entity_type)}</span>
            {e.jurisdiction_code && <span className="meta-label">{e.jurisdiction_code}</span>}
            {reg && <StatusPill status={reg.status} kind="regulation" />}
            {std && <StatusPill status={std.status} kind="standard" />}
            <DemoBadge show={e.is_demo} />
            {e.needs_review && (
              <span className="rounded border border-sev-watch/40 bg-sev-watch/10 px-1.5 py-[1px] font-mono text-meta text-sev-watch">
                NEEDS REVIEW
              </span>
            )}
          </div>
          <h1 className="mt-2 text-xl font-semibold text-tx-primary">{e.name}</h1>
          {e.description && <p className="mt-1 max-w-2xl text-sm text-tx-secondary">{e.description}</p>}
        </div>
        <WatchButton targetType="entity" targetKey={e.slug} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <aside className="card h-fit space-y-4 p-4 lg:order-2">
          {reg && (
            <>
              <div>
                <h2 className="meta-label mb-2">Regulation record</h2>
                <dl className="space-y-1.5 text-xs">
                  {[
                    ["Government level", titleCase(reg.government_level)],
                    ["Status", reg.status_label ?? titleCase(reg.status)],
                    ["Introduced", shortDate(reg.introduced_at)],
                    ["Passed", shortDate(reg.passed_at)],
                    ["Signed", shortDate(reg.signed_at)],
                    ["Effective", shortDate(reg.effective_at)],
                    ["Compliance deadline", shortDate(reg.compliance_deadline)],
                    ["Last amended", shortDate(reg.last_amended_at)],
                    ["Enforcement", reg.enforcement_authority ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-tx-muted">{k}</dt>
                      <dd className="text-right text-tx-secondary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {reg.penalties && (
                <div>
                  <h3 className="meta-label mb-1">Penalties</h3>
                  <p className="text-xs text-tx-secondary">{reg.penalties}</p>
                </div>
              )}
              {reg.covered_entities && (
                <div>
                  <h3 className="meta-label mb-1">Covered entities</h3>
                  <p className="text-xs text-tx-secondary">{reg.covered_entities}</p>
                </div>
              )}
              <div className="border-t border-bd-subtle pt-3">
                <div className="flex items-center justify-between">
                  <ConfidenceBadge confidence={reg.confidence} />
                  <span
                    className={`font-mono text-meta ${
                      verifiedAge !== null && verifiedAge > STALE_DAYS ? "text-sev-watch" : "text-tx-muted"
                    }`}
                    title="Structured legal fields are human-verified against the official source"
                  >
                    Verified {shortDate(reg.last_verified_at)}
                    {verifiedAge !== null && verifiedAge > STALE_DAYS && " — may be stale"}
                  </span>
                </div>
                <a
                  href={reg.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  Official source <ExternalLink aria-hidden className="h-3 w-3" />
                </a>
                {reg.applicability_notes && (
                  <p className="mt-2 text-meta text-tx-muted">{reg.applicability_notes}</p>
                )}
              </div>
            </>
          )}

          {std && (
            <>
              <div>
                <h2 className="meta-label mb-2">Standard record</h2>
                <dl className="space-y-1.5 text-xs">
                  {[
                    ["Publisher", std.publisher],
                    ["Version", std.version ?? "—"],
                    ["Status", titleCase(std.status)],
                    ["Published", shortDate(std.published_at)],
                    ["Last updated", shortDate(std.last_updated_at)],
                    ["Change magnitude", std.change_magnitude ? titleCase(std.change_magnitude) : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-tx-muted">{k}</dt>
                      <dd className="text-right text-tx-secondary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {std.related_framework_slugs.length > 0 && (
                <div>
                  <h3 className="meta-label mb-1">Related frameworks</h3>
                  <ul className="space-y-1">
                    {std.related_framework_slugs.map((s) => (
                      <li key={s}>
                        <Link to={`/entities/${s}`} className="text-xs text-accent hover:underline">
                          {s.replace(/-/g, " ").toUpperCase()}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <a
                href={std.official_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border-t border-bd-subtle pt-3 text-xs text-accent hover:underline"
              >
                Official source <ExternalLink aria-hidden className="h-3 w-3" />
              </a>
            </>
          )}

          {!reg && !std && e.official_url && (
            <a
              href={e.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Official source <ExternalLink aria-hidden className="h-3 w-3" />
            </a>
          )}
        </aside>

        <div className="space-y-4 lg:col-span-2 lg:order-1">
          {/* Timeline (§5.3) */}
          <section className="card p-5">
            <h2 className="meta-label mb-4 !text-tx-secondary">Timeline — what changed</h2>
            {e.events.length === 0 ? (
              <EmptyState title="No recorded events yet" detail="Changes to this entity will appear here." />
            ) : (
              <ol className="relative space-y-5 border-l border-bd-strong pl-5">
                {e.events.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span
                      aria-hidden
                      className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-bg-surface ${
                        ev.event_type === "status_change" ? "bg-sev-critical" : "bg-accent"
                      }`}
                    />
                    <p className="font-mono text-meta text-tx-muted">{shortDate(ev.occurred_at)}</p>
                    <p className="mt-0.5 text-sm text-tx-primary">
                      <span className="meta-label mr-2">{titleCase(ev.event_type)}</span>
                      {ev.previous_value && ev.new_value && (
                        <span className="font-mono text-xs text-tx-secondary">
                          {ev.previous_value} → {ev.new_value}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-tx-secondary">{ev.summary}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Linked evidence items */}
          <section className="card overflow-hidden">
            <header className="border-b border-bd-subtle px-4 py-2.5">
              <h2 className="meta-label !text-tx-secondary">Related intelligence</h2>
            </header>
            {items.isPending ? (
              <CardSkeleton rows={2} />
            ) : items.data && items.data.items.length > 0 ? (
              items.data.items.map((item) => <ItemRow key={item.id} item={item} onOpen={setOpenItem} />)
            ) : (
              <EmptyState title="No linked items yet" detail="Ingested items mentioning this entity will appear here." />
            )}
          </section>
        </div>
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
