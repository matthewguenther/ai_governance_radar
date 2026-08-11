/** Watchlist (§51): per-target change status since last visit. */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "../components/layout/PageHeader";
import { Pill } from "../components/ui/Badge";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { markWatchlistViewed, useRemoveWatch, useWatchStatuses } from "../lib/api";
import { relativeTime, titleCase } from "../lib/format";
import type { WatchStatusOut } from "../lib/types";

function statusTone(status: string): "critical" | "high" | "info" | "positive" {
  if (status === "STATUS CHANGE") return "critical";
  if (status === "UPDATED") return "high";
  if (status === "NO CHANGE") return "positive";
  return "info";
}

function targetLink(s: WatchStatusOut): string | null {
  if (s.target_type === "entity") return `/entities/${s.target_key}`;
  if (s.target_type === "jurisdiction") return `/items?jurisdiction=${s.target_key}`;
  if (s.target_type === "category") return `/items?category=${s.target_key}`;
  if (s.target_type === "source") return `/items?source_id=${s.target_key}`;
  return null;
}

export default function Watchlist() {
  const statuses = useWatchStatuses();
  const remove = useRemoveWatch();
  const qc = useQueryClient();

  // Viewing this page resets per-watch deltas — on leave, not on load, so the
  // statuses the user is looking at stay visible until they navigate away.
  useEffect(() => {
    return () => {
      void markWatchlistViewed()
        .then(() => qc.invalidateQueries({ queryKey: ["watch-status"] }))
        .catch(() => undefined);
    };
  }, [qc]);

  const changed = statuses.data?.filter((s) => s.status !== "NO CHANGE").length ?? 0;

  return (
    <>
      <PageHeader
        title="Watchlist"
        detail={
          statuses.data
            ? `${statuses.data.length} watched · ${changed} changed since your last visit`
            : undefined
        }
      />

      {statuses.isPending ? (
        <div className="card"><CardSkeleton rows={4} /></div>
      ) : statuses.isError ? (
        <div className="card"><ErrorState detail={String(statuses.error)} onRetry={() => statuses.refetch()} /></div>
      ) : statuses.data.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Nothing on your watchlist yet"
            detail="Use the Watch button on any regulation, standard, or entity to track changes here."
            action={
              <Link to="/regulatory" className="text-xs text-accent hover:underline">
                Browse Regulatory Radar
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card">
          <ul>
            {statuses.data.map((s) => {
              const link = targetLink(s);
              const body = (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-tx-primary">{s.display_name}</p>
                    <p className="mt-0.5 text-meta text-tx-muted">
                      {titleCase(s.target_type)}
                      {s.last_change_at && ` · last change ${relativeTime(s.last_change_at)}`}
                      {s.new_items > 0 && ` · ${s.new_items} new item${s.new_items !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <Pill tone={statusTone(s.status)}>{s.status}</Pill>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      remove.mutate(s.watch_id);
                    }}
                    className="text-meta text-tx-muted transition-colors hover:text-sev-critical"
                    aria-label={`Stop watching ${s.display_name}`}
                  >
                    Unwatch
                  </button>
                </div>
              );
              return (
                <li key={s.watch_id} className="border-b border-bd-subtle last:border-b-0">
                  {link ? (
                    <Link to={link} className="block px-4 py-3 transition-colors hover:bg-bg-raised/50">
                      {body}
                    </Link>
                  ) : (
                    <div className="px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
