# V1 QA Review — AI Governance Radar

**Date:** 2026-08-11
**Reviewer:** Independent QA (skeptical, did not build the app)
**Build under test:** running instance at `http://localhost:8000` (FastAPI single-process serving built SPA + REST API at `/api`), SQLite `data/radar.db`.

## Method summary

Exercised the live application two ways — API and browser — plus source/data-integrity spot-checks.

**API (PowerShell / curl against `/api`)**
- `health`; OpenAPI path enumeration.
- `items`: list; 8 filter combinations (`category`, `min_impact`, `confidence`, `jurisdiction`, `include_demo=false/true`, `collapse_clusters`, multi-filter AND); pagination disjointness (offsets 0/5/10 → 15 unique ids); `items/{id}` detail; `items/99999` (404); `items/abc` (422).
- `regulations`: full list + verified that **all 7** carry `official_source_url`, `last_verified_at`, and `confidence`; filters `jurisdiction`, `country`, `status`, `government_level`.
- `standards`: list + `publisher` filter (NIST/OWASP/bogus).
- `incidents`: list + detail (id 4) + 404; verified **all 7** carry `fact_status` and `source_links`.
- `search`: `colorado` (grouped entities/regulations); injection-style inputs (`" OR 1 --`, `'; DROP TABLE items; --`, `(`, `AND`, `colorado*`, empty) — no errors, no SQL leakage; `zzzznonexistent` empty.
- `watchlist`: add / duplicate (idempotent, returns existing) / delete / delete-404.
- `dashboard/summary`, `brief`, `dashboard/map`, `sources`, `sources/{id}/runs`.
- `POST /api/sources` SSRF matrix (see QA-1).
- `export` → `import` round-trip; `export/items.csv` (headers + 15 rows).

**Browser (localhost:8000)**
- Visited `/`, `/brief`, `/regulatory`, `/standards`, `/incidents`, `/incidents/4`, `/items`, item detail drawer, `/items?category=ranking`, `/watchlist`, `/entities/colorado-ai-act`, `/search?q=colorado`, `/search?q=zzzznonexistent`, `/settings`, `/nonsense`, `/items/1`.
- Checked against DESIGN_SYSTEM.md; keyboard focus-ring rule; mobile preset (375px) on `/` and `/regulatory`; console errors (`onlyErrors`).

**Data integrity**
- Compared 2 regulations (Colorado AI Act, NYC LL144) and 2 incidents (Arup deepfake, Air Canada) API output field-by-field against `data/seed/entities.json` / `data/seed/incidents.json`.
- Verified all demo items use `example.invalid` URLs and `is_demo=true`.

**Security skim**
- `backend/app/ingestion/safe_fetch.py` (SafeFetcher) and the excerpt sanitization path (`parsers.py`).

---

## Findings

