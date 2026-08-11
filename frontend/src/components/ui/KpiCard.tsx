/** Clickable KPI card — approved tinted "alive" treatment with icon + sparkline. */

import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { T } from "../../lib/tokens";
import { Sparkline } from "./charts";

const TONES = {
  critical: T.critical,
  accent: T.accent,
  high: T.high,
  positive: T.positive,
  info: T.info,
} as const;

export function KpiCard({
  label,
  value,
  to,
  tone = "accent",
  sub,
  icon: Icon,
  spark,
  loading = false,
}: {
  label: string;
  value: number | string;
  to: string;
  tone?: keyof typeof TONES;
  sub?: string;
  icon?: LucideIcon;
  spark?: number[];
  loading?: boolean;
}) {
  const c = TONES[tone];
  const active = Number(value) > 0;
  return (
    <Link
      to={to}
      className="block rounded-card shadow-card transition-transform duration-150 hover:-translate-y-px"
      style={{
        background: `linear-gradient(135deg, ${c}1C 0%, ${c}08 55%, transparent 100%), ${T.bgSurface}`,
        border: `1px solid ${c}3D`,
      }}
    >
      <div className="flex items-start justify-between p-4">
        <div className="flex gap-3">
          {loading ? (
            <span className="mt-1 h-8 w-12 animate-pulse rounded bg-bg-raised" />
          ) : (
            <span
              className="font-mono text-kpi font-semibold tabular-nums"
              style={{ color: active ? c : T.txMuted }}
            >
              {value}
            </span>
          )}
          <span className="mt-0.5">
            <span className="block text-xs font-semibold text-tx-primary">{label}</span>
            {sub && <span className="mt-0.5 block text-[10.5px] text-tx-secondary">{sub}</span>}
          </span>
        </div>
        <span className="text-right">
          {Icon && <Icon aria-hidden size={15} color={c} style={{ opacity: 0.9, display: "inline" }} />}
          {spark && (
            <span className="mt-2 block opacity-85">
              <Sparkline data={spark} width={64} height={20} stroke={c} fill={`${c}18`} />
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}
