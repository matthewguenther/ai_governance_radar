"""Incidents API (T-016). Default ordering is recency — severity is a sort option."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Incident
from app.schemas.models import IncidentOut

router = APIRouter(prefix="/incidents", tags=["incidents"])

_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    severity: str | None = None,
    category: str | None = None,
    sort: str = Query(default="newest", pattern="^(newest|severity)$"),
    db: Session = Depends(get_db),
) -> list[IncidentOut]:
    q = select(Incident)
    if severity:
        q = q.where(Incident.severity == severity)
    if category:
        q = q.where(Incident.category == category)
    rows = list(db.execute(q).scalars().all())

    def reported(i: Incident) -> float:
        return i.reported_at.timestamp() if i.reported_at else 0.0

    if sort == "severity":
        rows.sort(key=lambda i: (_SEVERITY_ORDER.get(i.severity, 9), -reported(i)))
    else:
        rows.sort(key=lambda i: -reported(i))
    return [IncidentOut.model_validate(i) for i in rows]


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)) -> IncidentOut:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentOut.model_validate(incident)
