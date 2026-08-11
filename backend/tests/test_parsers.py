"""Feed parsing, sanitization, canonicalization."""

from app.ingestion.parsers import (
    canonicalize_url,
    make_excerpt,
    parse_event_jsonld,
    parse_feed,
    parse_json_api,
    parse_sitemap_urls,
    sanitize_text,
)

EVENT_PAGE = """
<html><head>
<script type="application/ld+json">{"@type":"Organization","name":"Site"}</script>
<script type="application/ld+json">{
  "@context":"https://schema.org","@type":"Event","name":"AI Governance Summit 2026",
  "startDate":"2026-09-14T09:00:00+00:00","endDate":"2026-09-16T17:00:00+00:00",
  "location":{"@type":"Place","name":"Marina Bay Sands",
    "address":{"@type":"PostalAddress","addressLocality":"Singapore","addressCountry":"Singapore"}},
  "organizer":{"@type":"Organization","name":"IMDA","url":"https://example.org/imda"},
  "description":"<p>Three-day summit on <b>AI governance</b>.</p>"
}</script>
</head><body>ignored</body></html>
"""


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


def test_parse_event_jsonld_extracts_schema_org_event():
    item = parse_event_jsonld(EVENT_PAGE, "https://example.org/events/summit")
    assert item is not None
    assert item.title == "AI Governance Summit 2026"
    ev = item.raw_metadata["event"]
    assert ev["start"].startswith("2026-09-14")
    assert ev["end"].startswith("2026-09-16")
    assert "Marina Bay Sands" in ev["location"] and "Singapore" in ev["location"]
    assert ev["organizer"] == "IMDA"
    # An event's date is not a publication date.
    assert item.published_at is None
    # Description is sanitized to plain text.
    assert item.excerpt and "<" not in item.excerpt and "AI governance" in item.excerpt


def test_parse_event_jsonld_degrades_safely():
    """Pages without Event markup yield nothing rather than garbage — the point of
    parsing structured data instead of scraping HTML."""
    assert parse_event_jsonld("<html><body>No structured data</body></html>", "u") is None
    assert parse_event_jsonld(
        '<script type="application/ld+json">{not json}</script>', "u") is None
    assert parse_event_jsonld(
        '<script type="application/ld+json">{"@type":"Article","name":"x"}</script>', "u") is None


def test_parse_sitemap_urls_filters_by_path():
    xml = """<urlset><url><loc>https://e.org/events/a</loc></url>
             <url><loc>https://e.org/blog/b</loc></url>
             <url><loc>https://e.org/events/c</loc></url></urlset>"""
    assert parse_sitemap_urls(xml, "/events/") == ["https://e.org/events/a", "https://e.org/events/c"]
    assert len(parse_sitemap_urls(xml)) == 3


def test_parse_json_api_malformed_shapes():
    assert parse_json_api({"results": "not-a-list"}, {"items_path": "results"}, "x") == []
    assert parse_json_api(None, {}, "x") == []
    assert parse_json_api({"results": [None, 42, "str"]}, {"items_path": "results"}, "x") == []