| ID | Severity | Area | Description | Reproduction | Expected vs Actual |
|----|----------|------|-------------|--------------|--------------------|
| QA-1 | **P2** | Security / SSRF (defense-in-depth) | Creation-time `validate_url` only rejects bad schemes and **literal dotted IPs**; hostname and integer-format private targets pass with `201`. | `POST /api/sources` with `http://localhost/x`, `http://localhost:8000/api/health`, `http://2130706433/x` (decimal 127.0.0.1), `http://127.0.0.1.nip.io/x` → all **201 accepted**. (`http://192.168.1.1/x`, `127.0.0.1`, `file://`, `169.254.169.254`, `0.0.0.0`, `[::1]` are correctly 422.) | Expected: private/loopback targets rejected at POST. Actual: only literal IPs checked at POST; DNS names + `2130706433`-style ints deferred to fetch time. **Mitigated:** fetch-time SafeFetcher resolves DNS and blocks — verified: ingesting the `localhost` source produced `error: Blocked non-public address for localhost: ::1`, so no internal fetch actually occurs. Recommend resolving hostnames and normalizing integer IPs inside `validate_url`. |
| QA-2 | **P2** | Data / content state | The running instance holds **only 15 items, all `is_demo=true`**; **zero real ingested feed items**; `source_runs` is empty (NIST News etc. have 0 runs). `include_demo=false` returns **0 items** app-wide, so the Intelligence Feed, dashboard KPIs, Top Developments, and item-search all go empty. | `GET /api/items?include_demo=false` → `total: 0`. `GET /api/sources/1/runs` → `[]`. | The task context stated the DB has "~120 real ingested feed items" — **not true for this instance**. Ingestion capability exists (sources configured, SafeFetcher works) but has never populated real data here. Curated `regulations`/`standards`/`incidents` tables ARE real (`is_demo=false`) and remain populated, so those pages still work with demo off — only item-derived views empty out. Acceptance criterion "several real authoritative sources are ingestible; items searchable" is met as *capability* but unverified as *populated data*. |
| QA-3 | **P3** | Routing | Unknown routes and non-existent detail routes silently render the **Dashboard (Home)** rather than a NotFound view or redirect. | Navigate to `/nonsense` or `/items/1` → dashboard renders, "Home" nav highlighted, URL stays `/nonsense`. | Meets the literal "should not 404-blank" bar, but there is no explicit NotFound state; URL/content mismatch is confusing. (Note: item detail is a right-side **drawer** on `/items`, not a routable page — hence `/items/{id}` has no route.) |
| QA-4 | **P3** | UI state sync | Deep-linking a filter via query string applies the filter to results but does **not** hydrate the filter control. | `GET /items?category=ranking` in browser → 1 result shown ("1-1 of 1", correct), but the **Category dropdown still displays "All"**. | Expected: control reflects the active/URL filter. Actual: applied filter and control state desynced. |
| QA-5 | **P3** | API completeness / manageability | No `DELETE` endpoint for sources. User-added sources (including invalid ones) can only be disabled via `PATCH`, never removed. | `OpenAPI /sources` exposes only `get`/`post`; `/sources/{id}` only `patch`. | Minor: test/bad sources accumulate. (Disclosure: this review created 4 test sources — `b1`, `b4`, `b5`, `evil5` — during SSRF testing; they are disabled but persist and appear in Settings and the `/items` source filter. Re-seed to clean.) |
| QA-6 | **P3** | Test coverage of feature | Dedup/clustering (T-027) is **not demonstrable** with the seeded data: `item_clusters` is empty, every item is standalone, and `collapse_clusters=true` returns the identical 15-item set. | `GET /api/items?collapse_clusters=true` → same `total`/ids as default. | Not a defect, but the clustering path is unexercised by the demo dataset; a multi-source cluster fixture would make it visible. |

**No P0 or P1 findings.** No data-integrity violations, no crashes, no broken core flows, no console errors observed.

---

## What is solid (kept brief)

- **Hard rule — regulation grounding:** all 7 regulations carry `official_source_url` + `last_verified_at` + `confidence`. Colorado AI Act and NYC LL144 match `entities.json` field-for-field (status, dates, penalties, enforcement authority). Nothing invented or dropped. Entity page even surfaces "Verified Jan 15, 2026 — may be stale."
- **Hard rule — incidents:** all 7 carry `fact_status` and `source_links`. Arup and Air Canada match `incidents.json` exactly. Incident detail reads as a security-intelligence report (§24): what happened / root cause / governance + security relevance / mitigation / metadata panel / related-framework cross-links / source evidence / fact-status badge.
- **Hard rule — demo marking:** all 15 demo items are `is_demo=true`, use `example.invalid` URLs, titled `DEMO:`, and render a `DEMO DATA` badge everywhere in the UI.
- **Impact ≠ confidence:** both scored and shown independently; item drawer shows a transparent "why this impact score" factor breakdown (e.g. Category 30 + Tier-1 20 + Change type 20 + recency 15).
- **Security:** SafeFetcher enforces scheme allowlist, DNS resolution + private/reserved/loopback/link-local rejection with IP pinning, per-hop redirect re-validation, size cap, timeouts, rate limiting. Excerpt sanitization uses `nh3.clean(text, tags=set())` (ammonia) → plain text only, ≤~500 chars; no HTML reaches the API, and the React frontend escapes on render. Search inputs (including SQL-injection-style strings) are handled safely with no errors or leakage.
- **Design system:** dark intelligence-terminal aesthetic (near-black `#0B0E14`, dense tables/cards, mono numerals), **badges carry text not just color** (`CRITICAL`, `CONFIRMED`, `CONF HIGH`, `SIGNED`, `T1`…), meaningful empty states (search no-results, brief "No new incident records"), source attribution on item detail (source, pub date, retrieval date, original URL, tier), keyboard focus ring implemented (`:focus-visible` → 2px accent `#4D9FFF` ring with offset), KPI cards click through to filtered views, legal disclaimer in footer.
- **Responsive:** at 375px, `/` has bottom nav (Morning/Home/Watchlist/Incidents) and no body horizontal scroll; `/regulatory`'s wide table scrolls within its own `overflow-x:auto` container (correct pattern).
- **API robustness:** correct 404 (missing id) vs 422 (bad id type); pagination disjoint; export/import round-trips; CSV export well-formed with proper `content-disposition`.

