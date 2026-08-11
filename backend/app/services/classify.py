"""Deterministic rule-based classification (DEC-007 — no LLM in V1).

Source defaults + keyword rules assign categories and jurisdiction. Transparent and
unit-tested; wrong guesses are cheap because they only affect grouping, never
structured legal facts (DEC-014).
"""

import re

CATEGORY_RULES: list[tuple[str, str]] = [
    (r"\b(regulation|regulatory|legislation|law|act|bill|statute|executive order|directive|"
     r"rulemaking|compliance deadline)\b", "regulation"),
    (r"\b(standard|framework|iso/iec|iso \d+|nist (ai|sp|rmf)|rmf|atlas|top 10|guideline)\b",
     "standard"),
    (r"\b(incident|breach|leak(ed|age)?|failure|harm|outage|compromise[d]?)\b", "incident"),
    (r"\b(security|vulnerab|exploit|attack|injection|jailbreak|malware|threat|cve|"
     r"red.team|adversarial)\b", "security"),
    (r"\b(research|study|paper|preprint|arxiv|benchmark|evaluation)\b", "research"),
    (r"\b(webinar|conference|summit|workshop|symposium|register|event)\b", "event"),
    (r"\b(training|certification|certificate|course|curriculum|exam)\b", "training"),
    (r"\b(index|ranking|readiness)\b", "ranking"),
]

JURISDICTION_RULES: list[tuple[str, str]] = [
    (r"\bcolorado\b", "US-CO"),
    (r"\bcalifornia\b", "US-CA"),
    (r"\bnew york city\b|\bnyc\b|\blocal law 144\b", "US-NYC"),
    (r"\bnew york\b", "US-NY"),
    (r"\btexas\b", "US-TX"),
    (r"\butah\b", "US-UT"),
    (r"\bconnecticut\b", "US-CT"),
    (r"\billinois\b", "US-IL"),
    (r"\bwashington state\b", "US-WA"),
    (r"\b(eu|european union|european commission|ai act)\b", "EU"),
    (r"\b(uk|united kingdom|britain)\b", "GB"),
    (r"\bsingapore\b", "SG"),
    (r"\bcanada\b|\bcanadian\b", "CA"),
    (r"\baustralia\b", "AU"),
    (r"\bjapan\b", "JP"),
    (r"\b(south korea|korea)\b", "KR"),
    (r"\bchina\b|\bchinese\b", "CN"),
    (r"\bindia\b", "IN"),
    (r"\b(uae|united arab emirates)\b", "AE"),
    (r"\bbrazil\b", "BR"),
    (r"\bunesco\b", "INTL-UNESCO"),
    (r"\boecd\b", "INTL-OECD"),
    (r"\b(united states|federal|white house|congress|nist|cisa|ftc)\b", "US"),
]

_compiled_cat = [(re.compile(p, re.I), c) for p, c in CATEGORY_RULES]
_compiled_jur = [(re.compile(p, re.I), j) for p, j in JURISDICTION_RULES]


def classify(title: str, excerpt: str | None, category_default: str | None,
             source_jurisdiction: str | None) -> tuple[list[str], str | None]:
    """Return (categories, jurisdiction_code)."""
    text = f"{title} {excerpt or ''}"
    categories: list[str] = []
    for pattern, cat in _compiled_cat:
        if pattern.search(text) and cat not in categories:
            categories.append(cat)
    if category_default and category_default not in categories:
        categories.insert(0, category_default)
    if not categories:
        categories = ["news"]

    jurisdiction = None
    for pattern, code in _compiled_jur:
        if pattern.search(text):
            jurisdiction = code
            break
    return categories, jurisdiction or source_jurisdiction
