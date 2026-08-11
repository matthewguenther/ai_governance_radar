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


def test_non_ai_items_cannot_be_high_impact():
    """A tier-1 government feed can carry unrelated news; it must not present as
    a high-impact AI governance signal."""
    r = score_item(["regulation"], 1, "status_change", NOW, now=NOW, ai_relevant=False)
    assert r.score <= 25
    assert any("No AI-specific relevance" in f["factor"] for f in r.factors)
    # The displayed breakdown must still sum to the score shown to the user.
    assert sum(f["points"] for f in r.factors) == r.score


def test_ai_relevance_detection():
    from app.services.classify import is_ai_relevant

    assert is_ai_relevant("Colorado AI Act guidance released", None)
    assert is_ai_relevant("New rules for machine learning systems", None)
    assert is_ai_relevant("Anthropic model behaviour study", None)
    assert not is_ai_relevant("PM starts roll out of everyday fixes on cost of living", None)
    assert not is_ai_relevant("Applications open for Chevening Scholarships", None)


def test_classifier_precision_on_common_false_positives():
    """Terms that previously mis-classified items must no longer do so."""
    from app.services.classify import classify

    # "Federal Register" must not read as an event; "AI training" is model
    # training, not professional development. Both categories were retired
    # entirely (DEC-027), so nothing should ever be labelled with them.
    cats, _ = classify("Notice published in the Federal Register on AI systems", None, None, None)
    assert "event" not in cats
    cats, _ = classify("Meta halts AI training after investigation", None, None, None)
    assert "training" not in cats
    cats, _ = classify("IAPP webinar: operationalizing AI governance", None, None, None)
    assert "event" not in cats
    # Defensive research must not read as an incident.
    cats, _ = classify("Breach-Aware Prompt Injection Shielding for LLMs", None, None, None)
    assert "incident" not in cats
    # Genuine incidents still classify.
    cats, _ = classify("Court revives lawsuit claiming AI software fueled harm", None, None, None)
    assert "incident" in cats
