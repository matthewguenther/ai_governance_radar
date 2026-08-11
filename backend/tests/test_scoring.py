"""Scoring: deterministic, bounded, transparent."""

from datetime import UTC, datetime, timedelta

from app.services.scoring import confidence_for, score_item

NOW = datetime(2026, 8, 11, tzinfo=UTC)


def test_high_impact_regulation_from_tier1():
    r = score_item(["regulation"], 1, "status_change", NOW - timedelta(hours=4), now=NOW)
    assert r.score >= 70
    assert any("Category: regulation" in f["factor"] for f in r.factors)
    assert any("Tier 1" in f["factor"] for f in r.factors)
    assert sum(f["points"] for f in r.factors) == r.score


def test_low_impact_old_tier4_news():
    r = score_item(["news"], 4, "new", NOW - timedelta(days=90), now=NOW)
    assert r.score < 30


def test_score_bounded_0_100():
    r = score_item(["regulation", "standard", "incident", "security"], 1,
                   "status_change", NOW, watched_match=True, now=NOW)
    assert 0 <= r.score <= 100


def test_deterministic():
    args = (["standard"], 2, "update", NOW - timedelta(days=1))
    assert score_item(*args, now=NOW).score == score_item(*args, now=NOW).score


def test_confidence_independent_of_impact():
    # tier-4 source, hot regulation news → high impact possible, but low confidence
    r = score_item(["regulation"], 4, "status_change", NOW, now=NOW)
    c = confidence_for(4)
    assert r.score >= 50 and c == "low"


def test_tier4_never_high_confidence():
    assert confidence_for(4, corroborating_sources=0) == "low"
    assert confidence_for(4, corroborating_sources=5) != "high"


def test_disputed_always_low():
    assert confidence_for(1, fact_status="disputed") == "low"
