"""Watchlist API (T-017)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import jurisdictions
from app.core.db import get_db
from app.models import Entity, Source, Watch
from app.schemas.models import WatchCreate, WatchOut, WatchStatusOut
from app.services.changes import all_watch_statuses

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchOut])
def list_watches(db: Session = Depends(get_db)) -> list[Watch]:
    return list(db.execute(select(Watch).order_by(Watch.created_at)).scalars().all())


@router.get("/status", response_model=list[WatchStatusOut])
def watch_statuses(db: Session = Depends(get_db)) -> list[WatchStatusOut]:
    return [WatchStatusOut(**vars(s)) for s in all_watch_statuses(db)]


@router.post("", response_model=WatchOut, status_code=201)
def add_watch(payload: WatchCreate, db: Session = Depends(get_db)) -> Watch:
    # Validate the target exists
    if payload.target_type == "entity":
        if not db.execute(
            select(Entity).where(Entity.slug == payload.target_key)
        ).scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Entity not found")
    elif payload.target_type == "source":
        source = db.get(Source, int(payload.target_key)) if payload.target_key.isdigit() else None
        if source is None:
            raise HTTPException(status_code=404, detail="Source not found")
    elif payload.target_type == "jurisdiction":
        if not jurisdictions.is_valid(payload.target_key):
            raise HTTPException(status_code=404, detail="Unknown jurisdiction")

    existing = db.execute(
        select(Watch).where(
            Watch.target_type == payload.target_type, Watch.target_key == payload.target_key
        )
    ).scalar_one_or_none()
    if existing:
        return existing
    watch = Watch(target_type=payload.target_type, target_key=payload.target_key)
    db.add(watch)
    db.commit()
    db.refresh(watch)
    return watch


@router.delete("/{watch_id}", status_code=204)
def remove_watch(watch_id: int, db: Session = Depends(get_db)) -> None:
    watch = db.get(Watch, watch_id)
    if watch is None:
        raise HTTPException(status_code=404, detail="Watch not found")
    db.delete(watch)
    db.commit()
