/** API types mirroring backend/app/schemas/models.py */

export interface SourceOut {
  id: number;
  name: string;
  url: string;
  feed_url: string | null;
  source_type: string;
  category_default: string | null;
  jurisdiction_code: string | null;
  reliability_tier: number;
  polling_interval_minutes: number;
  enabled: boolean;
  attribution: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_error: string | null;
  is_demo: boolean;
}

export interface SourceRunOut {
  id: number;
  source_id: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_found: number;
  items_new: number;
  items_updated: number;
  http_status: number | null;
  error_message: string | null;
}

export interface EntityBrief {
  id: number;
  slug: string;
  name: string;
  entity_type: string;
  jurisdiction_code: string | null;
  current_status: string | null;
}

export interface ImpactFactor {
  factor: string;
  points: number;
}

export interface ItemOut {
  id: number;
  url: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  categories: string[];
  jurisdiction_code: string | null;
  change_type: string | null;
  impact_score: number;
  impact_factors: ImpactFactor[];
  confidence: Confidence;
  fact_status: string | null;
  cluster_id: number | null;
  is_demo: boolean;
  source_name: string;
  source_tier: number;
  entities: EntityBrief[];
  cluster_size: number;
}

export interface PageOut {
  items: ItemOut[];
  total: number;
  offset: number;
  limit: number;
}

export type Confidence = "high" | "medium" | "low";

export interface EntityEventOut {
  id: number;
  event_type: string;
  occurred_at: string;
  previous_value: string | null;
  new_value: string | null;
  summary: string;
  impact_score: number | null;
  evidence_item_id: number | null;
}

export interface RegulationOut {
  government_level: string;
  status: string;
  status_label: string | null;
  introduced_at: string | null;
  passed_at: string | null;
  signed_at: string | null;
  effective_at: string | null;
  compliance_deadline: string | null;
  last_amended_at: string | null;
  enforcement_authority: string | null;
  penalties: string | null;
  covered_entities: string | null;
  risk_classification: string | null;
  applicability_notes: string | null;
  official_source_url: string;
  confidence: Confidence;
  last_verified_at: string;
}

export interface StandardOut {
  publisher: string;
  version: string | null;
  status: string;
  published_at: string | null;
  last_updated_at: string | null;
  change_magnitude: string | null;
  related_framework_slugs: string[];
  official_source_url: string;
}

export interface EntityOut {
  id: number;
  slug: string;
  name: string;
  entity_type: string;
  jurisdiction_code: string | null;
  description: string | null;
  official_url: string | null;
  current_status: string | null;
  needs_review: boolean;
  is_demo: boolean;
  regulation: RegulationOut | null;
  standard: StandardOut | null;
  events: EntityEventOut[];
}

export interface IncidentOut {
  id: number;
  title: string;
  occurred_at: string | null;
  reported_at: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  system_vendor: string | null;
  system_type: string | null;
  geography: string | null;
  affected_domain: string | null;
  what_happened: string;
  root_cause: string | null;
  governance_relevance: string | null;
  security_relevance: string | null;
  mitigation: string | null;
  fact_status: string;
  confidence: Confidence;
  related_framework_slugs: string[];
  source_links: { title: string; url: string }[];
  is_demo: boolean;
}

export interface DashboardSummary {
  since: string;
  high_impact: number;
  total_changes: number;
  new_incidents: number;
  sources_ok: number;
  sources_total: number;
}

export interface MapRow {
  code: string;
  name: string;
  iso_numeric: string | null;
  /** Tracked governance instruments (regulations, frameworks, national standards). */
  instruments: number;
  /** Instruments with legal force (laws, regulations). */
  binding: number;
  /** Voluntary frameworks, standards, and guidance. */
  guidance: number;
  recent_items: number;
  /** Where clicking should navigate (EU member states point at "EU"). */
  link_code: string;
  /** Higher-level jurisdictions contributing to this count, e.g. ["EU"]. */
  via: string[];
}

export interface SearchOut {
  query: string;
  items: ItemOut[];
  entities: EntityBrief[];
  incidents: IncidentOut[];
}

export interface JurisdictionOut {
  code: string;
  name: string;
  kind: string;
  parent_code: string | null;
  iso_numeric: string | null;
}
