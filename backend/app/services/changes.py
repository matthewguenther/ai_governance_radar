"""Watchlist change derivation (§51) — what changed since the user last looked."""

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Entity, EntityEvent, Item, ItemEntity, Source, Watch


@dataclass
class WatchStatus:
    watch_id: int
    target_type: str
    target_key: str
    display_name: str
    status: str  # NO CHANGE | UPDATED | STATUS CHANGE | N NEW ITEMS
    new_items: int
    events: int
    last_change_at: datetime | None


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt


def _category_filter(query, key: str):
    from sqlalchemy import String, cast

    return query.where(cast(Item.categories, String).like(f'%"{key}"%'))


def watch_status(db: Session, watch: Watch) -> WatchStatus:
    ref = _as_utc(watch.last_viewed_at) or _as_utc(watch.created_at) or datetime.now(UTC)
    new_items = 0
    events = 0
    status = "NO CHANGE"
    display = watch.target_key
    last_change: datetime | None = None

    if watch.target_type == "entity":
        entity = db.execute(
            select(Entity).where(Entity.slug == watch.target_key)
        ).scalar_one_or_none()
        if entity is None:
            return WatchStatus(watch.id, watch.target_type, watch.target_key,
                               watch.target_key, "NO CHANGE", 0, 0, None)
        display = entity.name
        ev_rows = db.execute(
            select(EntityEvent).where(
                EntityEvent.entity_id == entity.id, EntityEvent.occurred_at > ref
            )
        ).scalars().all()
        events = len(ev_rows)
        item_rows = db.execute(
            select(Item).join(ItemEntity).where(
                ItemEntity.entity_id == entity.id, Item.first_seen_at > ref
            )
        ).scalars().all()
        new_items = len(item_rows)
        if any(e.event_type == "status_change" for e in ev_rows):
            status = "STATUS CHANGE"
        elif events:
            status = "UPDATED"
        elif new_items:
            status = f"{new_items} NEW ITEM{'S' if new_items != 1 else ''}"
        raw_times = [_as_utc(e.occurred_at) for e in ev_rows] + [
            _as_utc(i.first_seen_at) for i in item_rows
        ]
        valid_times = [t for t in raw_times if t is not None]
        last_change = max(valid_times) if valid_times else None

    elif watch.target_type == "source":
        source = db.get(Source, int(watch.target_key)) if watch.target_key.isdigit() else None
        if source:
            display = source.name
            rows = db.execute(
                select(Item).where(Item.source_id == source.id, Item.first_seen_at > ref)
            ).scalars().all()
            new_items = len(rows)
            times = [t for t in (_as_utc(i.first_seen_at) for i in rows) if t]
            last_change = max(times) if times else None

    elif watch.target_type == "jurisdiction":
        from app.core import jurisdictions

        display = jurisdictions.name_of(watch.target_key)
        rows = db.execute(
            select(Item).where(
                Item.jurisdiction_code == watch.target_key, Item.first_seen_at > ref
            )
        ).scalars().all()
        new_items = len(rows)
        times = [t for t in (_as_utc(i.first_seen_at) for i in rows) if t is not None]
        last_change = max(times) if times else None

    elif watch.target_type == "category":
        display = watch.target_key.capitalize()
        rows = db.execute(
            _category_filter(select(Item).where(Item.first_seen_at > ref), watch.target_key)
        ).scalars().all()
        new_items = len(rows)
        times = [t for t in (_as_utc(i.first_seen_at) for i in rows) if t is not None]
        last_change = max(times) if times else None

    if status == "NO CHANGE" and new_items:
        status = f"{new_items} NEW ITEM{'S' if new_items != 1 else ''}"
    return WatchStatus(watch.id, watch.target_type, watch.target_key, display,
                       status, new_items, events, last_change)


def all_watch_statuses(db: Session) -> list[WatchStatus]:
    watches = db.execute(select(Watch)).scalars().all()
    return [watch_status(db, w) for w in watches]


def changed_count(db: Session) -> int:
    return sum(1 for s in all_watch_statuses(db) if s.status != "NO CHANGE")
