"""Dashboard summary, morning brief, visit tracking, map data (T-011, T-020, T-021)."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.helpers import item_to_out
from app.core.db import get_db
from app.core.jurisdictions import JURISDICTIONS, country_of
from app.models import Entity, Item, Regulation
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
    """Country-level regulatory activity for the choropleth (§21). Metric is labeled
    by the frontend; color never implies good/bad regulation."""
    recent_cutoff = datetime.now(UTC) - timedelta(days=30)

    reg_rows = db.execute(
        select(Entity.jurisdiction_code, func.count(Entity.id))
        .join(Regulation, Regulation.entity_id == Entity.id)
        .group_by(Entity.jurisdiction_code)
    ).all()
    item_rows = db.execute(
        select(Item.jurisdiction_code, func.count(Item.id))
        .where(Item.first_seen_at > recent_cutoff, Item.jurisdiction_code.is_not(None))
        .group_by(Item.jurisdiction_code)
    ).all()

    by_country: dict[str, dict] = {}

    def bucket(code: str | None):
        if not code:
            return None
        country = country_of(code)
        if country is None:
            return None
        entry = by_country.setdefault(
            country.code,
            {"code": country.code, "name": country.name,
             "iso_numeric": country.iso_numeric, "regulations": 0, "recent_items": 0,
             "members": []},
        )
        return entry

    for code, count in reg_rows:
        entry = bucket(code)
        if entry:
            entry["regulations"] += count
    for code, count in item_rows:
        entry = bucket(code)
        if entry:
            entry["recent_items"] += count

    # EU activity should light up member states on the map
    eu = by_country.get("EU")
    if eu:
        for j in JURISDICTIONS:
            if j.parent_code == "EU" and j.iso_numeric:
                member = by_country.setdefault(
                    j.code,
                    {"code": j.code, "name": j.name, "iso_numeric": j.iso_numeric,
                     "regulations": 0, "recent_items": 0, "members": []},
                )
                member["regulations"] += eu["regulations"]
                member["recent_items"] += eu["recent_items"]
                member["members"].append("EU")
    return list(by_country.values())
