/** Clickable KPI card (§19). */

import clsx from "clsx";
import { Link } from "react-router-dom";

export function KpiCard({
  label,
  value,
  to,
  tone = "default",
  sub,
  loading = false,
}: {
  label: string;
  value: number | string;
  to: string;
  tone?: "default" | "critical" | "info" | "positive";
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Link
      to={to}
      className={clsx(
        "card hover-card block p-4",
        tone === "critical" && Number(value) > 0 && "shadow-glow border-sev-critical/40",
      )}
    >
      <p className="meta-label">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-14 animate-pulse rounded bg-bg-raised" />
      ) : (
        <p
          className={clsx(
            "mt-1 font-mono text-kpi font-medium tabular-nums",
            tone === "critical" && Number(value) > 0 ? "text-sev-critical" : "text-tx-primary",
          )}
        >
          {value}
        </p>
      )}
      {sub && <p className="mt-1 text-xs text-tx-muted">{sub}</p>}
    </Link>
  );
}
