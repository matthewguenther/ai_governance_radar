/** Intelligence Feed: filterable, paginated item browser (KPI click-through target). */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { PageHeader } from "../components/layout/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useItems, useSources } from "../lib/api";
import { categoryLabel } from "../lib/format";
import type { ItemOut } from "../lib/types";

const CATEGORIES = ["regulation", "standard", "incident", "security", "research", "news"];
const PAGE = 25;

export default function Items() {
  const [params, setParams] = useSearchParams();
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  const category = params.get("category") ?? "";
  const minImpact = params.get("min_impact") ?? "";
  const confidence = params.get("confidence") ?? "";
  const sourceId = params.get("source_id") ?? "";
  const jurisdiction = params.get("jurisdiction") ?? "";
  const sort = (params.get("sort") ?? "newest") as "newest" | "impact" | "first_seen";
  const includeDemo = params.get("include_demo") !== "false";
  const offset = Number(params.get("offset") ?? 0);

  const sources = useSources();
  const query = useItems({
    category: category || undefined,
    min_impact: minImpact ? Number(minImpact) : undefined,
    confidence: confidence || undefined,
    source_id: sourceId ? Number(sourceId) : undefined,
    jurisdiction: jurisdiction || undefined,
    include_demo: includeDemo,
    collapse_clusters: true,
    sort,
    offset,
    limit: PAGE,
  });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("offset");
    setParams(next, { replace: true });
  };

  const page = (dir: 1 | -1) => {
    const next = new URLSearchParams(params);
    const newOffset = Math.max(0, offset + dir * PAGE);
    if (newOffset) next.set("offset", String(newOffset));
    else next.delete("offset");
    setParams(next, { replace: true });
  };

  const select = "rounded-ctl border border-bd-subtle bg-bg-surface px-2 py-1.5 text-xs text-tx-primary";

  return (
    <>
      <PageHeader
        title="All Sources"
        detail="Everything collected from every monitored source, newest first — duplicates collapsed to their primary source."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="meta-label">Sort</span>
          <select value={sort} onChange={(e) => setFilter("sort", e.target.value)} className={select}>
            <option value="newest">Newest first</option>
            <option value="impact">Highest impact</option>
            <option value="first_seen">Recently collected</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="meta-label">Category</span>
          <select value={category} onChange={(e) => setFilter("category", e.target.value)} className={select}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="meta-label">Impact</span>
          <select value={minImpact} onChange={(e) => setFilter("min_impact", e.target.value)} className={select}>
            <option value="">Any</option>
            <option value="70">High (70+)</option>
            <option value="50">Elevated (50+)</option>
            <option value="30">Watch (30+)</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="meta-label">Confidence</span>
          <select value={confidence} onChange={(e) => setFilter("confidence", e.target.value)} className={select}>
            <option value="">Any</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="meta-label">Source</span>
          <select value={sourceId} onChange={(e) => setFilter("source_id", e.target.value)} className={select}>
            <option value="">All</option>
            {sources.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-tx-secondary">
          <input
            type="checkbox"
            checked={includeDemo}
            onChange={(e) => setFilter("include_demo", e.target.checked ? "" : "false")}
            className="accent-accent"
          />
          Include demo data
        </label>
      </div>

      <div className="card">
        {query.isPending ? (
          <CardSkeleton rows={6} />
        ) : query.isError ? (
          <ErrorState detail={String(query.error)} onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="No items match these filters"
            detail="Adjust filters, or run ingestion from Settings to collect fresh intelligence."
            action={
              <button onClick={() => setParams({}, { replace: true })} className="text-xs text-accent hover:underline">
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {query.data.items.map((item) => (
              <ItemRow key={item.id} item={item} onOpen={setOpenItem} />
            ))}
            <div className="flex items-center justify-between border-t border-bd-subtle px-4 py-2.5 text-xs text-tx-muted">
              <span>
                {offset + 1}–{Math.min(offset + PAGE, query.data.total)} of {query.data.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => page(-1)}
                  disabled={offset === 0}
                  className="rounded-ctl border border-bd-strong px-2.5 py-1 transition-colors enabled:hover:text-tx-primary disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => page(1)}
                  disabled={offset + PAGE >= query.data.total}
                  className="rounded-ctl border border-bd-strong px-2.5 py-1 transition-colors enabled:hover:text-tx-primary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
