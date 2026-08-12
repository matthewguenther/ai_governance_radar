"""API contract tests against a seeded app (uses the real lifespan → seeded data)."""


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_openapi_docs(client):
    assert client.get("/api/openapi.json").status_code == 200


def test_items_list_and_filters(client):
    r = client.get("/api/items", params={"limit": 5})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 10 and len(body["items"]) == 5
    item = body["items"][0]
    for key in ("title", "url", "impact_score", "confidence", "source_name",
                "first_seen_at", "categories"):
        assert key in item

    r = client.get("/api/items", params={"category": "regulation"})
    assert all("regulation" in i["categories"] for i in r.json()["items"])

    r = client.get("/api/items", params={"min_impact": 70})
    assert all(i["impact_score"] >= 70 for i in r.json()["items"])

    r = client.get("/api/items", params={"jurisdiction": "US-CO"})
    assert all(i["jurisdiction_code"] == "US-CO" for i in r.json()["items"])


def test_items_pagination(client):
    a = client.get("/api/items", params={"limit": 3, "offset": 0}).json()
    b = client.get("/api/items", params={"limit": 3, "offset": 3}).json()
    ids_a = {i["id"] for i in a["items"]}
    ids_b = {i["id"] for i in b["items"]}
    assert ids_a.isdisjoint(ids_b)


def test_item_detail_and_404(client):
    first = client.get("/api/items", params={"limit": 1}).json()["items"][0]
    detail = client.get(f"/api/items/{first['id']}")
    assert detail.status_code == 200
    assert detail.json()["title"] == first["title"]
    assert client.get("/api/items/999999").status_code == 404


def test_regulations_have_provenance(client):
    r = client.get("/api/regulations")
    assert r.status_code == 200
    regs = r.json()
    assert len(regs) >= 5
    for reg in regs:
        assert reg["regulation"]["official_source_url"].startswith("http")
        assert reg["regulation"]["last_verified_at"]
        assert reg["regulation"]["confidence"] in ("high", "medium", "low")


def test_regulations_filters(client):
    r = client.get("/api/regulations", params={"country": "US"})
    assert all(e["jurisdiction_code"].startswith("US") for e in r.json())
    r = client.get("/api/regulations", params={"status": "effective"})
    assert all(e["regulation"]["status"] == "effective" for e in r.json())


def test_standards(client):
    r = client.get("/api/standards")
    assert len(r.json()) >= 5
    r = client.get("/api/standards", params={"publisher": "NIST"})
    assert all(e["standard"]["publisher"] == "NIST" for e in r.json())
    assert len(r.json()) >= 2


def test_every_map_marker_leads_somewhere_real(client):
    """A marker that opens an empty page is worse than no marker. Jurisdictions
    tracked only via a framework must route to Standards, not the Regulatory
    Radar, which lists binding law only."""
    for row in client.get("/api/dashboard/map").json():
        if not row["instruments"]:
            continue
        if row["binding"] > 0:
            results = client.get("/api/regulations", params={"country": row["link_code"]}).json()
        else:
            results = client.get("/api/standards", params={"country": row["link_code"]}).json()
        assert results, f"{row['code']} marker would open an empty page"


def test_incidents_sorted_and_detail(client):
    r = client.get("/api/incidents")
    incidents = r.json()
    assert len(incidents) >= 5
    for inc in incidents:
        assert inc["fact_status"]
        assert inc["source_links"]
    detail = client.get(f"/api/incidents/{incidents[0]['id']}")
    assert detail.status_code == 200
    assert client.get("/api/incidents/999999").status_code == 404


def test_entity_timeline(client):
    r = client.get("/api/entities/colorado-ai-act")
    assert r.status_code == 200
    entity = r.json()
    assert entity["regulation"]["status"] == "signed"
    assert len(entity["events"]) >= 3
    assert client.get("/api/entities/nope").status_code == 404


def test_removed_features_are_gone(client):
    """Watchlist and Morning Brief were removed (DEC-028); their routes must not
    linger as half-working surfaces."""
    for path in ("/api/watchlist", "/api/watchlist/status", "/api/brief", "/api/visit"):
        assert client.get(path).status_code == 404, path


def test_search_grouped(client):
    r = client.get("/api/search", params={"q": "colorado"})
    assert r.status_code == 200
    body = r.json()
    assert any("Colorado" in i["title"] for i in body["items"])
    assert any(e["slug"] == "colorado-ai-act" for e in body["entities"])
    # incidents search
    r = client.get("/api/search", params={"q": "Air Canada"})
    assert any("Air Canada" in i["title"] for i in r.json()["incidents"])
    # FTS injection safety: quotes must not crash
    assert client.get("/api/search", params={"q": '"malicious" OR 1'}).status_code == 200


