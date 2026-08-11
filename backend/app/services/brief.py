"""Deterministic Morning Brief + dashboard summary (§25, DEC-013). Pure aggregation."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import String, cast, func, select
from sqlalchemy.orm import Session

from app.models import AppState, Incident, Item, Standard, Watch
from app.services.changes import all_watch_statuses
from app.services.scoring import HIGH_IMPACT_THRESHOLD

LAST_VISIT_KEY = "last_visit_at"


def get_last_visit(db: Session) -> datetime | None:
    row = db.get(AppState, LAST_VISIT_KEY)
    if row and isinstance(row.value, str):
        try:
            return datetime.fromisoformat(row.value)
        except ValueError:
            return None
    return None


def mark_visit(db: Session, include_watches: bool = False) -> None:
    now = datetime.now(UTC).isoformat()
    row = db.get(AppState, LAST_VISIT_KEY)
    if row is None:
        db.add(AppState(key=LAST_VISIT_KEY, value=now))
    else:
        row.value = now
    if include_watches:
        for watch in db.execute(select(Watch)).scalars():
            watch.last_viewed_at = datetime.now(UTC)
    db.commit()


def mark_watches_viewed(db: Session) -> None:
    """Reset watch deltas — called when the user actually views the watchlist."""
    for watch in db.execute(select(Watch)).scalars():
        watch.last_viewed_at = datetime.now(UTC)
    db.commit()


def _since(db: Session, window_days: int | None) -> datetime:
    """Coverage window: explicit window, or since-last-visit with a 24h floor so the
    brief always covers at least a full day (§25 — frequent visits shouldn't blank it)."""
    now = datetime.now(UTC)
    if window_days:
        return now - timedelta(days=window_days)
    last_visit = get_last_visit(db) or (now - timedelta(days=7))
    return min(last_visit, now - timedelta(hours=24))


def _cat_count(db: Session, since: datetime, category: str) -> int:
    return db.execute(
        select(func.count(Item.id)).where(
            Item.first_seen_at > since,
            cast(Item.categories, String).like(f'%"{category}"%'),
        )
    ).scalar_one()


def dashboard_summary(db: Session, window_days: int | None = None) -> dict:
    since = _since(db, window_days)
    high_impact = db.execute(
        select(func.count(Item.id)).where(
            Item.first_seen_at > since, Item.impact_score >= HIGH_IMPACT_THRESHOLD
        )
    ).scalar_one()
    total = db.execute(
        select(func.count(Item.id)).where(Item.first_seen_at > since)
    ).scalar_one()
    incidents = db.execute(
        select(func.count(Incident.id)).where(Incident.reported_at > since)
    ).scalar_one()
    opportunities = _cat_count(db, since, "training") + _cat_count(db, since, "event")
    statuses = all_watch_statuses(db)
    return {
        "since": since.isoformat(),
        "high_impact": high_impact,
        "total_changes": total,
        "new_incidents": incidents,
        "new_opportunities": opportunities,
        "watch_count": len(statuses),
        "watch_changed": sum(1 for s in statuses if s.status != "NO CHANGE"),
    }


def morning_brief(db: Session, window_days: int | None = None) -> dict:
    since = _since(db, window_days)
    top = db.execute(
        select(Item)
        .where(Item.first_seen_at > since, Item.impact_score >= HIGH_IMPACT_THRESHOLD)
        .order_by(Item.impact_score.desc(), Item.published_at.desc())
        .limit(7)
    ).scalars().all()
    standards_updated = db.execute(
        select(func.count(Standard.entity_id)).where(
            Standard.last_updated_at.is_not(None), Standard.last_updated_at > since
        )
    ).scalar_one()
    incidents = db.execute(
        select(Incident).where(Incident.reported_at > since)
        .order_by(Incident.severity, Incident.reported_at.desc()).limit(10)
    ).scalars().all()
    statuses = all_watch_statuses(db)
    return {
        "generated_at": datetime.now(UTC).isoformat(),
        "since": since.isoformat(),
        "high_impact_items": top,
        "counts": {
            "regulation": _cat_count(db, since, "regulation"),
            "standard": _cat_count(db, since, "standard"),
            "security": _cat_count(db, since, "security"),
            "research": _cat_count(db, since, "research"),
            "news": _cat_count(db, since, "news"),
            "training": _cat_count(db, since, "training"),
            "event": _cat_count(db, since, "event"),
        },
        "standards_updated": standards_updated,
        "incidents": incidents,
        "watchlist": {
            "watched": len(statuses),
            "changed": sum(1 for s in statuses if s.status != "NO CHANGE"),
            "entries": statuses,
        },
    }
