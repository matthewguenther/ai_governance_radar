"""Health + reference data endpoints."""

from fastapi import APIRouter

from app import __version__
from app.core.jurisdictions import JURISDICTIONS
from app.schemas.models import JurisdictionOut

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "version": __version__}


@router.get("/jurisdictions", response_model=list[JurisdictionOut])
def jurisdictions() -> list[JurisdictionOut]:
    return [
        JurisdictionOut(code=j.code, name=j.name, kind=j.kind,
                        parent_code=j.parent_code, iso_numeric=j.iso_numeric)
        for j in JURISDICTIONS
    ]
