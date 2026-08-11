/** Badges/pills — approved "alive" treatment: filled tinted pills with text
 * (never color-only) and outline micro-pills for low-emphasis metadata. */

import clsx from "clsx";

import {
  CONFIDENCE_DEFS,
  FACT_STATUS_DEFS,
  IMPACT_EXPLAINER,
  SEVERITY_DEFS,
  TIER_DEFS,
  impactBand,
} from "../../lib/definitions";

type Severity = "critical" | "high" | "watch" | "positive" | "info" | "emerging";

const FILL_STYLES: Record<Severity, string> = {
  critical: "text-sev-critical bg-sev-critical/15 border-sev-critical/40",
  high: "text-sev-high bg-sev-high/15 border-sev-high/40",
  watch: "text-sev-watch bg-sev-watch/15 border-sev-watch/40",
  positive: "text-sev-positive bg-sev-positive/15 border-sev-positive/40",
  info: "text-sev-info bg-sev-info/15 border-sev-info/40",
  emerging: "text-sev-emerging bg-sev-emerging/15 border-sev-emerging/40",
};

/** Filled status pill — primary status treatment. */
export function Pill({
  tone = "info",
  children,
  className,
  title,
}: {
  tone?: Severity;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center rounded-ctl border px-2 py-[2px] text-[10.5px] font-semibold capitalize tracking-wide",
        FILL_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Outline micro-pill — quiet metadata (categories, jurisdiction codes). */
export function MicroPill({ children, className, title, dashed = false }: {
  children: React.ReactNode; className?: string; title?: string; dashed?: boolean;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center rounded-[5px] border border-bd-strong px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-wide text-tx-muted",
        dashed && "border-dashed",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function impactTone(score: number): Severity {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "watch";
  return "info";
}

export function ImpactBadge({ score }: { score: number }) {
  const band = impactBand(score);
  return (
    <Pill
      tone={impactTone(score)}
      title={`${band.label} — ${score}/100. ${band.meaning}\n\n${IMPACT_EXPLAINER}`}
    >
      {band.label} {score}
    </Pill>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const tone: Severity =
    severity === "critical" ? "critical" : severity === "high" ? "high" : severity === "medium" ? "watch" : "info";
  return <Pill tone={tone} title={SEVERITY_DEFS[severity] ?? `Severity: ${severity}`}>{severity}</Pill>;
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const tone: Severity = confidence === "high" ? "positive" : confidence === "medium" ? "watch" : "critical";
  return (
    <Pill tone={tone} title={CONFIDENCE_DEFS[confidence] ?? `Confidence: ${confidence}`}>
      Conf {confidence === "medium" ? "med" : confidence}
    </Pill>
  );
}

export function TierBadge({ tier }: { tier: number }) {
  return <MicroPill title={TIER_DEFS[tier] ?? `Tier ${tier}`}>T{tier}</MicroPill>;
}

const REG_STATUS_TONE: Record<string, Severity> = {
  proposed: "emerging",
  introduced: "info",
  passed: "watch",
  signed: "high",
  effective: "positive",
  amended: "high",
  enforcement: "positive",
};

const STD_STATUS_TONE: Record<string, Severity> = {
  announced: "emerging",
  draft: "watch",
  public_comment: "watch",
  final: "positive",
  updated: "high",
  amended: "high",
  withdrawn: "critical",
  superseded: "info",
};

export function StatusPill({ status, kind }: { status: string; kind: "regulation" | "standard" }) {
  const tone = (kind === "regulation" ? REG_STATUS_TONE : STD_STATUS_TONE)[status] ?? "info";
  return <Pill tone={tone}>{status.replace(/_/g, " ")}</Pill>;
}

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <MicroPill dashed title="Seeded demonstration data — not live intelligence">
      DEMO DATA
    </MicroPill>
  );
}

export function FactStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const tone: Severity =
    status === "confirmed" ? "positive" : status === "disputed" || status === "alleged" ? "critical" : "watch";
  return (
    <Pill tone={tone} title={FACT_STATUS_DEFS[status] ?? `Fact status: ${status}`}>
      {status.replace(/_/g, " ")}
    </Pill>
  );
}
