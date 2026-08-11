/** Grouped search results (§28). */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { PageHeader } from "../components/layout/PageHeader";
import { SeverityBadge, StatusPill } from "../components/ui/Badge";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useSearch } from "../lib/api";
import { titleCase } from "../lib/format";
import type { ItemOut } from "../lib/types";

const GROUP_ORDER = ["regulation", "standard", "incident", "security", "news", "event", "training", "research", "ranking"];
const GROUP_LABELS: Record<string, string> = {
  regulation: "REGULATIONS", standard: "STANDARDS", incident: "INCIDENTS",
  security: "SECURITY", news: "NEWS", event: "EVENTS", training: "TRAINING",
  research: "RESEARCH", ranking: "RANKINGS",
};

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const search = useSearch(q);
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  if (!q) {
    return (
      <div className="card">
        <EmptyState title="Type a query in the search bar" detail="Search spans items, entities, and incidents." />
      </div>
    );
  }
  if (search.isPending) return <div className="card"><CardSkeleton rows={6} /></div>;
  if (search.isError)
    return <div className="card"><ErrorState detail={String(search.error)} onRetry={() => search.refetch()} /></div>;

  const { items, entities, incidents } = search.data;
  const grouped = GROUP_ORDER.map((g) => ({
    key: g,
    items: items.filter((i) => (i.categories[0] ?? "news") === g),
  })).filter((g) => g.items.length > 0);

  const total = items.length + entities.length + incidents.length;

  return (
    <>
      <PageHeader title={`Search: “${q}”`} detail={`${total} results`} />

      {total === 0 ? (
        <div className="card">
          <EmptyState
            title="No results"
            detail="Try fewer or different terms — search covers titles, excerpts, entities, jurisdictions, and incidents."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {entities.length > 0 && (
            <section className="card overflow-hidden">
              <header className="border-b border-bd-subtle px-4 py-2.5">
                <h2 className="meta-label !text-tx-secondary">Tracked entities</h2>
              </header>
              <ul>
                {entities.map((e) => (
                  <li key={e.slug} className="border-b border-bd-subtle last:border-b-0">
                    <Link
                      to={`/entities/${e.slug}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bg-raised/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-tx-primary">{e.name}</p>
                        <p className="mt-0.5 text-meta text-tx-muted">
                          {titleCase(e.entity_type)}{e.jurisdiction_code ? ` · ${e.jurisdiction_code}` : ""}
                        </p>
                      </div>
                      {e.current_status && (
                        <StatusPill
                          status={e.current_status}
                          kind={e.entity_type === "regulation" ? "regulation" : "standard"}
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {incidents.length > 0 && (
            <section className="card overflow-hidden">
              <header className="border-b border-bd-subtle px-4 py-2.5">
                <h2 className="meta-label !text-tx-secondary">Incidents</h2>
              </header>
              <ul>
                {incidents.map((inc) => (
                  <li key={inc.id} className="border-b border-bd-subtle last:border-b-0">
                    <Link to={`/incidents/${inc.id}`} className="block px-4 py-3 transition-colors hover:bg-bg-raised/50">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={inc.severity} />
                        <p className="text-sm font-medium text-tx-primary">{inc.title}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {grouped.map((g) => (
            <section key={g.key} className="card overflow-hidden">
              <header className="border-b border-bd-subtle px-4 py-2.5">
                <h2 className="meta-label !text-tx-secondary">{GROUP_LABELS[g.key]}</h2>
              </header>
              {g.items.map((item) => <ItemRow key={item.id} item={item} onOpen={setOpenItem} />)}
            </section>
          ))}
        </div>
      )}

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
