"""Ingestion pipeline: fixture-driven, offline (safe_fetch mocked)."""

from datetime import UTC, datetime

from sqlalchemy import select

from app.ingestion import pipeline
from app.ingestion.safe_fetch import FetchError, FetchResult
from app.models import Entity, EntityEvent, Item, Source, SourceRun


def _mk_source(db, name="Fixture Feed", stype="rss", **kw):
    src = Source(name=name, url="https://example.org/news",
                 feed_url="https://example.org/feed.xml", source_type=stype,
                 reliability_tier=kw.pop("tier", 1), **kw)
    db.add(src)
    db.commit()
    return src


def _fake_fetch(content: bytes):
    def fake(url, **kwargs):
        return FetchResult(url=url, final_url=url, status_code=200, content=content)
    return fake


def test_feed_ingest_creates_items(clean_db, feed_bytes, monkeypatch):
    db = clean_db
    src = _mk_source(db)
    monkeypatch.setattr(pipeline, "safe_fetch", _fake_fetch(feed_bytes("sample_rss.xml")))
    run = pipeline.ingest_source(db, src)
    assert run.status == "success"
    assert run.items_new == 2
    items = db.execute(select(Item)).scalars().all()
    assert len(items) == 2
    item = next(i for i in items if "Colorado" in i.title)
    assert item.url.startswith("https://example.org/news/colorado-guidance")
    assert "utm_source" not in item.canonical_url
    assert item.first_seen_at is not None and item.excerpt
    assert "regulation" in item.categories
    assert item.jurisdiction_code == "US-CO"
    assert item.impact_score > 0 and item.impact_factors


def test_reingest_is_idempotent(clean_db, feed_bytes, monkeypatch):
    db = clean_db
    src = _mk_source(db)
    monkeypatch.setattr(pipeline, "safe_fetch", _fake_fetch(feed_bytes("sample_rss.xml")))
    pipeline.ingest_source(db, src)
    run2 = pipeline.ingest_source(db, src)
    assert run2.items_new == 0
    assert len(db.execute(select(Item)).scalars().all()) == 2


def test_changed_content_emits_update_and_entity_event(clean_db, feed_bytes, monkeypatch):
    db = clean_db
    entity = Entity(slug="colorado-ai-act", name="Colorado AI Act", entity_type="regulation")
    db.add(entity)
    db.commit()
    src = _mk_source(db)
    monkeypatch.setattr(pipeline, "safe_fetch", _fake_fetch(feed_bytes("sample_rss.xml")))
    pipeline.ingest_source(db, src)
    monkeypatch.setattr(
        pipeline, "safe_fetch", _fake_fetch(feed_bytes("sample_rss_updated.xml"))
    )
    run2 = pipeline.ingest_source(db, src)
    assert run2.items_updated == 1
    assert len(db.execute(select(Item)).scalars().all()) == 2  # no duplicate
    updated = db.execute(
        select(Item).where(Item.change_type == "update")
    ).scalars().one()
    assert "UPDATED" in (updated.excerpt or "")
    events = db.execute(select(EntityEvent)).scalars().all()
    assert any(e.event_type == "document_updated" and e.entity_id == entity.id
               for e in events)
    db.refresh(entity)
    assert entity.needs_review is True


def test_fetch_failure_logged_never_silent(clean_db, monkeypatch):
    db = clean_db
    src = _mk_source(db)

    def boom(url, **kwargs):
        raise FetchError("HTTP 500 from example.org")

    monkeypatch.setattr(pipeline, "safe_fetch", boom)
    run = pipeline.ingest_source(db, src)
    assert run.status == "error"
    assert "500" in (run.error_message or "")
    db.refresh(src)
    assert src.last_error and src.last_failure_at is not None
    assert db.execute(select(SourceRun)).scalars().all()  # run row persisted


def test_page_watch_baseline_then_change(clean_db, monkeypatch):
    db = clean_db
    src = _mk_source(db, name="Watched Page", stype="page_watch")

    monkeypatch.setattr(pipeline, "safe_fetch",
                        _fake_fetch(b"<html><body>Version one content</body></html>"))
    run1 = pipeline.ingest_source(db, src)
    assert run1.status == "success" and run1.items_new == 0  # baseline only

    monkeypatch.setattr(pipeline, "safe_fetch",
                        _fake_fetch(b"<html><body>Version TWO content changed</body></html>"))
    run2 = pipeline.ingest_source(db, src)
    assert run2.items_new == 1
    item = db.execute(select(Item)).scalars().one()
    assert item.title.startswith("Page changed:")
    assert item.change_type == "update"


def test_cross_source_clustering(clean_db, feed_bytes, monkeypatch):
    db = clean_db
    src1 = _mk_source(db, name="Official Source", tier=1)
    src2 = _mk_source(db, name="News Outlet", tier=3)
    src2.feed_url = "https://other.example.com/feed.xml"
    db.commit()

    rss = feed_bytes("sample_rss.xml")
    other = rss.replace(b"example.org", b"other.example.com")
    monkeypatch.setattr(pipeline, "safe_fetch", _fake_fetch(rss))
    pipeline.ingest_source(db, src1)
    monkeypatch.setattr(pipeline, "safe_fetch", _fake_fetch(other))
    pipeline.ingest_source(db, src2)

    items = db.execute(select(Item)).scalars().all()
    assert len(items) == 4
    clustered = [i for i in items if i.cluster_id is not None]
    assert len(clustered) == 4  # both stories matched across sources
    from app.models import ItemCluster

    clusters = db.execute(select(ItemCluster)).scalars().all()
    assert len(clusters) == 2
    for cluster in clusters:
        primary = db.get(Item, cluster.primary_item_id)
        assert primary.source_id == src1.id  # tier-1 wins primary (§62)


def test_due_sources_respects_interval(clean_db):
    db = clean_db
    src = _mk_source(db)
    src.last_success_at = datetime.now(UTC)
    db.commit()
    assert src not in pipeline.due_sources(db)
    assert src in pipeline.due_sources(db, force=True)
