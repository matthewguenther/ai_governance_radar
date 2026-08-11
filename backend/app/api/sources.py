"""Source registry + health endpoints (T-006, T-028)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.ingestion.safe_fetch import FetchBlockedError, validate_url
from app.models import Source, SourceRun
from app.schemas.models import SourceCreate, SourceOut, SourcePatch, SourceRunOut

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=list[SourceOut])
def list_sources(db: Session = Depends(get_db)) -> list[Source]:
    return list(db.execute(select(Source).order_by(Source.name)).scalars().all())


@router.post("", response_model=SourceOut, status_code=201)
def create_source(payload: SourceCreate, db: Session = Depends(get_db)) -> Source:
    for url in (payload.url, payload.feed_url):
        if url:
            try:
                validate_url(url)
            except FetchBlockedError as e:
                raise HTTPException(status_code=422, detail=f"URL rejected: {e}") from e
    exists = db.execute(select(Source).where(Source.name == payload.name)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="A source with this name already exists")
    source = Source(**payload.model_dump())
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@router.patch("/{source_id}", response_model=SourceOut)
def patch_source(source_id: int, payload: SourcePatch, db: Session = Depends(get_db)) -> Source:
    source = db.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(source, field, value)
    db.commit()
    db.refresh(source)
    return source


@router.get("/{source_id}/runs", response_model=list[SourceRunOut])
def source_runs(source_id: int, limit: int = 20, db: Session = Depends(get_db)) -> list[SourceRun]:
    if db.get(Source, source_id) is None:
        raise HTTPException(status_code=404, detail="Source not found")
    return list(
        db.execute(
            select(SourceRun).where(SourceRun.source_id == source_id)
            .order_by(SourceRun.started_at.desc()).limit(min(limit, 100))
        ).scalars().all()
    )
