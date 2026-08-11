"""Idempotent seed loading: source registry YAML + curated entities/incidents/demo items.

Integrity rules (DATA_MODEL.md) are validated on load: official source URL required,
confidence required, last_verified_at required on regulations, fact_status on incidents.
"""

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import jurisdictions
from app.core.config import settings
from app.ingestion.parsers import canonicalize_url, content_hash, make_excerpt
from app.models import (
    Entity,
    EntityEvent,
    Incident,
    Item,
    ItemEntity,
    Regulation,
    Source,
    Standard,
)
from app.services import classify, scoring
from app.services.search import index_item

logger = logging.getLogger("radar.seed")


class SeedError(ValueError):
    pass


def _dt(value: str | None) -> datetime | None:
    if not value:
        return None
    d = datetime.fromisoformat(value)
    return d.replace(tzinfo=UTC) if d.tzinfo is None else d


def _require(cond: bool, msg: str) -> None:
    if not cond:
        raise SeedError(msg)


def _check_jurisdiction(code: str | None, ctx: str) -> None:
    if code is not None:
        _require(jurisdictions.is_valid(code), f"{ctx}: unknown jurisdiction {code!r}")


def seed_sources(db: Session, path: Path | None = None) -> int:
    path = path or Path(settings.data_dir) / "sources" / "sources.yaml"
    if not path.exists():
        logger.warning("Source registry not found: %s", path)
        return 0
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or []
    count = 0
    for row in data:
        _require("name" in row and "url" in row and "type" in row,
                 f"source missing required fields: {row}")
        _check_jurisdiction(row.get("jurisdiction"), row["name"])
        existing = db.execute(
            select(Source).where(Source.name == row["name"])
        ).scalar_one_or_none()
        target = existing or Source(name=row["name"])
        target.url = row["url"]
        target.feed_url = row.get("feed_url")
        target.source_type = row["type"]
        target.category_default = row.get("category")
        target.jurisdiction_code = row.get("jurisdiction")
        target.reliability_tier = int(row.get("tier", 3))
        target.polling_interval_minutes = int(
            row.get("polling_interval_minutes", settings.default_poll_interval_minutes)
        )
        target.enabled = bool(row.get("enabled", True))
        target.attribution = row.get("attribution")
        target.config = row.get("config")
        target.is_demo = bool(row.get("demo", False))
        if existing is None:
            db.add(target)
        count += 1
    db.commit()
    return count


def seed_entities(db: Session, path: Path | None = None) -> int:
    path = path or Path(settings.data_dir) / "seed" / "entities.json"
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    count = 0
    for row in data:
        _require(bool(row.get("slug")) and bool(row.get("name")),
                 f"entity missing slug/name: {row}")
        _check_jurisdiction(row.get("jurisdiction"), row["slug"])
        entity = db.execute(
            select(Entity).where(Entity.slug == row["slug"])
        ).scalar_one_or_none()
        if entity is None:
            entity = Entity(slug=row["slug"])
            db.add(entity)
        entity.name = row["name"]
        entity.entity_type = row["type"]
        entity.jurisdiction_code = row.get("jurisdiction")
        entity.description = row.get("description")
        entity.official_url = row.get("official_url")
        entity.is_demo = bool(row.get("demo", False))
        db.flush()

        if row["type"] == "regulation":
            reg_data = row.get("regulation") or {}
            _require(bool(reg_data.get("official_source_url")),
                     f"{row['slug']}: regulation requires official_source_url")
            _require(bool(reg_data.get("last_verified_at")),
                     f"{row['slug']}: regulation requires last_verified_at")
            reg = db.get(Regulation, entity.id) or Regulation(entity_id=entity.id)
            reg.government_level = reg_data.get("government_level", "state")
            reg.status = reg_data.get("status", "proposed")
            reg.status_label = reg_data.get("status_label")
            reg.introduced_at = _dt(reg_data.get("introduced_at"))
            reg.passed_at = _dt(reg_data.get("passed_at"))
            reg.signed_at = _dt(reg_data.get("signed_at"))
            reg.effective_at = _dt(reg_data.get("effective_at"))
            reg.compliance_deadline = _dt(reg_data.get("compliance_deadline"))
            reg.last_amended_at = _dt(reg_data.get("last_amended_at"))
            reg.enforcement_authority = reg_data.get("enforcement_authority")
            reg.penalties = reg_data.get("penalties")
            reg.covered_entities = reg_data.get("covered_entities")
            reg.risk_classification = reg_data.get("risk_classification")
            reg.applicability_notes = reg_data.get("applicability_notes")
            reg.official_source_url = reg_data["official_source_url"]
            reg.confidence = reg_data.get("confidence", "high")
            verified = _dt(reg_data["last_verified_at"])
            assert verified is not None  # guaranteed by _require above
            reg.last_verified_at = verified
            entity.current_status = reg.status
            db.merge(reg)

        elif row["type"] in ("standard", "framework"):
            std_data = row.get("standard") or {}
            _require(bool(std_data.get("official_source_url")),
                     f"{row['slug']}: standard requires official_source_url")
            std = db.get(Standard, entity.id) or Standard(entity_id=entity.id)
            std.publisher = std_data.get("publisher", "Other")
            std.version = std_data.get("version")
            std.status = std_data.get("status", "final")
            std.published_at = _dt(std_data.get("published_at"))
            std.last_updated_at = _dt(std_data.get("last_updated_at"))
            std.change_magnitude = std_data.get("change_magnitude")
            std.related_framework_slugs = std_data.get("related_frameworks", [])
            std.official_source_url = std_data["official_source_url"]
            entity.current_status = std.status
            db.merge(std)

        # Timeline events (idempotent on entity_id + occurred_at + event_type)
        for ev in row.get("events", []):
            occurred = _dt(ev["occurred_at"])
            exists = db.execute(
                select(EntityEvent).where(
                    EntityEvent.entity_id == entity.id,
                    EntityEvent.occurred_at == occurred,
                    EntityEvent.event_type == ev["type"],
                )
            ).scalar_one_or_none()
            if exists is None:
                db.add(EntityEvent(
                    entity_id=entity.id,
                    event_type=ev["type"],
                    occurred_at=occurred,
                    previous_value=ev.get("previous"),
                    new_value=ev.get("new"),
                    summary=ev["summary"],
                    impact_score=ev.get("impact"),
                ))
        count += 1
    db.commit()
    return count


