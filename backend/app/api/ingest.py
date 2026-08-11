"""Manual ingestion trigger (POST /api/ingest)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.ingestion.pipeline import ingest_all
from app.schemas.models import SourceRunOut

router = APIRouter(tags=["ingest"])


@router.post("/ingest", response_model=list[SourceRunOut])
def trigger_ingest(
    source_id: int | None = None,
    force: bool = True,
    db: Session = Depends(get_db),
) -> list[SourceRunOut]:
    runs = ingest_all(db, force=force, only_source_id=source_id)
    return [SourceRunOut.model_validate(r) for r in runs]
