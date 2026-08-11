/** Empty / error / loading states (§58, §59) — never blank cards. */

import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <Inbox aria-hidden className="h-6 w-6 text-tx-muted" />
      <p className="text-sm font-medium text-tx-secondary">{title}</p>
      {detail && <p className="max-w-sm text-xs text-tx-muted">{detail}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <AlertTriangle aria-hidden className="h-6 w-6 text-sev-critical" />
      <p className="text-sm font-medium text-tx-primary">{title}</p>
      {detail && <p className="max-w-sm break-words text-xs text-tx-muted">{detail}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-ctl border border-bd-strong px-3 py-1 text-xs text-tx-secondary transition-colors hover:border-accent hover:text-tx-primary"
        >
          <RefreshCw aria-hidden className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded bg-bg-raised ${className}`}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
