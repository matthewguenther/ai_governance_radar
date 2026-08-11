"""Ingestion pipeline: fetch → parse → normalize → dedupe → classify → change-detect
→ score → persist (ARCHITECTURE.md §4). Every run logs a source_runs row (§59)."""

import json
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingestion import parsers
from app.ingestion.safe_fetch import FetchBlockedError, FetchError, safe_fetch
from app.models import Entity, EntityEvent, Item, ItemEntity, Source, SourceRun
from app.services import classify, dedupe, scoring
from app.services.search import index_item

logger = logging.getLogger("radar.ingest")


def utcnow() -> datetime:
    return datetime.now(UTC)


def ingest_source(db: Session, source: Source) -> SourceRun:
    """Ingest one source; always returns a persisted SourceRun (success or error)."""
    run = SourceRun(source_id=source.id, started_at=utcnow())
    db.add(run)
    db.flush()
    try:
        if source.source_type in ("rss", "atom"):
            _ingest_feed(db, source, run)
        elif source.source_type == "json_api":
            _ingest_json_api(db, source, run)
        elif source.source_type == "page_watch":
            _ingest_page_watch(db, source, run)
        else:
            raise FetchError(f"Unknown source_type: {source.source_type}")
        run.status = "success"
        source.last_success_at = utcnow()
        source.last_error = None
    except (FetchError, FetchBlockedError, json.JSONDecodeError) as e:
        run.status = "error"
        run.error_message = str(e)[:2000]
        source.last_failure_at = utcnow()
        source.last_error = str(e)[:2000]
        logger.warning("Ingestion failed for %s: %s", source.name, e)
    finally:
        run.finished_at = utcnow()
        db.commit()
    return run


def _fetch(source: Source, url: str):
    return safe_fetch(url, etag=source.http_etag, last_modified=source.http_last_modified)


def _ingest_feed(db: Session, source: Source, run: SourceRun) -> None:
    result = _fetch(source, source.feed_url or source.url)
    run.http_status = result.status_code
    if result.not_modified:
        return
    source.http_etag = result.headers.get("etag")
    source.http_last_modified = result.headers.get("last-modified")
    normalized = parsers.parse_feed(result.content, source.url)
    _persist_items(db, source, run, normalized)


def _ingest_json_api(db: Session, source: Source, run: SourceRun) -> None:
    result = _fetch(source, source.feed_url or source.url)
    run.http_status = result.status_code
    if result.not_modified:
        return
    data = json.loads(result.text)
    mapping = (source.config or {}).get("mapping", {})
    normalized = parsers.parse_json_api(data, mapping, source.url)
    _persist_items(db, source, run, normalized)


def _ingest_page_watch(db: Session, source: Source, run: SourceRun) -> None:
    """Feed-less pages: hash normalized text; on change emit a review signal (DEC-020)."""
    result = safe_fetch(source.url)  # no conditional GET — we hash content ourselves
    run.http_status = result.status_code
    new_hash = parsers.page_text_hash(result.content)
    run.items_found = 1
    if source.page_hash is None:
        source.page_hash = new_hash  # first observation — baseline, no signal
        return
    if source.page_hash == new_hash:
        return
    source.page_hash = new_hash
    title = f"Page changed: {source.name}"
    item = NormalizedToItem(db, source).build(
        parsers.NormalizedItem(
            url=source.url,
            canonical_url=parsers.canonicalize_url(source.url) + f"#change-{utcnow().date()}",
            title=title,
            excerpt="A monitored page changed. Review the source for details "
                    "(hash-based detection; content not auto-parsed).",
            published_at=utcnow(),
            content_hash=new_hash,
        ),
        change_type="update",
    )
    if item is not None:
        run.items_new += 1


