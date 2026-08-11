"""Transparent, deterministic impact + confidence scoring (§63/§64, DEC-007).

Impact 0-100 from additive weighted factors; every applied factor is persisted so the
UI can answer "Why is this high impact?". Confidence is independent of impact.
"""

from dataclasses import dataclass
from datetime import UTC, datetime

# Category weights: how inherently governance-significant a category is.
CATEGORY_POINTS = {
    "regulation": 30,
    "standard": 25,
    "incident": 25,
    "security": 20,
    "research": 12,
    "news": 8,
    "training": 6,
    "event": 6,
    "ranking": 10,
}

TIER_POINTS = {1: 20, 2: 12, 3: 6, 4: 0}

CHANGE_TYPE_POINTS = {
    "status_change": 20,
    "update": 10,
    "new": 5,
}

HIGH_IMPACT_THRESHOLD = 70

# Items with no AI-specific relevance can never present as significant governance
# signal, regardless of source authority or recency.
NO_AI_RELEVANCE_CAP = 25


@dataclass
class ScoreResult:
    score: int
    factors: list[dict]  # [{"factor": str, "points": int}]


def score_item(
    categories: list[str],
    reliability_tier: int,
    change_type: str | None,
    published_at: datetime | None,
    watched_match: bool = False,
    now: datetime | None = None,
    ai_relevant: bool = True,
) -> ScoreResult:
    now = now or datetime.now(UTC)
    factors: list[dict] = []

    cat_points = max((CATEGORY_POINTS.get(c, 0) for c in categories), default=0)
    top_cat = max(categories, key=lambda c: CATEGORY_POINTS.get(c, 0), default=None)
    if cat_points and top_cat:
        factors.append({"factor": f"Category: {top_cat}", "points": cat_points})

    tier_points = TIER_POINTS.get(reliability_tier, 0)
    if tier_points:
        factors.append(
            {"factor": f"Tier {reliability_tier} source authority", "points": tier_points}
        )

    if change_type:
        ct_points = CHANGE_TYPE_POINTS.get(change_type, 0)
        if ct_points:
            factors.append({"factor": f"Change type: {change_type}", "points": ct_points})

    if published_at is not None:
        if published_at.tzinfo is None:
            published_at = published_at.replace(tzinfo=UTC)
        age_days = max((now - published_at).total_seconds() / 86400, 0)
        if age_days <= 2:
            factors.append({"factor": "Published within 48 hours", "points": 15})
        elif age_days <= 7:
            factors.append({"factor": "Published within 7 days", "points": 8})

    if watched_match:
        factors.append({"factor": "Matches your watchlist", "points": 15})

    score = min(sum(f["points"] for f in factors), 100)

    if not ai_relevant and score > NO_AI_RELEVANCE_CAP:
        # Recorded as a negative factor so the displayed breakdown still sums to
        # the final score (the UI explains every point).
        factors.append({
            "factor": "No AI-specific relevance detected — impact capped",
            "points": NO_AI_RELEVANCE_CAP - score,
        })
        score = NO_AI_RELEVANCE_CAP

    return ScoreResult(score=score, factors=factors)


def confidence_for(reliability_tier: int, corroborating_sources: int = 0,
                   fact_status: str | None = None) -> str:
    """Confidence independent of impact (§64). Tier-4 alone is never high (§31)."""
    if fact_status in ("alleged", "disputed"):
        return "low"
    if reliability_tier == 1:
        return "high"
    if reliability_tier == 2:
        return "high" if corroborating_sources >= 1 else "medium"
    if reliability_tier == 3:
        return "medium" if corroborating_sources >= 1 else "medium"
    return "medium" if corroborating_sources >= 2 else "low"
