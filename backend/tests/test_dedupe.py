"""Dedup/clustering: positive and negative title-match cases (T-027)."""

from app.services.dedupe import normalize_title, titles_match


def test_identical_titles_match():
    assert titles_match(
        "Colorado AI Act becomes effective",
        "Colorado AI Act Becomes Effective",
    )


def test_containment_match_requires_length():
    assert titles_match(
        "Colorado AI Act becomes effective June 30 statewide",
        "BREAKING: Colorado AI Act becomes effective June 30 statewide, firms scramble",
    )
    # short containment must NOT merge
    assert not titles_match("AI Act", "Colorado AI Act becomes effective")


def test_negative_pairs_do_not_match():
    pairs = [
        ("Colorado AI Act becomes effective", "Texas AI Act becomes effective"),
        ("NIST updates AI RMF", "NIST updates privacy framework"),
        ("EU opens AI Act consultation", "EU closes AI Act consultation"),
    ]
    for a, b in pairs:
        assert not titles_match(a, b), (a, b)


def test_normalize_strips_stopwords_and_punctuation():
    assert normalize_title("The State of the AI Act!") == normalize_title("state AI act")