---

## Verdict — against PRODUCT_SPEC.md §9 acceptance criteria

The V1 build **substantially meets** the §9 acceptance criteria as far as could be verified against the running instance, with **no P0/P1 defects**. Data-integrity and source-attribution rules — the highest-priority constraints (§93) — hold under direct inspection: curated regulations, standards, and incidents are grounded in source records with verification timestamps, confidence, and evidence links, and nothing is fabricated. Security defenses (SafeFetcher, sanitization, parameterized/FTS search) are real and effective; the one SSRF gap (QA-1) is at the POST-validation layer only and is caught by the fetch-time chokepoint, so it is a hardening improvement, not an exploitable hole.

**Functional / UI / Data-quality** criteria pass: app serves locally, DB is initialized and seeded, items are searchable and filterable, regulations/standards/incidents are viewable and filterable, watchlist works, attribution and configuration work, the dark responsive aesthetic and loading/empty/error states are present and accessible.

**Criteria I could NOT verify (out of scope for a running-instance review):**
- **Engineering gates** — `ruff`/`mypy`/`pytest`, `eslint`/`tsc`/`vitest`/`vite build` were not run in this pass (TASKS.md claims them DONE; not independently re-run here).
- **Docker deployment** — not verified; per TASKS.md the machine has no Docker and the Dockerfile/compose have never been executed (T-029/T-030 caveats).
- **CI green** — not verified; repo not yet pushed, workflow never executed.
- **Live ingestion of real feeds** — the running instance has **no ingested real items** (QA-2); ingestion is verified only as code + SafeFetcher behavior, not as populated data. "Several real authoritative sources are ingestible" is satisfied as capability, not demonstrated with data.
- **Automated accessibility (axe)** — deferred per T-025 caveat; manual keyboard/focus/contrast checks done here.
- **p95 < 100ms on 10k items** — not run (dataset is ~15 items; T-010 caveat).

Net: a small, coherent, honestly-scoped V1 that delivers the intelligence-dashboard experience with correct, well-attributed data. Address QA-1 (validation hardening) and QA-2 (populate/verify real ingestion, or correct the "120 real items" claim) before calling the ingestion story done; QA-3–QA-6 are polish.

---

## Fix outcomes (implementer, 2026-08-11, post-review)

| ID | Outcome |
|----|---------|
| QA-1 | **Fixed.** `validate_url_deep()` added to SafeFetcher: source creation now resolves hostnames and rejects loopback/private/disguised hosts (`localhost`, decimal-encoded IPs, private-resolving aliases). Regression tests added (Windows rejects decimal IPs at DNS level — either path blocks). Fetch-time chokepoint unchanged. |
| QA-2 | **Fixed.** Root cause: the dev DB was deleted mid-session during the FTS schema fix and only re-seeded, not re-ingested. Re-ran `radar ingest --force`: 115 items incl. ~100 real items from NIST/Federal Register/GOV.UK/arXiv; all 9 enabled sources green; `include_demo=false` now shows real intelligence app-wide. |
| QA-3 | **Fixed.** Explicit NotFound page at `*` route (replaces silent redirect to Dashboard). Verified in browser at `/nonsense`. |
| QA-4 | **Fixed.** `ranking` added to the Items category options; the select now hydrates for all API-known categories. |
| QA-5 | **Fixed.** `DELETE /api/sources/{id}` added: itemless sources delete (runs cascaded); sources with collected items return 409 (provenance preserved) — disable instead. The four QA test sources were removed from the dev DB. |
| QA-6 | **Accepted as-is.** Cross-source clustering is covered by offline pipeline tests (`test_cross_source_clustering`); live feeds rarely produce same-story pairs within the window. No code change. |

All gates re-run after fixes: backend 60 pytest / ruff / mypy clean; frontend eslint / tsc / 11 vitest / production build clean.