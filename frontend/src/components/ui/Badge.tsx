/** Badges/pills per DESIGN_SYSTEM.md — never color-only: every state carries text. */

import clsx from "clsx";

type Severity = "critical" | "high" | "watch" | "positive" | "info" | "emerging";

const SEV_STYLES: Record<Severity, string> = {
  critical: "text-sev-critical bg-sev-critical/10 border-sev-critical/30",
  high: "text-sev-high bg-sev-high/10 border-sev-high/30",
  watch: "text-sev-watch bg-sev-watch/10 border-sev-watch/30",
  positive: "text-sev-positive bg-sev-positive/10 border-sev-positive/30",
  info: "text-sev-info bg-sev-info/10 border-sev-info/30",
  emerging: "text-sev-emerging bg-sev-emerging/10 border-sev-emerging/30",
};

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
        "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] font-mono text-meta uppercase",
        SEV_STYLES[tone],
        className,
      )}
    >
      <span aria-hidden className="text-[8px] leading-none">●</span>
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
  const label = score >= 70 ? "High impact" : score >= 50 ? "Elevated" : score >= 30 ? "Watch" : "Info";
  return (
    <Pill tone={impactTone(score)} title={`Impact score ${score}/100`}>
      {label} {score}
    </Pill>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const tone: Severity =
    severity === "critical" ? "critical" : severity === "high" ? "high" : severity === "medium" ? "watch" : "info";
  return <Pill tone={tone}>{severity}</Pill>;
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const tone: Severity = confidence === "high" ? "positive" : confidence === "medium" ? "watch" : "critical";
  return (
    <Pill tone={tone} title={`Confidence: ${confidence} — independent of impact`}>
      Conf {confidence === "medium" ? "med" : confidence}
    </Pill>
  );
}

export function TierBadge({ tier }: { tier: number }) {
  const titles: Record<number, string> = {
    1: "Tier 1 — primary authoritative source",
    2: "Tier 2 — high-quality secondary source",
    3: "Tier 3 — professional reporting",
    4: "Tier 4 — community / discovery",
  };
  return (
    <span
      title={titles[tier] ?? `Tier ${tier}`}
      className="inline-flex items-center rounded border border-bd-strong px-1.5 py-[1px] font-mono text-meta text-tx-secondary"
    >
      T{tier}
    </span>
  );
}

const REG_STATUS_TONE: Record<string, Severity> = {
  proposed: "emerging",
  introduced: "info",
  passed: "watch",
  signed: "high",
  effective: "critical",
  amended: "high",
  enforcement: "critical",
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
    <span
      title="Seeded demonstration data — not live intelligence"
      className="inline-flex items-center rounded border border-dashed border-tx-muted px-1.5 py-[1px] font-mono text-meta text-tx-muted"
    >
      DEMO DATA
    </span>
  );
}

export function FactStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const tone: Severity =
    status === "confirmed" ? "positive" : status === "disputed" || status === "alleged" ? "critical" : "watch";
  return <Pill tone={tone}>{status.replace(/_/g, " ")}</Pill>;
}
