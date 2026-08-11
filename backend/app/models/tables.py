"""V1 schema per DATA_MODEL.md. UTC timestamps; enums as short strings; JSON for lists."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class Source(TimestampMixin, Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    url: Mapped[str] = mapped_column(String(1000))
    feed_url: Mapped[str | None] = mapped_column(String(1000))
    source_type: Mapped[str] = mapped_column(String(20))  # rss | atom | json_api | page_watch
    category_default: Mapped[str | None] = mapped_column(String(40))
    jurisdiction_code: Mapped[str | None] = mapped_column(String(20))
    reliability_tier: Mapped[int] = mapped_column(Integer, default=3)  # 1-4
    polling_interval_minutes: Mapped[int] = mapped_column(Integer, default=360)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    attribution: Mapped[str | None] = mapped_column(Text)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_failure_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(Text)
    # ETag/Last-Modified cache for conditional GET
    http_etag: Mapped[str | None] = mapped_column(String(400))
    http_last_modified: Mapped[str | None] = mapped_column(String(100))
    # page_watch state: hash of last-seen normalized page text
    page_hash: Mapped[str | None] = mapped_column(String(64))
    # Parser configuration (e.g. json_api field mapping) — data-driven, not code (§85)
    config: Mapped[dict | None] = mapped_column(JSON)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    runs: Mapped[list["SourceRun"]] = relationship(back_populates="source")
    items: Mapped[list["Item"]] = relationship(back_populates="source")


class SourceRun(Base):
    __tablename__ = "source_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(10), default="running")  # success|error|partial
    items_found: Mapped[int] = mapped_column(Integer, default=0)
    items_new: Mapped[int] = mapped_column(Integer, default=0)
    items_updated: Mapped[int] = mapped_column(Integer, default=0)
    http_status: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)

    source: Mapped[Source] = relationship(back_populates="runs")


class ItemCluster(Base):
    __tablename__ = "item_clusters"

    id: Mapped[int] = mapped_column(primary_key=True)
    primary_item_id: Mapped[int | None] = mapped_column(Integer)  # highest-tier source item
    title: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Item(TimestampMixin, Base):
    __tablename__ = "items"
    __table_args__ = (UniqueConstraint("source_id", "canonical_url", name="uq_item_source_url"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), index=True)
    url: Mapped[str] = mapped_column(String(1000))
    canonical_url: Mapped[str] = mapped_column(String(1000), index=True)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(500))
    excerpt: Mapped[str | None] = mapped_column(Text)  # sanitized plain text, <=500 chars
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    categories: Mapped[list] = mapped_column(JSON, default=list)
    jurisdiction_code: Mapped[str | None] = mapped_column(String(20), index=True)
    change_type: Mapped[str | None] = mapped_column(String(30))  # new|update|status_change|...
    impact_score: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    impact_factors: Mapped[list] = mapped_column(JSON, default=list)  # [{factor, points}]
    confidence: Mapped[str] = mapped_column(String(10), default="medium")  # high|medium|low
    fact_status: Mapped[str | None] = mapped_column(String(30))
    cluster_id: Mapped[int | None] = mapped_column(ForeignKey("item_clusters.id"), index=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_metadata: Mapped[dict | None] = mapped_column(JSON)

    source: Mapped[Source] = relationship(back_populates="items")
    entity_links: Mapped[list["ItemEntity"]] = relationship(back_populates="item")


class Entity(TimestampMixin, Base):
    __tablename__ = "entities"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(300))
    entity_type: Mapped[str] = mapped_column(String(20), index=True)  # regulation|standard|...
    jurisdiction_code: Mapped[str | None] = mapped_column(String(20), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    official_url: Mapped[str | None] = mapped_column(String(1000))
    current_status: Mapped[str | None] = mapped_column(String(40))
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    meta: Mapped[dict | None] = mapped_column(JSON)

    regulation: Mapped["Regulation | None"] = relationship(back_populates="entity", uselist=False)
    standard: Mapped["Standard | None"] = relationship(back_populates="entity", uselist=False)
    events: Mapped[list["EntityEvent"]] = relationship(
        back_populates="entity", order_by="EntityEvent.occurred_at.desc()"
    )
    item_links: Mapped[list["ItemEntity"]] = relationship(back_populates="entity")


class Regulation(Base):
    """Curated 1:1 extension of entities (entity_type='regulation'). DEC-014 applies."""

    __tablename__ = "regulations"

    entity_id: Mapped[int] = mapped_column(ForeignKey("entities.id"), primary_key=True)
    government_level: Mapped[str] = mapped_column(String(20))  # federal|state|local|supranational
    status: Mapped[str] = mapped_column(String(20), index=True)  # lifecycle (DATA_MODEL.md)
    status_label: Mapped[str | None] = mapped_column(String(60))  # jurisdiction-specific label
    introduced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    passed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effective_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    compliance_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_amended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    enforcement_authority: Mapped[str | None] = mapped_column(String(300))
    penalties: Mapped[str | None] = mapped_column(Text)
    covered_entities: Mapped[str | None] = mapped_column(Text)
    risk_classification: Mapped[str | None] = mapped_column(String(200))
    applicability_notes: Mapped[str | None] = mapped_column(Text)
    official_source_url: Mapped[str] = mapped_column(String(1000))
    confidence: Mapped[str] = mapped_column(String(10), default="high")
    last_verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    entity: Mapped[Entity] = relationship(back_populates="regulation")


class Standard(Base):
    """Curated 1:1 extension of entities (entity_type='standard')."""

    __tablename__ = "standards"

    entity_id: Mapped[int] = mapped_column(ForeignKey("entities.id"), primary_key=True)
    publisher: Mapped[str] = mapped_column(String(60), index=True)  # NIST|ISO|OWASP|MITRE|...
    version: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20), index=True)  # announced|draft|...|superseded
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    change_magnitude: Mapped[str | None] = mapped_column(String(12))  # major|minor|editorial
    related_framework_slugs: Mapped[list] = mapped_column(JSON, default=list)
    official_source_url: Mapped[str] = mapped_column(String(1000))

    entity: Mapped[Entity] = relationship(back_populates="standard")


class Incident(TimestampMixin, Base):
    """Curated incident record (§9/§24). Evidence links via related item slugs/urls."""

    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(400))
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    severity: Mapped[str] = mapped_column(String(10), index=True)  # critical|high|medium|low
    category: Mapped[str] = mapped_column(String(40), index=True)
    system_vendor: Mapped[str | None] = mapped_column(String(200))
    system_type: Mapped[str | None] = mapped_column(String(200))
    geography: Mapped[str | None] = mapped_column(String(100))
    affected_domain: Mapped[str | None] = mapped_column(String(200))
    what_happened: Mapped[str] = mapped_column(Text)
    root_cause: Mapped[str | None] = mapped_column(Text)
    governance_relevance: Mapped[str | None] = mapped_column(Text)
    security_relevance: Mapped[str | None] = mapped_column(Text)
    mitigation: Mapped[str | None] = mapped_column(Text)
    fact_status: Mapped[str] = mapped_column(String(30))  # confirmed|reported|alleged|...
    confidence: Mapped[str] = mapped_column(String(10), default="medium")
    related_framework_slugs: Mapped[list] = mapped_column(JSON, default=list)
    source_links: Mapped[list] = mapped_column(JSON, default=list)  # [{title, url}] evidence
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)


class EntityEvent(Base):
    __tablename__ = "entity_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_id: Mapped[int] = mapped_column(ForeignKey("entities.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(30))  # created|status_change|document_updated|
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    previous_value: Mapped[str | None] = mapped_column(String(400))
    new_value: Mapped[str | None] = mapped_column(String(400))
    summary: Mapped[str] = mapped_column(Text)
    evidence_item_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"))
    impact_score: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    entity: Mapped[Entity] = relationship(back_populates="events")


class ItemEntity(Base):
    __tablename__ = "item_entities"

    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), primary_key=True)
    entity_id: Mapped[int] = mapped_column(ForeignKey("entities.id"), primary_key=True)
    relation: Mapped[str] = mapped_column(String(12), default="about")  # about|mentions|evidence

    item: Mapped[Item] = relationship(back_populates="entity_links")
    entity: Mapped[Entity] = relationship(back_populates="item_links")


class Watch(Base):
    """Single-user watchlist (DEC-008). Polymorphic target."""

    __tablename__ = "watches"
    __table_args__ = (UniqueConstraint("target_type", "target_key", name="uq_watch_target"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    target_type: Mapped[str] = mapped_column(String(15))  # entity|source|jurisdiction|category
    target_key: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AppState(Base):
    """Single-user preferences / app metadata (DEC-018)."""

    __tablename__ = "app_state"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[dict | list | str | int | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