class NormalizedToItem:
    """Builds/updates Item rows from NormalizedItems with classification + scoring."""

    def __init__(self, db: Session, source: Source):
        self.db = db
        self.source = source
        self._entities = db.execute(select(Entity)).scalars().all()

    def build(self, n: parsers.NormalizedItem, change_type: str = "new") -> Item | None:
        existing = self.db.execute(
            select(Item).where(
                Item.source_id == self.source.id, Item.canonical_url == n.canonical_url
            )
        ).scalar_one_or_none()

        if existing is not None:
            existing.last_seen_at = utcnow()
            if existing.content_hash != n.content_hash:
                # T-026: document changed
                existing.content_hash = n.content_hash
                existing.title = n.title
                existing.excerpt = n.excerpt
                existing.change_type = "update"
                self._emit_update_events(existing)
                index_item(self.db, existing, self._entity_names(existing))
                return existing
            return None

        categories, jurisdiction = classify.classify(
            n.title, n.excerpt, self.source.category_default, self.source.jurisdiction_code
        )
        result = scoring.score_item(
            categories=categories,
            reliability_tier=self.source.reliability_tier,
            change_type=change_type,
            published_at=n.published_at,
        )
        item = Item(
            source_id=self.source.id,
            url=n.url,
            canonical_url=n.canonical_url,
            content_hash=n.content_hash,
            title=n.title,
            excerpt=n.excerpt,
            published_at=n.published_at,
            categories=categories,
            jurisdiction_code=jurisdiction,
            change_type=change_type,
            impact_score=result.score,
            impact_factors=result.factors,
            confidence=scoring.confidence_for(self.source.reliability_tier),
            raw_metadata=n.raw_metadata or None,
        )
        self.db.add(item)
        self.db.flush()
        self._link_entities(item)
        index_item(self.db, item, self._entity_names(item))
        dedupe.assign_cluster(self.db, item)
        return item

    def _link_entities(self, item: Item) -> None:
        """Deterministic entity linking: entity name appears in the item title.
        Links are evidence only — never mutate curated fields (DEC-014)."""
        title_lower = item.title.lower()
        for entity in self._entities:
            if entity.name.lower() in title_lower:
                self.db.add(ItemEntity(item_id=item.id, entity_id=entity.id, relation="about"))

    def _entity_names(self, item: Item) -> str:
        self.db.flush()
        rows = self.db.execute(
            select(Entity.name).join(ItemEntity).where(ItemEntity.item_id == item.id)
        ).scalars().all()
        return " ".join(rows)

    def _emit_update_events(self, item: Item) -> None:
        rows = self.db.execute(
            select(Entity).join(ItemEntity, ItemEntity.entity_id == Entity.id)
            .where(ItemEntity.item_id == item.id)
        ).scalars().all()
        for entity in rows:
            entity.needs_review = True
            self.db.add(EntityEvent(
                entity_id=entity.id,
                event_type="document_updated",
                occurred_at=utcnow(),
                summary=f"Linked document changed: {item.title}",
                evidence_item_id=item.id,
            ))


def _persist_items(db: Session, source: Source, run: SourceRun,
                   normalized: list[parsers.NormalizedItem]) -> None:
    run.items_found = len(normalized)
    builder = NormalizedToItem(db, source)
    for n in normalized:
        before = n.content_hash
        item = builder.build(n)
        if item is None:
            continue
        if item.change_type == "update" and item.content_hash == before:
            run.items_updated += 1
        else:
            run.items_new += 1


def due_sources(db: Session, force: bool = False) -> list[Source]:
    sources = db.execute(select(Source).where(Source.enabled.is_(True))).scalars().all()
    if force:
        return list(sources)
    now = utcnow()
    due = []
    for s in sources:
        ref = s.last_success_at or s.last_failure_at
        if ref is None:
            due.append(s)
            continue
        if ref.tzinfo is None:
            ref = ref.replace(tzinfo=UTC)
        if now - ref >= timedelta(minutes=s.polling_interval_minutes):
            due.append(s)
    return due


def ingest_all(
    db: Session, force: bool = False, only_source_id: int | None = None
) -> list[SourceRun]:
    runs = []
    targets = due_sources(db, force=force)
    if only_source_id is not None:
        targets = [s for s in targets if s.id == only_source_id] or [
            s for s in db.execute(select(Source).where(Source.id == only_source_id)).scalars()
        ]
    for source in targets:
        runs.append(ingest_source(db, source))
    return runs
