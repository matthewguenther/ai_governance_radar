"""Feed parsing, sanitization, canonicalization."""

from app.ingestion.parsers import (
    canonicalize_url,
    make_excerpt,
    parse_feed,
    parse_json_api,
    sanitize_text,
)


def test_parse_rss_fixture(feed_bytes):
    items = parse_feed(feed_bytes("sample_rss.xml"), "https://example.org")
    assert len(items) == 2  # empty-title entry skipped
    first = items[0]
    assert first.title == "Colorado AI Act enforcement guidance released"
    # tracking params stripped
    assert "utm_source" not in first.canonical_url
    # HTML + script stripped from excerpt
    assert "<" not in (first.excerpt or "")
    assert "alert(" not in (first.excerpt or "")
    assert "new guidance" in (first.excerpt or "")
    assert first.published_at is not None and first.published_at.year == 2026


def test_parse_malformed_feed_salvages_entries(feed_bytes):
    items = parse_feed(feed_bytes("malformed.xml"), "https://example.org")
    assert any(i.title == "Salvageable entry" for i in items)


def test_parse_empty_feed():
    assert parse_feed(b"<?xml version='1.0'?><rss><channel></channel></rss>", "x") == []


def test_sanitize_strips_all_markup():
    dirty = '<img src=x onerror=alert(1)><b>bold</b> <a href="js:x">link</a> text'
    clean = sanitize_text(dirty)
    assert "<" not in clean and "onerror" not in clean
    assert "bold" in clean and "text" in clean


def test_excerpt_truncation():
    text = "word " * 200
    result = make_excerpt(text)
    assert result is not None and len(result) <= 500 and result.endswith("…")


def test_canonicalize_url():
    a = canonicalize_url("HTTPS://Example.org/Path/?utm_source=x&id=2&fbclid=abc#frag")
    assert a == "https://example.org/Path?id=2"


def test_parse_json_api_mapping():
    data = {"results": [
        {"html_url": "https://example.gov/doc/1", "title": "AI rule proposed",
         "abstract": "Summary here", "publication_date": "2026-08-01"},
        {"html_url": "", "title": "skipped — no url"},
    ]}
    mapping = {"items_path": "results", "url": "html_url", "title": "title",
               "summary": "abstract", "published": "publication_date"}
    items = parse_json_api(data, mapping, "https://example.gov")
    assert len(items) == 1
    assert items[0].title == "AI rule proposed"
    assert items[0].published_at is not None


def test_parse_json_api_malformed_shapes():
    assert parse_json_api({"results": "not-a-list"}, {"items_path": "results"}, "x") == []
    assert parse_json_api(None, {}, "x") == []
    assert parse_json_api({"results": [None, 42, "str"]}, {"items_path": "results"}, "x") == []
