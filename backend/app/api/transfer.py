"""Import/export (T-022, §53): JSON config round-trip + CSV item export."""

import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Item, Source, Watch

router = APIRouter(tags=["transfer"])


@router.get("/export")
def export_config(db: Session = Depends(get_db)) -> dict:
    watches = db.execute(select(Watch)).scalars().all()
    sources = db.execute(select(Source)).scalars().all()
    return {
        "version": 1,
        "watches": [
            {"target_type": w.target_type, "target_key": w.target_key} for w in watches
        ],
        "sources": [
            {"name": s.name, "enabled": s.enabled,
             "polling_interval_minutes": s.polling_interval_minutes}
            for s in sources
        ],
    }


class ImportPayload(BaseModel):
    version: int = 1
    watches: list[dict] = []
    sources: list[dict] = []


@router.post("/import")
def import_config(payload: ImportPayload, db: Session = Depends(get_db)) -> dict:
    added_watches = 0
    for w in payload.watches:
        t, k = w.get("target_type"), w.get("target_key")
        if not t or not k or t not in ("entity", "source", "jurisdiction", "category"):
            continue
        exists = db.execute(
            select(Watch).where(Watch.target_type == t, Watch.target_key == k)
        ).scalar_one_or_none()
        if exists is None:
            db.add(Watch(target_type=t, target_key=k))
            added_watches += 1
    updated_sources = 0
    for s in payload.sources:
        source = db.execute(
            select(Source).where(Source.name == s.get("name"))
        ).scalar_one_or_none()
        if source is None:
            continue
        if "enabled" in s:
            source.enabled = bool(s["enabled"])
        if "polling_interval_minutes" in s:
            try:
                source.polling_interval_minutes = max(15, int(s["polling_interval_minutes"]))
            except (TypeError, ValueError):
                pass
        updated_sources += 1
    db.commit()
    return {"watches_added": added_watches, "sources_updated": updated_sources}


@router.get("/export/items.csv")
def export_items_csv(db: Session = Depends(get_db)) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "title", "url", "source", "published_at", "first_seen_at",
                     "categories", "jurisdiction", "impact", "confidence", "is_demo"])
    for item in db.execute(select(Item)).scalars():
        writer.writerow([
            item.id, item.title, item.url,
            item.source.name if item.source else "",
            item.published_at.isoformat() if item.published_at else "",
            item.first_seen_at.isoformat() if item.first_seen_at else "",
            "|".join(item.categories or []),
            item.jurisdiction_code or "", item.impact_score, item.confidence, item.is_demo,
        ])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=radar-items.csv"},
    )
