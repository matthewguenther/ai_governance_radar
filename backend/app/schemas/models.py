"""Pydantic response/request schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SourceOut(ORMModel):
    id: int
    name: str
    url: str
    feed_url: str | None
    source_type: str
    category_default: str | None
    jurisdiction_code: str | None
    reliability_tier: int
    polling_interval_minutes: int
    enabled: bool
    attribution: str | None
    last_success_at: datetime | None
    last_failure_at: datetime | None
    last_error: str | None
    is_demo: bool


class SourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    url: str
    feed_url: str | None = None
    source_type: str = Field(pattern="^(rss|atom|json_api|page_watch)$")
    category_default: str | None = None
    jurisdiction_code: str | None = None
    reliability_tier: int = Field(default=3, ge=1, le=4)
    polling_interval_minutes: int = Field(default=360, ge=15)
    enabled: bool = True


class SourcePatch(BaseModel):
    enabled: bool | None = None
    polling_interval_minutes: int | None = Field(default=None, ge=15)
    reliability_tier: int | None = Field(default=None, ge=1, le=4)


class SourceRunOut(ORMModel):
    id: int
    source_id: int
    started_at: datetime
    finished_at: datetime | None
    status: str
    items_found: int
    items_new: int
    items_updated: int
    http_status: int | None
    error_message: str | None


class EntityBrief(ORMModel):
    id: int
    slug: str
    name: str
    entity_type: str
    jurisdiction_code: str | None
    current_status: str | None


class EventDetails(BaseModel):
    """Schema.org Event fields captured at ingestion (sitemap_events sources)."""

    start: str | None = None
    end: str | None = None
    location: str | None = None
    organizer: str | None = None
    organizer_url: str | None = None


class ItemOut(ORMModel):
    id: int
    url: str
    title: str
    excerpt: str | None
    published_at: datetime | None
    first_seen_at: datetime
    last_seen_at: datetime
    categories: list[str]
    jurisdiction_code: str | None
    change_type: str | None
    impact_score: int
    impact_factors: list[dict]
    confidence: str
    fact_status: str | None
    cluster_id: int | None
    is_demo: bool
    source_name: str = ""
    source_tier: int = 3
    entities: list[EntityBrief] = []
    cluster_size: int = 1
    event: EventDetails | None = None


class PageOut(BaseModel):
    items: list[ItemOut]
    total: int
    offset: int
    limit: int


class EntityEventOut(ORMModel):
    id: int
    event_type: str
    occurred_at: datetime
    previous_value: str | None
    new_value: str | None
    summary: str
    impact_score: int | None
    evidence_item_id: int | None


class RegulationOut(ORMModel):
    government_level: str
    status: str
    status_label: str | None
    introduced_at: datetime | None
    passed_at: datetime | None
    signed_at: datetime | None
    effective_at: datetime | None
    compliance_deadline: datetime | None
    last_amended_at: datetime | None
    enforcement_authority: str | None
    penalties: str | None
    covered_entities: str | None
    risk_classification: str | None
    applicability_notes: str | None
    official_source_url: str
    confidence: str
    last_verified_at: datetime


class StandardOut(ORMModel):
    publisher: str
    version: str | None
    status: str
    published_at: datetime | None
    last_updated_at: datetime | None
    change_magnitude: str | None
    related_framework_slugs: list[str]
    official_source_url: str


class EntityOut(ORMModel):
    id: int
    slug: str
    name: str
    entity_type: str
    jurisdiction_code: str | None
    description: str | None
    official_url: str | None
    current_status: str | None
    needs_review: bool
    is_demo: bool
    regulation: RegulationOut | None = None
    standard: StandardOut | None = None
    events: list[EntityEventOut] = []
    watched: bool = False


class IncidentOut(ORMModel):
    id: int
    title: str
    occurred_at: datetime | None
    reported_at: datetime
    severity: str
    category: str
    system_vendor: str | None
    system_type: str | None
    geography: str | None
    affected_domain: str | None
    what_happened: str
    root_cause: str | None
    governance_relevance: str | None
    security_relevance: str | None
    mitigation: str | None
    fact_status: str
    confidence: str
    related_framework_slugs: list[str]
    source_links: list[dict]
    is_demo: bool


class WatchOut(ORMModel):
    id: int
    target_type: str
    target_key: str
    created_at: datetime
    last_viewed_at: datetime | None


class WatchCreate(BaseModel):
    target_type: str = Field(pattern="^(entity|source|jurisdiction|category)$")
    target_key: str = Field(min_length=1, max_length=200)


class WatchStatusOut(BaseModel):
    watch_id: int
    target_type: str
    target_key: str
    display_name: str
    status: str
    new_items: int
    events: int
    last_change_at: datetime | None


class JurisdictionOut(BaseModel):
    code: str
    name: str
    kind: str
    parent_code: str | None
    iso_numeric: str | None