def test_dashboard_summary(client):
    body = client.get("/api/dashboard/summary", params={"window_days": 30}).json()
    for key in ("high_impact", "total_changes", "new_incidents",
                "sources_ok", "sources_total", "since"):
        assert key in body
    # Source health must reflect enabled sources only.
    enabled = [s for s in client.get("/api/sources").json() if s["enabled"]]
    assert body["sources_total"] == len(enabled)
    assert body["sources_ok"] <= body["sources_total"]


def test_map_data(client):
    rows = client.get("/api/dashboard/map").json()
    by_code = {r["code"]: r for r in rows}

    us = by_code.get("US")
    assert us is not None and us["instruments"] >= 1 and us["iso_numeric"] == "840"
    assert us["link_code"] == "US" and us["via"] == []

    # Non-regulation instruments count too, so jurisdictions tracked only via a
    # framework (Singapore's Model AI Governance Framework) still appear.
    sg = by_code.get("SG")
    assert sg is not None and sg["instruments"] >= 1

    # EU-level instruments show over member states, but the click-through must
    # point at the EU record rather than a jurisdiction with no records.
    fr = by_code.get("FR")
    assert fr is not None and fr["instruments"] >= 1
    assert fr["via"] == ["EU"] and fr["link_code"] == "EU"


def test_items_default_sort_is_newest(client):
    items = client.get("/api/items", params={"limit": 10}).json()["items"]
    stamps = [i["published_at"] or i["first_seen_at"] for i in items]
    assert stamps == sorted(stamps, reverse=True)


def test_incidents_sort_options(client):
    newest = client.get("/api/incidents").json()
    assert [i["reported_at"] for i in newest] == sorted(
        [i["reported_at"] for i in newest], reverse=True
    )
    by_sev = client.get("/api/incidents", params={"sort": "severity"}).json()
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    ranks = [order[i["severity"]] for i in by_sev]
    assert ranks == sorted(ranks)


def test_sources_api_and_ssrf_rejection(client, monkeypatch):
    sources = client.get("/api/sources").json()
    assert len(sources) >= 8
    # SSRF: private/disguised URLs rejected on creation (QA-1).
    # (localhost + decimal-IP resolve via the OS locally — no network involved.)
    for bad in ("http://169.254.169.254/latest", "http://localhost:9/x", "http://2130706433/"):
        r = client.post("/api/sources", json={"name": f"Evil {bad}", "url": bad,
                                              "source_type": "rss"})
        assert r.status_code == 422, bad
    # valid create + patch round-trip — stub DNS for the public host (no network in tests)
    from app.ingestion import safe_fetch

    real_resolve = safe_fetch._resolve_and_check
    monkeypatch.setattr(
        safe_fetch, "_resolve_and_check",
        lambda host: "93.184.215.14" if host == "example.org" else real_resolve(host),
    )
    r = client.post("/api/sources", json={
        "name": "Test Source X", "url": "https://example.org/x", "source_type": "rss"})
    assert r.status_code == 201
    sid = r.json()["id"]
    r = client.patch(f"/api/sources/{sid}", json={"enabled": False})
    assert r.json()["enabled"] is False
    assert client.get(f"/api/sources/{sid}/runs").status_code == 200
    # QA-5: itemless source can be deleted; deletion is permanent
    assert client.delete(f"/api/sources/{sid}").status_code == 204
    assert client.delete(f"/api/sources/{sid}").status_code == 404


def test_source_with_items_cannot_be_deleted(client):
    items = client.get("/api/items", params={"limit": 1}).json()["items"]
    assert items, "seeded items expected"
    full = client.get(f"/api/items/{items[0]['id']}").json()
    source = next(s for s in client.get("/api/sources").json()
                  if s["name"] == full["source_name"])
    assert client.delete(f"/api/sources/{source['id']}").status_code == 409


def test_export_import_roundtrip(client):
    export = client.get("/api/export").json()
    assert export["sources"], "source configuration should be exportable"
    r = client.post("/api/import", json=export)
    assert r.status_code == 200 and r.json()["sources_updated"] >= 1
    csv_r = client.get("/api/export/items.csv")
    assert csv_r.status_code == 200 and csv_r.text.startswith("id,title")


def test_jurisdictions_reference(client):
    rows = client.get("/api/jurisdictions").json()
    codes = {r["code"] for r in rows}
    assert {"US", "US-CO", "EU", "SG"} <= codes


def test_demo_data_flagged(client):
    r = client.get("/api/items", params={"include_demo": False})
    assert all(not i["is_demo"] for i in r.json()["items"])
