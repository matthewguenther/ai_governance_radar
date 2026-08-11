/** Color tokens for inline styles / SVG (keep in sync with tailwind.config.js). */

export const T = {
  bgBase: "#090C12",
  bgSurface: "#10151E",
  bgRaised: "#1A2230",
  bdSubtle: "#1E2836",
  bdStrong: "#2C3A4E",
  txPrimary: "#E8EDF5",
  txSecondary: "#8FA0B5",
  txMuted: "#5C6B80",
  accent: "#628BFF",
  critical: "#F2564D",
  high: "#F2913D",
  watch: "#E5C445",
  positive: "#3FBF77",
  info: "#5B9BD8",
  emerging: "#A78BFA",
} as const;

export function impactColor(score: number): string {
  return score >= 70 ? T.critical : score >= 50 ? T.high : score >= 30 ? T.watch : T.info;
}

export function severityColor(severity: string): string {
  return severity === "critical" ? T.critical
    : severity === "high" ? T.high
    : severity === "medium" ? T.watch : T.info;
}

export function regStatusColor(status?: string | null): string {
  if (["effective", "enforcement"].includes(status ?? "")) return T.positive;
  if (status === "signed" || status === "amended") return T.high;
  if (status === "passed") return T.watch;
  if (status === "proposed") return T.emerging;
  return T.info;
}

export function stdStatusColor(status?: string | null): string {
  if (status === "final") return T.positive;
  if (status === "updated" || status === "amended") return T.high;
  if (status === "draft" || status === "public_comment") return T.watch;
  if (status === "withdrawn") return T.critical;
  if (status === "announced") return T.emerging;
  return T.info;
}
