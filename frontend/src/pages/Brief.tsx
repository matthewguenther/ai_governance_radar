/** Morning Brief (§25) — deterministic aggregation, no LLM. */

import { useState } from "react";
import { Link } from "react-router-dom";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { PageHeader } from "../components/layout/PageHeader";
import { Pill, SeverityBadge } from "../components/ui/Badge";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useBrief } from "../lib/api";
import { categoryLabel, longDate, relativeTime, shortDate } from "../lib/format";
import type { ItemOut } from "../lib/types";

export default function Brief() {
  const brief = useBrief();
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  if (brief.isPending) return <div className="card"><CardSkeleton rows={8} /></div>;
  if (brief.isError)
    return <div className="card"><ErrorState detail={String(brief.error)} onRetry={() => brief.refetch()} /></div>;

  const b = brief.data;
  const countRows = Object.entries(b.counts).filter(([, v]) => v > 0);

  return (
    <>
      <PageHeader
        title="AI Governance Morning Brief"
        detail={`${longDate(b.generated_at)} · covering changes since ${shortDate(b.since)} · generated deterministically from stored data`}
      />

      <div className="space-y-4">
        <section className="card overflow-hidden">
          <header className="border-b border-bd-subtle px-4 py-2.5">
            <h2 className="meta-label !text-tx-secondary">
              {b.high_impact_items.length} High-Impact Development{b.high_impact_items.length !== 1 && "s"}
            </h2>
          </header>
          {b.high_impact_items.length === 0 ? (
            <EmptyState
              title="No high-impact developments since your last visit"
              detail="Quiet period — nothing crossed the high-impact threshold."
            />
          ) : (
            b.high_impact_items.map((item) => <ItemRow key={item.id} item={item} onOpen={setOpenItem} />)
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-4">
            <h2 className="meta-label mb-3 !text-tx-secondary">Activity by Domain</h2>
            {countRows.length === 0 ? (
              <p className="text-xs text-tx-muted">No new activity in this period.</p>
            ) : (
              <ul className="space-y-2">
                {countRows.map(([cat, count]) => (
                  <li key={cat}>
                    <Link
                      to={`/items?category=${cat}`}
                      className="flex items-center justify-between text-sm text-tx-secondary hover:text-tx-primary"
                    >
                      <span>{categoryLabel(cat)}</span>
                      <span className="font-mono tabular-nums text-tx-primary">{count}</span>
                    </Link>
                  </li>
                ))}
                <li className="flex items-center justify-between border-t border-bd-subtle pt-2 text-sm">
                  <span className="text-tx-secondary">Standards records updated</span>
                  <span className="font-mono tabular-nums text-tx-primary">{b.standards_updated}</span>
                </li>
              </ul>
            )}
          </section>

          <section className="card p-4">
            <h2 className="meta-label mb-3 !text-tx-secondary">Incidents</h2>
            {b.incidents.length === 0 ? (
              <p className="text-xs text-tx-muted">No new incident records in this period.</p>
            ) : (
              <ul className="space-y-2.5">
                {b.incidents.slice(0, 5).map((inc) => (
                  <li key={inc.id}>
                    <Link to={`/incidents/${inc.id}`} className="group block">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={inc.severity} />
                        <span className="font-mono text-meta text-tx-muted">{relativeTime(inc.reported_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-tx-secondary group-hover:text-tx-primary">
                        {inc.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="meta-label !text-tx-secondary">Watchlist</h2>
            <Link to="/watchlist" className="text-xs text-accent hover:underline">Open watchlist</Link>
          </div>
          <p className="mt-2 text-sm text-tx-secondary">
            <span className="font-mono text-tx-primary">{b.watchlist.watched}</span> watched ·{" "}
            <span className="font-mono text-tx-primary">{b.watchlist.changed}</span> changed since your last visit
          </p>
          {b.watchlist.entries.filter((e) => e.status !== "NO CHANGE").length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {b.watchlist.entries
                .filter((e) => e.status !== "NO CHANGE")
                .slice(0, 6)
                .map((e) => (
                  <li key={e.watch_id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-tx-secondary">{e.display_name}</span>
                    <Pill tone={e.status === "STATUS CHANGE" ? "critical" : "high"}>{e.status}</Pill>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
