/** Standard item row (approved design): flag/org avatar, headline, quiet metadata,
 * impact ring. Color never the only signal — ring carries score text + aria label. */

import { Layers } from "lucide-react";

import { categoryLabel, relativeTime } from "../../lib/format";
import type { ItemOut } from "../../lib/types";
import { DemoBadge, MicroPill } from "../ui/Badge";
import { ConfDots, ImpactRing } from "../ui/charts";
import { FlagChip } from "../ui/FlagChip";
import { OrgAvatar, orgFor } from "../ui/OrgAvatar";

/** Org logo when a known org entity/source matches; else jurisdiction flag; else source monogram. */
export function ItemAvatar({ item, size = 24 }: { item: ItemOut; size?: number }) {
  const orgEntity = item.entities.find((e) => orgFor(e.name));
  if (orgEntity) return <OrgAvatar name={orgEntity.name} size={size} />;
  if (item.jurisdiction_code)
    return <FlagChip code={item.jurisdiction_code} size={size} title={item.jurisdiction_code} />;
  return <OrgAvatar name={item.source_name} size={size} />;
}

export function ItemRow({ item, onOpen }: { item: ItemOut; onOpen: (item: ItemOut) => void }) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="block w-full border-b border-bd-subtle px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5"><ItemAvatar item={item} /></span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-tx-primary">{item.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tx-muted">
            <span className="text-tx-secondary">{item.source_name}</span>
            {item.categories.slice(0, 2).map((c) => (
              <MicroPill key={c}>{categoryLabel(c)}</MicroPill>
            ))}
            {item.jurisdiction_code && <MicroPill>{item.jurisdiction_code}</MicroPill>}
            <DemoBadge show={item.is_demo} />
            {item.cluster_size > 1 && (
              <MicroPill title={`${item.cluster_size} sources reported this event`}>
                <Layers aria-hidden className="mr-1 h-3 w-3" /> {item.cluster_size} src
              </MicroPill>
            )}
            <ConfDots level={item.confidence} />
            <span className="ml-auto font-mono">{relativeTime(item.published_at ?? item.first_seen_at)}</span>
          </div>
        </div>
        <ImpactRing score={item.impact_score} />
      </div>
    </button>
  );
}
