/** Watch toggle (§51). Watched state readable without color (filled vs outline + label). */

import clsx from "clsx";
import { Radar } from "lucide-react";

import { useAddWatch, useRemoveWatch, useWatchlist } from "../../lib/api";

export function WatchButton({
  targetType,
  targetKey,
  compact = false,
}: {
  targetType: "entity" | "source" | "jurisdiction" | "category";
  targetKey: string;
  compact?: boolean;
}) {
  const { data: watches } = useWatchlist();
  const add = useAddWatch();
  const remove = useRemoveWatch();

  const watch = watches?.find((w) => w.target_type === targetType && w.target_key === targetKey);
  const watched = !!watch;
  const busy = add.isPending || remove.isPending;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (watch) remove.mutate(watch.id);
    else add.mutate({ target_type: targetType, target_key: targetKey });
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={watched}
      aria-label={watched ? `Stop watching ${targetKey}` : `Watch ${targetKey}`}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-ctl border font-mono text-meta uppercase transition-colors",
        compact ? "px-1.5 py-[3px]" : "px-2.5 py-1",
        watched
          ? "border-accent/60 bg-accent/15 text-accent"
          : "border-bd-strong text-tx-muted hover:border-accent/50 hover:text-tx-secondary",
        busy && "opacity-60",
      )}
    >
      <Radar aria-hidden className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {watched ? "Watching" : "Watch"}
    </button>
  );
}
