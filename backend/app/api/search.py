"""Search API (T-018): FTS5 items + entities + incidents, grouped client-side by type."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.helpers import item_to_out
from app.core.db import get_db
from app.models import Incident, Item
from app.schemas.models import EntityBrief, IncidentOut, ItemOut
from app.services.search import search_entities, search_item_ids

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: str = Query(min_length=1, max_length=200),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    ids = search_item_ids(db, q, limit=limit)
    items: list[ItemOut] = []
    if ids:
        rows = db.execute(select(Item).where(Item.id.in_(ids))).scalars().all()
        by_id = {r.id: r for r in rows}
        items = [item_to_out(db, by_id[i]) for i in ids if i in by_id]

    entities = [EntityBrief.model_validate(e) for e in search_entities(db, q)]

    pattern = f"%{q.strip()}%"
    incident_rows = db.execute(
        select(Incident).where(
            (Incident.title.ilike(pattern)) | (Incident.what_happened.ilike(pattern))
        ).limit(25)
    ).scalars().all()
    incidents = [IncidentOut.model_validate(i) for i in incident_rows]

    return {
        "query": q,
        "items": [i.model_dump() for i in items],
        "entities": [e.model_dump() for e in entities],
        "incidents": [i.model_dump() for i in incidents],
    }
