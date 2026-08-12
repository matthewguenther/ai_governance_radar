"""Entities, regulations, standards endpoints (T-013, T-015)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.db import get_db
from app.models import Entity, Regulation, Standard
from app.schemas.models import EntityOut

router = APIRouter(tags=["entities"])


@router.get("/entities", response_model=list[EntityOut])
def list_entities(
    entity_type: str | None = None,
    jurisdiction: str | None = None,
    db: Session = Depends(get_db),
) -> list[Entity]:
    q = select(Entity).options(
        joinedload(Entity.regulation), joinedload(Entity.standard), joinedload(Entity.events)
    )
    if entity_type:
        q = q.where(Entity.entity_type == entity_type)
    if jurisdiction:
        q = q.where(Entity.jurisdiction_code == jurisdiction)
    return list(db.execute(q.order_by(Entity.name)).unique().scalars().all())


@router.get("/entities/{slug}", response_model=EntityOut)
def get_entity(slug: str, db: Session = Depends(get_db)) -> Entity:
    entity = db.execute(
        select(Entity).where(Entity.slug == slug).options(
            joinedload(Entity.regulation), joinedload(Entity.standard), joinedload(Entity.events)
        )
    ).unique().scalar_one_or_none()
    if entity is None:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.get("/regulations", response_model=list[EntityOut])
def list_regulations(
    jurisdiction: str | None = None,
    country: str | None = Query(default=None, description="Country prefix, e.g. US matches US-*"),
    status: str | None = None,
    government_level: str | None = None,
    db: Session = Depends(get_db),
) -> list[Entity]:
    q = (
        select(Entity)
        .join(Regulation, Regulation.entity_id == Entity.id)
        .options(joinedload(Entity.regulation), joinedload(Entity.events))
    )
    if jurisdiction:
        q = q.where(Entity.jurisdiction_code == jurisdiction)
    if country:
        q = q.where(
            (Entity.jurisdiction_code == country)
            | (Entity.jurisdiction_code.like(f"{country}-%"))
        )
    if status:
        q = q.where(Regulation.status == status)
    if government_level:
        q = q.where(Regulation.government_level == government_level)
    return list(db.execute(q.order_by(Entity.name)).unique().scalars().all())


@router.get("/standards", response_model=list[EntityOut])
def list_standards(
    publisher: str | None = None,
    status: str | None = None,
    jurisdiction: str | None = None,
    country: str | None = Query(default=None, description="Country prefix, e.g. US matches US-*"),
    db: Session = Depends(get_db),
) -> list[Entity]:
    q = (
        select(Entity)
        .join(Standard, Standard.entity_id == Entity.id)
        .options(joinedload(Entity.standard), joinedload(Entity.events))
    )
    if publisher:
        q = q.where(Standard.publisher == publisher)
    if status:
        q = q.where(Standard.status == status)
    if jurisdiction:
        q = q.where(Entity.jurisdiction_code == jurisdiction)
    if country:
        q = q.where(
            (Entity.jurisdiction_code == country)
            | (Entity.jurisdiction_code.like(f"{country}-%"))
        )
    return list(db.execute(q.order_by(Entity.name)).unique().scalars().all())
