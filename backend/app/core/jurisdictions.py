"""Static jurisdiction reference data (DEC-018 — a module, not a table).

Codes follow DATA_MODEL.md: countries are ISO-3166 alpha-2, US states are `US-XX`,
supranational/intergovernmental bodies use `EU` / `INTL-*`. `iso_numeric` matches the
Natural Earth / world-atlas TopoJSON country ids used by the frontend choropleth.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Jurisdiction:
    code: str
    name: str
    kind: str  # country | state | city | supranational | intergov
    parent_code: str | None = None
    iso_numeric: str | None = None  # world-atlas country id (countries only)


JURISDICTIONS: list[Jurisdiction] = [
    Jurisdiction("GLOBAL", "Global", "intergov"),
    # Countries
    Jurisdiction("US", "United States", "country", iso_numeric="840"),
    Jurisdiction("GB", "United Kingdom", "country", iso_numeric="826"),
    Jurisdiction("SG", "Singapore", "country", iso_numeric="702"),
    Jurisdiction("CA", "Canada", "country", iso_numeric="124"),
    Jurisdiction("AU", "Australia", "country", iso_numeric="036"),
    Jurisdiction("JP", "Japan", "country", iso_numeric="392"),
    Jurisdiction("KR", "South Korea", "country", iso_numeric="410"),
    Jurisdiction("CN", "China", "country", iso_numeric="156"),
    Jurisdiction("IN", "India", "country", iso_numeric="356"),
    Jurisdiction("AE", "United Arab Emirates", "country", iso_numeric="784"),
    Jurisdiction("BR", "Brazil", "country", iso_numeric="076"),
    Jurisdiction("FR", "France", "country", parent_code="EU", iso_numeric="250"),
    Jurisdiction("DE", "Germany", "country", parent_code="EU", iso_numeric="276"),
    Jurisdiction("IT", "Italy", "country", parent_code="EU", iso_numeric="380"),
    Jurisdiction("ES", "Spain", "country", parent_code="EU", iso_numeric="724"),
    Jurisdiction("NL", "Netherlands", "country", parent_code="EU", iso_numeric="528"),
    Jurisdiction("IE", "Ireland", "country", parent_code="EU", iso_numeric="372"),
    # Supranational / intergovernmental
    Jurisdiction("EU", "European Union", "supranational"),
    Jurisdiction("INTL-OECD", "OECD", "intergov"),
    Jurisdiction("INTL-UNESCO", "UNESCO", "intergov"),
    Jurisdiction("INTL-UN", "United Nations", "intergov"),
    Jurisdiction("INTL-G7", "G7", "intergov"),
    # US states / cities tracked in V1
    Jurisdiction("US-CO", "Colorado", "state", parent_code="US"),
    Jurisdiction("US-CA", "California", "state", parent_code="US"),
    Jurisdiction("US-NY", "New York", "state", parent_code="US"),
    Jurisdiction("US-TX", "Texas", "state", parent_code="US"),
    Jurisdiction("US-UT", "Utah", "state", parent_code="US"),
    Jurisdiction("US-CT", "Connecticut", "state", parent_code="US"),
    Jurisdiction("US-IL", "Illinois", "state", parent_code="US"),
    Jurisdiction("US-WA", "Washington", "state", parent_code="US"),
    Jurisdiction("US-NYC", "New York City", "city", parent_code="US-NY"),
]

BY_CODE: dict[str, Jurisdiction] = {j.code: j for j in JURISDICTIONS}


def is_valid(code: str) -> bool:
    return code in BY_CODE


def name_of(code: str) -> str:
    j = BY_CODE.get(code)
    return j.name if j else code


def country_of(code: str) -> Jurisdiction | None:
    """Walk up parents until a country/supranational jurisdiction (for the map)."""
    j = BY_CODE.get(code)
    while j is not None:
        if j.kind in ("country", "supranational"):
            return j
        j = BY_CODE.get(j.parent_code) if j.parent_code else None
    return None
