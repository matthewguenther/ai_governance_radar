/** Standard item row for feeds/cards (§20): badges, source, title, one-liner, time. */

import { Layers } from "lucide-react";

import { categoryLabel, relativeTime } from "../../lib/format";
import type { ItemOut } from "../../lib/types";
import { ConfidenceBadge, DemoBadge, ImpactBadge } from "../ui/Badge";

export function ItemRow({ item, onOpen }: { item: ItemOut; onOpen: (item: ItemOut) => void }) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="hover-card block w-full border-b border-bd-subtle px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-bg-raised/50"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ImpactBadge score={item.impact_score} />
        <ConfidenceBadge confidence={item.confidence} />
        <DemoBadge show={item.is_demo} />
        {item.cluster_size > 1 && (
          <span
            title={`${item.cluster_size} sources reported this event`}
            className="inline-flex items-center gap-1 rounded border border-bd-strong px-1.5 py-[1px] font-mono text-meta text-tx-secondary"
          >
            <Layers aria-hidden className="h-3 w-3" /> {item.cluster_size} sources
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm font-medium text-tx-primary">{item.title}</p>
      {item.excerpt && (
        <p className="mt-0.5 line-clamp-2 text-xs text-tx-secondary">{item.excerpt}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-tx-muted">
        <span className="text-tx-secondary">{item.source_name}</span>
        {item.categories.slice(0, 3).map((c) => (
          <span key={c} className="meta-label">{categoryLabel(c)}</span>
        ))}
        {item.jurisdiction_code && <span className="meta-label">{item.jurisdiction_code}</span>}
        <span className="ml-auto font-mono">{relativeTime(item.published_at ?? item.first_seen_at)}</span>
      </div>
    </button>
  );
}