def seed_incidents(db: Session, path: Path | None = None) -> int:
    path = path or Path(settings.data_dir) / "seed" / "incidents.json"
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    count = 0
    for row in data:
        _require(bool(row.get("title")) and bool(row.get("what_happened")),
                 f"incident missing title/what_happened: {row.get('title')}")
        _require(bool(row.get("fact_status")), f"{row['title']}: incident requires fact_status")
        _require(bool(row.get("source_links")), f"{row['title']}: incident requires source_links")
        incident = db.execute(
            select(Incident).where(Incident.title == row["title"])
        ).scalar_one_or_none()
        if incident is None:
            incident = Incident(title=row["title"])
            db.add(incident)
        incident.occurred_at = _dt(row.get("occurred_at"))
        incident.reported_at = _dt(row.get("reported_at")) or datetime.now(UTC)
        incident.severity = row.get("severity", "medium")
        incident.category = row.get("category", "other")
        incident.system_vendor = row.get("system_vendor")
        incident.system_type = row.get("system_type")
        incident.geography = row.get("geography")
        incident.affected_domain = row.get("affected_domain")
        incident.what_happened = row["what_happened"]
        incident.root_cause = row.get("root_cause")
        incident.governance_relevance = row.get("governance_relevance")
        incident.security_relevance = row.get("security_relevance")
        incident.mitigation = row.get("mitigation")
        incident.fact_status = row["fact_status"]
        incident.confidence = row.get("confidence", "medium")
        incident.related_framework_slugs = row.get("related_frameworks", [])
        incident.source_links = row["source_links"]
        incident.is_demo = bool(row.get("demo", False))
        count += 1
    db.commit()
    return count


def seed_demo_items(db: Session, path: Path | None = None) -> int:
    """Demo feed items (§78) — explicitly marked DEMO, attached to a demo source."""
    if not settings.demo_data:
        return 0
    path = path or Path(settings.data_dir) / "seed" / "demo_items.json"
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))

    demo_source = db.execute(
        select(Source).where(Source.name == "Demo Data (seeded)")
    ).scalar_one_or_none()
    if demo_source is None:
        demo_source = Source(
            name="Demo Data (seeded)",
            url="https://example.invalid/demo",
            source_type="rss",
            reliability_tier=2,
            enabled=False,
            is_demo=True,
            attribution="Seeded demonstration data — clearly marked, not live intelligence.",
        )
        db.add(demo_source)
        db.flush()

    entities = db.execute(select(Entity)).scalars().all()
    count = 0
    for row in data:
        url = row["url"]
        canonical = canonicalize_url(url)
        existing = db.execute(
            select(Item).where(Item.source_id == demo_source.id, Item.canonical_url == canonical)
        ).scalar_one_or_none()
        if existing is not None:
            continue
        title = row["title"]
        excerpt = make_excerpt(row.get("excerpt"))
        categories, jurisdiction = classify.classify(
            title, excerpt, row.get("category"), row.get("jurisdiction")
        )
        published: datetime | None
        if "days_ago" in row:  # demo dates stay fresh relative to seeding time
            from datetime import timedelta

            published = datetime.now(UTC) - timedelta(days=int(row["days_ago"]))
        else:
            published = _dt(row.get("published_at"))
        result = scoring.score_item(
            categories=categories,
            reliability_tier=int(row.get("tier", demo_source.reliability_tier)),
            change_type=row.get("change_type", "new"),
            published_at=published,
        )
        item = Item(
            source_id=demo_source.id,
            url=url,
            canonical_url=canonical,
            content_hash=content_hash(title, excerpt),
            title=title,
            excerpt=excerpt,
            published_at=published,
            categories=categories,
            jurisdiction_code=row.get("jurisdiction") or jurisdiction,
            change_type=row.get("change_type", "new"),
            impact_score=result.score,
            impact_factors=result.factors,
            confidence=row.get("confidence", "medium"),
            fact_status=row.get("fact_status"),
            is_demo=True,
        )
        db.add(item)
        db.flush()
        title_lower = title.lower()
        names = []
        for entity in entities:
            if entity.name.lower() in title_lower or entity.slug in row.get("entities", []):
                db.add(ItemEntity(item_id=item.id, entity_id=entity.id, relation="about"))
                names.append(entity.name)
        index_item(db, item, " ".join(names))
        count += 1
    db.commit()
    return count


def seed_all(db: Session) -> dict:
    return {
        "sources": seed_sources(db),
        "entities": seed_entities(db),
        "incidents": seed_incidents(db),
        "demo_items": seed_demo_items(db),
    }
