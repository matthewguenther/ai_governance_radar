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


def test_watchlist_roundtrip(client):
    r = client.post("/api/watchlist",
                    json={"target_type": "entity", "target_key": "eu-ai-act"})
    assert r.status_code == 201
    watch_id = r.json()["id"]
    # duplicate returns same watch
    r2 = client.post("/api/watchlist",
                     json={"target_type": "entity", "target_key": "eu-ai-act"})
    assert r2.json()["id"] == watch_id
    # unknown entity 404
    assert client.post("/api/watchlist",
                       json={"target_type": "entity", "target_key": "ghost"}).status_code == 404
    statuses = client.get("/api/watchlist/status").json()
    assert any(s["target_key"] == "eu-ai-act" for s in statuses)
    assert client.delete(f"/api/watchlist/{watch_id}").status_code == 204
    assert client.delete(f"/api/watchlist/{watch_id}").status_code == 404


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


def test_dashboard_summary_and_brief(client):
    r = client.get("/api/dashboard/summary", params={"window_days": 30})
    body = r.json()
    for key in ("high_impact", "total_changes", "new_incidents",
                "new_opportunities", "watch_changed"):
        assert key in body
    brief = client.get("/api/brief", params={"window_days": 30}).json()
    assert "high_impact_items" in brief and "counts" in brief and "watchlist" in brief


def test_map_data(client):
    rows = client.get("/api/dashboard/map").json()
    us = next((r for r in rows if r["code"] == "US"), None)
    assert us is not None and us["regulations"] >= 1 and us["iso_numeric"] == "840"
    # EU regulations propagate to member states
    fr = next((r for r in rows if r["code"] == "FR"), None)
    assert fr is not None and fr["regulations"] >= 1


def test_sources_api_and_ssrf_rejection(client):
    sources = client.get("/api/sources").json()
    assert len(sources) >= 8
    # SSRF: private URL rejected on creation
    r = client.post("/api/sources", json={
        "name": "Evil", "url": "http://169.254.169.254/latest", "source_type": "rss"})
    assert r.status_code == 422
    # valid create + patch round-trip
    r = client.post("/api/sources", json={
        "name": "Test Source X", "url": "https://example.org/x", "source_type": "rss"})
    assert r.status_code == 201
    sid = r.json()["id"]
    r = client.patch(f"/api/sources/{sid}", json={"enabled": False})
    assert r.json()["enabled"] is False
    assert client.get(f"/api/sources/{sid}/runs").status_code == 200


def test_export_import_roundtrip(client):
    client.post("/api/watchlist", json={"target_type": "entity", "target_key": "nist-ai-rmf"})
    export = client.get("/api/export").json()
    assert any(w["target_key"] == "nist-ai-rmf" for w in export["watches"])
    r = client.post("/api/import", json=export)
    assert r.status_code == 200
    csv_r = client.get("/api/export/items.csv")
    assert csv_r.status_code == 200 and csv_r.text.startswith("id,title")


def test_jurisdictions_reference(client):
    rows = client.get("/api/jurisdictions").json()
    codes = {r["code"] for r in rows}
    assert {"US", "US-CO", "EU", "SG"} <= codes


def test_demo_data_flagged(client):
    r = client.get("/api/items", params={"category": "training"})
    assert all(i["is_demo"] for i in r.json()["items"])
    r = client.get("/api/items", params={"include_demo": False})
    assert all(not i["is_demo"] for i in r.json()["items"])
