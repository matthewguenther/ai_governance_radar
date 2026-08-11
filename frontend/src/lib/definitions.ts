/** Plain-language definitions for every classifier the UI displays.
 * Nothing here is decorative: each string states how the value is derived so a
 * user can judge whether to trust it. Keep in sync with backend scoring rules
 * (app/services/scoring.py, classify.py) and DATA_MODEL.md. */

export const IMPACT_BANDS = [
  { min: 70, label: "High impact", meaning: "Significant governance development — act on it this week." },
  { min: 50, label: "Elevated", meaning: "Worth reading today; may need follow-up." },
  { min: 30, label: "Watch", meaning: "Relevant context; no action implied." },
  { min: 0, label: "Info", meaning: "Background noise level — logged for completeness." },
] as const;

export function impactBand(score: number) {
  return IMPACT_BANDS.find((b) => score >= b.min) ?? IMPACT_BANDS[IMPACT_BANDS.length - 1];
}

export const IMPACT_EXPLAINER =
  "Impact (0–100) is computed from fixed rules, not opinion: subject category, " +
  "source authority tier, change type (new vs. status change), recency, and whether " +
  "it matches your watchlist. Items with no AI-specific relevance are capped at 25. " +
  "Open any item to see the exact points breakdown.";

export const CONFIDENCE_DEFS: Record<string, string> = {
  high:
    "High confidence — reported by a Tier 1 primary authoritative source " +
    "(government, regulator, standards body), or a Tier 2 source with corroboration.",
  medium:
    "Medium confidence — credible secondary reporting, or a single source without " +
    "independent corroboration yet.",
  low:
    "Low confidence — community/discovery-tier source, or the underlying facts are " +
    "labelled alleged or disputed. Verify before relying on it.",
};

export const CONFIDENCE_EXPLAINER =
  "Confidence is about how sure we are the information is accurate. It is deliberately " +
  "independent of impact: a rumoured regulation can be high impact and low confidence.";

export const SEVERITY_DEFS: Record<string, string> = {
  critical:
    "Critical — large-scale or irreversible harm: major financial loss, safety-of-life " +
    "risk, mass data exposure, or systemic failure of a deployed AI system.",
  high:
    "High — material harm to an identifiable group: confirmed discrimination, " +
    "significant data leakage, regulatory enforcement, or destructive system behaviour.",
  medium:
    "Medium — limited or contained harm, or a demonstrated failure with no confirmed " +
    "victim impact.",
  low:
    "Low — near-miss, demonstration, or reputational-only impact.",
};

export const FACT_STATUS_DEFS: Record<string, string> = {
  confirmed: "Confirmed — acknowledged by the responsible party or established by an official finding (court, regulator, audit).",
  reported: "Reported — described by credible reporting but not officially confirmed.",
  alleged: "Alleged — claimed by one party (e.g. a lawsuit) and contested or unproven.",
  under_investigation: "Under investigation — an official inquiry is open; facts may change.",
  disputed: "Disputed — the parties involved disagree on what happened.",
};

export const TIER_DEFS: Record<number, string> = {
  1: "Tier 1 — primary authoritative source: government, regulator, or standards body publishing its own material.",
  2: "Tier 2 — high-quality secondary source: research institutions, established incident databases, universities.",
  3: "Tier 3 — professional reporting: established technology, security, or legal press.",
  4: "Tier 4 — community/discovery: blogs, forums, social. Can surface leads but never establishes a regulatory fact on its own.",
};

export const CATEGORY_DEFS: Record<string, string> = {
  regulation: "Laws, bills, executive actions, and regulatory guidance.",
  standard: "Standards and frameworks (NIST, ISO, OWASP, MITRE and similar).",
  incident: "Real-world AI harms, failures, enforcement actions, and lawsuits.",
  security: "AI security research, vulnerabilities, and attack techniques.",
  research: "Academic and institutional research output.",
  news: "General AI governance-relevant reporting.",
  training: "Certifications, courses, and professional credentials.",
  event: "Conferences, webinars, workshops, and symposia.",
  ranking: "Indices and benchmarks comparing jurisdictions or systems.",
};
