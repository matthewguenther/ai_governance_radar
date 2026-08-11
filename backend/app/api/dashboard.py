"""Dashboard summary, morning brief, visit tracking, map data (T-011, T-020, T-021)."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.helpers import item_to_out
from app.core.db import get_db
from app.core.jurisdictions import JURISDICTIONS, country_of
from app.models import Entity, Item
from app.schemas.models import WatchStatusOut
from app.services import brief as brief_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary")
def dashboard_summary(
    window_days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(get_db),
) -> dict:
    return brief_service.dashboard_summary(db, window_days)


@router.post("/visit")
def mark_visit(db: Session = Depends(get_db)) -> dict:
    brief_service.mark_visit(db)
    return {"ok": True}


@router.post("/watchlist/mark-viewed")
def mark_watchlist_viewed(db: Session = Depends(get_db)) -> dict:
    brief_service.mark_watches_viewed(db)
    return {"ok": True}


@router.get("/brief")
def morning_brief(
    window_days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(get_db),
) -> dict:
    data = brief_service.morning_brief(db, window_days)
    return {
        "generated_at": data["generated_at"],
        "since": data["since"],
        "high_impact_items": [
            item_to_out(db, i).model_dump() for i in data["high_impact_items"]
        ],
        "counts": data["counts"],
        "standards_updated": data["standards_updated"],
        "incidents": [
            {"id": i.id, "title": i.title, "severity": i.severity,
             "category": i.category, "reported_at": i.reported_at.isoformat(),
             "fact_status": i.fact_status}
            for i in data["incidents"]
        ],
        "watchlist": {
            "watched": data["watchlist"]["watched"],
            "changed": data["watchlist"]["changed"],
            "entries": [WatchStatusOut(**vars(s)).model_dump()
                        for s in data["watchlist"]["entries"]],
        },
    }


@router.get("/dashboard/map")
def map_data(db: Session = Depends(get_db)) -> list[dict]:
    """Jurisdiction coverage for the choropleth (§21).

    The metric is **what this instance tracks**, not a global ranking: counts of
    tracked governance instruments (regulations, frameworks, and national
    standards) plus recent intelligence volume. Every count therefore has a
    reachable destination in the UI. Color encodes activity volume and never
    implies that regulation is good or bad.

    EU-level instruments are shown over member states because they genuinely
    apply there, but such states carry `via: ["EU"]` and a `link_code` of "EU"
    so clicking lands on the instrument that actually exists.
    """
    recent_cutoff = datetime.now(UTC) - timedelta(days=30)

    # All tracked governance instruments with a jurisdiction, split by whether they
    # are binding law or voluntary guidance. Most AI governance worldwide is soft
    # law: Singapore governs through the Model AI Governance Framework rather than a
    # statute, so counting only regulations would wrongly show it as ungoverned.
    instrument_rows = db.execute(
        select(Entity.jurisdiction_code, Entity.entity_type, func.count(Entity.id))
        .where(Entity.entity_type.in_(("regulation", "standard", "framework")))
        .group_by(Entity.jurisdiction_code, Entity.entity_type)
    ).all()
    item_rows = db.execute(
        select(Item.jurisdiction_code, func.count(Item.id))
        .where(Item.first_seen_at > recent_cutoff, Item.jurisdiction_code.is_not(None))
        .group_by(Item.jurisdiction_code)
    ).all()

    by_country: dict[str, dict] = {}

    def entry_for(code: str | None) -> dict | None:
        if not code:
            return None
        country = country_of(code)
        if country is None:
            return None
        return by_country.setdefault(
            country.code,
            {
                "code": country.code,
                "name": country.name,
                "iso_numeric": country.iso_numeric,
                "instruments": 0,
                "binding": 0,     # laws/regulations with legal force
                "guidance": 0,    # frameworks, standards, voluntary guidance
                "recent_items": 0,
                "link_code": country.code,
                "via": [],
            },
        )

    for code, entity_type, count in instrument_rows:
        entry = entry_for(code)
        if entry:
            entry["instruments"] += count
            key = "binding" if entity_type == "regulation" else "guidance"
            entry[key] += count
    for code, count in item_rows:
        entry = entry_for(code)
        if entry:
            entry["recent_items"] += count

    # EU-level instruments apply in member states; surface them there but point
    # the click at the EU jurisdiction where the records actually live.
    eu = by_country.get("EU")
    if eu and (eu["instruments"] or eu["recent_items"]):
        for j in JURISDICTIONS:
            if j.parent_code == "EU" and j.iso_numeric:
                member = by_country.setdefault(
                    j.code,
                    {
                        "code": j.code, "name": j.name, "iso_numeric": j.iso_numeric,
                        "instruments": 0, "binding": 0, "guidance": 0,
                        "recent_items": 0, "link_code": j.code, "via": [],
                    },
                )
                member["instruments"] += eu["instruments"]
                member["binding"] += eu["binding"]
                member["guidance"] += eu["guidance"]
                member["recent_items"] += eu["recent_items"]
                member["via"].append("EU")
                if member["link_code"] == j.code and not _has_own_records(db, j.code):
                    member["link_code"] = "EU"
    return list(by_country.values())


def _has_own_records(db: Session, jurisdiction_code: str) -> bool:
    return db.execute(
        select(Entity.id).where(Entity.jurisdiction_code == jurisdiction_code).limit(1)
    ).scalar_one_or_none() is not None
