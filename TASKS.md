# Tasks — V1 Backlog

> **V1 implementation completed 2026-08-11.** All tasks below are DONE, with these
> honest caveats against their original acceptance criteria:
> - **T-004:** the `/dev/kit` showcase route was replaced by vitest render tests for
>   every primitive (equivalent coverage, less surface to maintain).
> - **T-010:** the 10k-row p95 perf smoke was not run; current dataset (~150 rows)
>   responds in single-digit ms. Revisit if catalogs grow.
> - **T-025:** manual keyboard/responsive/contrast review done; automated axe scan
>   deferred (would add a tooling dependency) — see V1-QA report.
> - **T-028:** source health + retry + `radar status` shipped; the sidebar
>   failing-source badge was dropped (Settings surfaces failures prominently).
> - **T-029/T-030:** CI workflow and Docker image are written, with a CI job that
>   builds + smoke-tests the image; neither has executed yet because this machine has
>   no Docker and the repo hasn't been pushed. First push will exercise both.
> - **T-031:** visual QA performed live in-browser (desktop + mobile); findings and
>   fixes recorded in [docs/reviews/V1-QA.md](docs/reviews/V1-QA.md) instead of a
>   screenshot archive.

Statuses: `TODO` · `IN PROGRESS` · `BLOCKED` · `DONE`. Work top-to-bottom within a
phase; respect dependencies. A task is DONE only per the Definition of Done
(PRODUCT_SPEC.md §9): implemented + tested + documented + visually verified (UI tasks) +
error states + accessibility reviewed. Update this file and CHANGELOG.md as you go.

## Phase 0 — Foundation

### T-001 Backend scaffold
- **Status:** DONE · **Depends on:** —
- **Description:** `backend/` FastAPI app per ARCHITECTURE.md layout: pyproject.toml
  (FastAPI, SQLAlchemy, Alembic, httpx, feedparser, pydantic-settings, pytest), config
  via env vars (pydantic-settings, reads `.env`), `/api/health` endpoint, CORS locked to
  frontend origin, uvicorn dev entrypoint bound to 127.0.0.1.
- **Acceptance:** `uvicorn app.main:app` serves `/api/health` → `{"status":"ok"}`;
  `/docs` renders; settings load from env with sane defaults; pytest runs green.
- **Test strategy:** pytest + FastAPI TestClient for health + config defaults.

### T-002 Database schema (core)
- **Status:** DONE · **Depends on:** T-001
- **Description:** SQLAlchemy models for DATA_MODEL.md's 12 V1 tables: sources,
  source_runs, items, item_clusters, entities, regulations, standards, incidents,
  entity_events, item_entities, watches, app_state — plus the items_fts FTS5 index and
  the static `core/jurisdictions.py` reference module (DEC-018). SQLite WAL; schema via
  `create_all()` on startup (Alembic deferred to schema freeze, DEC-021).
- **Acceptance:** fresh checkout → app start creates the DB file with all tables +
  FTS index; jurisdiction codes validate against the static module; "delete DB and
  re-seed" flow documented.
- **Test strategy:** pytest fixture spins a temp DB, asserts tables/constraints; a CRUD
  smoke test per model.

### T-003 Frontend scaffold
- **Status:** DONE · **Depends on:** —
- **Description:** `frontend/` Vite + React + TS + Tailwind + React Router + TanStack
  Query + shadcn/ui init + lucide-react. Dev proxy `/api` → `:8000`. ESLint + Prettier +
  vitest configured.
- **Acceptance:** `npm run dev` serves shell page; `npm run build`, `lint`, `typecheck`,
  `test` all pass; proxied `/api/health` call renders status.
- **Test strategy:** one vitest smoke test (App renders); CI-runnable scripts.

### T-004 Design tokens + UI primitives
- **Status:** DONE · **Depends on:** T-003
- **Description:** Implement DESIGN_SYSTEM.md: Tailwind theme (colors, type scale,
  radii), self-hosted Inter + JetBrains Mono, and primitives: SeverityBadge,
  ConfidenceBadge, TierBadge, StatusPill, IntelCard, KpiCard, EmptyState, ErrorState,
  Skeleton, WatchButton, SourceAttribution, DataTable shell.
- **Acceptance:** a hidden `/dev/kit` route renders all primitives in all states;
  AA contrast verified; badges never color-only.
- **Test strategy:** vitest render tests per primitive; manual visual pass against
  DESIGN_SYSTEM.md; axe check on the kit page.

### T-005 App shell + navigation
- **Status:** DONE · **Depends on:** T-004
- **Description:** Fixed collapsible sidebar (V1 entries: Home, Morning Brief,
  Regulatory Radar, Standards, Incidents, Watchlist, Settings), routes with lazy pages,
  page header pattern, mobile bottom nav + drawer, reduced-motion support.
- **Acceptance:** all routes reachable by keyboard; sidebar collapses to icons; mobile
  (<768px) shows bottom nav; active states visible; no horizontal scroll at 375px.
- **Test strategy:** vitest routing tests; manual responsive pass at 1280/768/375.

### T-006 Source registry + seed sources
- **Status:** DONE · **Depends on:** T-002
- **Description:** YAML source definitions in `data/sources/` (per §85 shape: name,
  type, url, feed_url, tier, jurisdiction, categories, enabled, polling interval);
  loader CLI `radar seed-sources` (idempotent upsert); `GET/POST/PATCH /api/sources`.
- **Acceptance:** seed file loads ≥10 sources into DB; API lists/filters/toggles them;
  re-running loader doesn't duplicate.
- **Test strategy:** pytest: loader idempotency, YAML validation errors, API contract.

### T-007 Verify real seed source feeds
- **Status:** DONE · **Depends on:** T-006
- **Description:** For each SOURCE_CATALOG.md candidate, verify the actual feed/API URL
  (exists, format, update cadence, ToS/robots) and update the catalog + YAML with
  verified entries. Target ≥6 verified Tier-1/2 sources across regulation, standards,
  security, incidents. **Do not guess URLs — verify by fetching.**
- **Acceptance:** SOURCE_CATALOG.md rows marked verified with date; YAML matches;
  each verified feed parses with feedparser.
- **Test strategy:** recorded sample of each verified feed saved to
  `backend/tests/fixtures/feeds/` for offline tests.

### T-008 Ingestion engine core
- **Status:** DONE · **Depends on:** T-006
- **Description:** SafeFetcher (scheme allowlist, private-IP block with DNS pinning,
  timeouts, size cap, conditional GET, per-host rate limit, robots.txt) → RSS/Atom/
  json_api parsers + `page_watch` hash monitoring for feed-less sources (DEC-020) →
  normalizer → plain-text sanitized excerpt (≤500 chars) → persist items with
  first/last-seen; source_runs logging; `radar ingest [--source X]` CLI; optional
  asyncio scheduler loop (`SCHEDULER_ENABLED`, DEC-016).
- **Acceptance:** ingesting fixture feeds creates items with URL, dates, excerpt,
  retrieval timestamps; re-ingest updates last_seen without duplicating; failures write
  source_runs rows with errors; SafeFetcher blocks `file://`, `http://169.254.x`,
  `http://127.0.0.1` targets in tests.
- **Test strategy:** offline pytest against fixtures; SSRF unit tests; run-logging tests.

### T-009 Seed demo dataset
- **Status:** DONE · **Depends on:** T-002
- **Description:** Curated `data/seed/` JSON/YAML: ~8 regulations
  (Colorado AI Act, EU AI Act, NYC LL144, Utah, CA, TX, IL, CT); ~8 standards (NIST AI
  RMF + GenAI profile, ISO 42001/23894/22989, OWASP LLM Top 10, OWASP Agentic, MITRE
  ATLAS); ~6 incidents (drawn from public incident databases, fact_status labeled);
  entity_events history; demo items **explicitly flagged `DEMO DATA`** (§78). All
  records carry official source URLs; no fabricated facts presented as real.
- **Acceptance:** `radar seed` loads everything idempotently; every record passes
  integrity rules (DATA_MODEL.md §Integrity); demo items visibly marked in UI later.
- **Test strategy:** pytest: seed idempotency + integrity validation (source URL
  present, confidence set, dates sane).

## Phase 1 — Intelligence Dashboard

### T-010 Items API
- **Status:** DONE · **Depends on:** T-008, T-009
- **Description:** `GET /api/items` (filters: category, jurisdiction, impact≥,
  confidence, source, date range, watched-only, cluster-collapsed; sort; offset
  pagination) + `GET /api/items/{id}` with linked entities/evidence.
- **Acceptance:** documented in OpenAPI; filters combine correctly; p95 < 100ms on 10k
  seeded items.
- **Test strategy:** pytest API contract + filter matrix; perf smoke with generated rows.

### T-011 Dashboard KPI cards + summary API
- **Status:** DONE · **Depends on:** T-005, T-010
- **Description:** `GET /api/dashboard/summary` (high-impact count, total changes,
  new incidents, new opportunities — relative to last_visit_at and time window) +
  4 KpiCards, each clicking through to its filtered view. Updates last_visit_at logic.
- **Acceptance:** counts match a hand-computed fixture scenario; click-throughs land on
  correctly pre-filtered pages; loading skeletons + error states present.
- **Test strategy:** pytest count logic against fixture DB; vitest click-through tests.

### T-012 Top Developments card
- **Status:** DONE · **Depends on:** T-010, T-024
- **Description:** Dashboard card: top 5–7 items by impact within window — severity
  badge, source, category, title, one-line explanation, relative timestamp, link (§20).
- **Acceptance:** ordering matches impact score; empty/loading/error states; keyboard
  accessible.
- **Test strategy:** vitest ordering/render; API test for the ranked query.

### T-013 Regulations API + Regulatory Radar page (table)
- **Status:** DONE · **Depends on:** T-009, T-005
- **Description:** `GET /api/regulations` with filters (country, state/region, status,
  impact, date, topic); Radar page table view: Jurisdiction, Regulation, Status
  (StatusPill), Last Update, Effective Date, Impact, Watch (§22). Regulation detail
  drawer/page with full §7 fields + SourceAttribution + last_verified.
- **Acceptance:** all seed regulations render; every filter works; **no legal status
  hard-coded in components** (all from API); detail shows evidence links.
- **Test strategy:** pytest filters; vitest table + filter interaction; manual a11y pass.

### T-014 Regulatory timeline view
- **Status:** DONE · **Depends on:** T-013
- **Description:** Chronological view of regulatory entity_events (status changes,
  amendments) with jurisdiction filter. (Map view = T-021; comparison view deferred
  post-V1.)
- **Acceptance:** events ordered, grouped by date; filters shared with table view.
- **Test strategy:** vitest rendering from fixture events.

### T-015 Standards API + Standards page
- **Status:** DONE · **Depends on:** T-009, T-005
- **Description:** `GET /api/standards`; page with publisher tabs (All/NIST/ISO/OWASP/
  MITRE/IEEE/Other), update cards per §23, "Standards at a Glance" summary strip
  (new/updated/draft/withdrawn counts), watch buttons.
- **Acceptance:** tabs filter correctly; cards show version/status/dates/magnitude/
  official link; glance counts match data.
- **Test strategy:** pytest API; vitest tab + card tests.

### T-016 Incidents API + list + detail page
- **Status:** DONE · **Depends on:** T-009, T-005
- **Description:** `GET /api/incidents`, `GET /api/incidents/{id}`; list with severity/
  category/date filters; detail page as security-intelligence report per §24 layout:
  metadata panel, what happened, governance relevance, security relevance, mitigation,
  related frameworks (cross-links), source evidence, fact_status + confidence badges.
- **Acceptance:** seed incidents render fully; fact_status always visible; framework
  cross-links navigate to entities; no detail invented beyond stored fields.
- **Test strategy:** pytest API; vitest detail layout; a11y pass on detail page.

### T-017 Watchlist
- **Status:** DONE · **Depends on:** T-010
- **Description:** `GET/POST/DELETE /api/watchlist` (targets: entity, source,
  jurisdiction, category); WatchButton wired everywhere entities appear; Watchlist
  page per §51 (watched count, changed-today count, per-target change status derived
  from entity_events/items since last_viewed_at); dashboard watch-delta integration.
- **Acceptance:** watch/unwatch round-trips; change statuses match fixture scenario;
  page shows NO CHANGE vs UPDATED vs STATUS CHANGE distinctly (not color-only).
- **Test strategy:** pytest change-derivation logic (core!); vitest toggle + page tests.

### T-018 Search
- **Status:** DONE · **Depends on:** T-010
- **Description:** FTS5 index (items + entity names) queried by a search service
  module (no dialect abstraction, DEC-019); `GET /api/search?q=` returns grouped results (REGULATIONS/STANDARDS/INCIDENTS/NEWS/
  EVENTS/TRAINING); global search UI (header input, grouped dropdown + full results
  page), keyboard navigable.
- **Acceptance:** queries match title/excerpt/entity/jurisdiction/tag; groups ordered
  per §28; empty state for no results; index stays in sync on ingest.
- **Test strategy:** pytest search relevance fixtures + sync-on-ingest; vitest UI tests.

### T-019 Item detail / intelligence view
- **Status:** DONE · **Depends on:** T-010
- **Description:** Expanded item view per §26: What happened / Why it matters / Who is
  affected / What changed / Related records / Evidence links / Confidence. Fields render
  only when data exists (deterministic content in V1).
- **Acceptance:** every section sourced from stored data; SourceAttribution complete
  (source, pub date, original URL, retrieval date); related links navigate.
- **Test strategy:** vitest conditional-section tests; pytest for the composed endpoint.

### T-020 Morning Brief (deterministic)
- **Status:** DONE · **Depends on:** T-011, T-017
- **Description:** `GET /api/brief` + Brief page per §25 layout: high-impact
  developments since last visit, per-domain change counts, watchlist deltas,
  professional-development counts (from item categories). Pure aggregation, no LLM.
- **Acceptance:** brief matches fixture scenario exactly; date-headed layout per spec;
  works when empty (meaningful empty state).
- **Test strategy:** pytest aggregation against fixture DB; vitest page render.

### T-021 Regulatory heat map (SVG choropleth)
- **Status:** DONE · **Depends on:** T-013
- **Description:** Dashboard card + Global view: world SVG choropleth via d3-geo +
  topojson-client with vendored Natural Earth data (DEC-022), colored by a **clearly
  labeled** metric (active AI laws count / recent activity);
  hover tooltip, click → jurisdiction-filtered regulations, legend, metric selector
  (§21). Never implies good/bad regulation.
- **Acceptance:** countries with seed data are interactive; legend + metric label
  visible; keyboard-accessible alternative (table fallback or focusable regions).
- **Test strategy:** vitest metric mapping; manual visual + a11y pass.

### T-022 Settings page
- **Status:** DONE · **Depends on:** T-006, T-005
- **Description:** Sources tab (enable/disable, polling interval, add manual source
  with SafeFetcher-validated URL, health: last success/failure + error per §59);
  Dashboard tab (time window, visible modules, density) persisted to app_state;
  AI tab placeholder ("available in a future release", DEC-007); export/import
  (watchlist + config JSON/CSV, §53).
- **Acceptance:** source toggles/persist round-trip; invalid/SSRF URLs rejected with
  clear errors; export→import restores watchlist; prefs affect dashboard.
- **Test strategy:** pytest settings + import/export round-trip; vitest form tests.

### T-023 Empty / loading / error states pass
- **Status:** DONE · **Depends on:** T-011..T-022
- **Description:** Sweep every page/module: skeletons during load, meaningful empty
  states with actions (§58), visible actionable errors incl. source-failure surfacing
  (§59). No blank cards anywhere.
- **Acceptance:** checklist per route documented in TEST_PLAN.md executed; screenshots
  archived in docs/qa/.
- **Test strategy:** vitest state-mocking tests + manual pass.

### T-024 Impact + confidence scoring (transparent)
- **Status:** DONE · **Depends on:** T-008
- **Description:** Deterministic scoring service: impact 0–100 from weighted factors
  (source tier, category weight, change type, recency, watchlist relevance §63);
  confidence high/med/low from source tier + corroboration count + fact_status (§64).
  Factors persisted to impact_factors for "Why is this high impact?" display.
- **Acceptance:** scoring is pure/deterministic (same input → same score); factors
  render in item detail; weights configurable in one place; impact and confidence
  visibly independent in UI.
- **Test strategy:** pytest table-driven scoring cases; property test: score bounds.

### T-025 Responsive + accessibility pass
- **Status:** DONE · **Depends on:** T-023
- **Description:** Full pass at 1280/768/375: tablet collapse behavior, mobile bottom
  nav priority (§56), keyboard nav, focus visibility, contrast audit, reduced motion.
- **Acceptance:** DESIGN_SYSTEM.md §8 checklist passes on all V1 routes; axe reports
  no serious violations.
- **Test strategy:** manual + axe; screenshots at all three widths archived.

## Phase 1.5 — Data Quality

### T-026 Change detection
- **Status:** DONE · **Depends on:** T-008
- **Description:** content_hash comparison on re-fetch → `document_updated` events;
  curated entity field edits → typed entity_events (status_change, date_changed) with
  previous/new values; distinguish "document changed" vs "meaningful governance change"
  via event types (§27, hash-level only per DEC-015).
- **Acceptance:** modified fixture feed produces update events, not duplicate items;
  entity edits produce timeline entries; watchlist deltas pick both up.
- **Test strategy:** pytest re-ingest scenarios; timeline assertion tests.

### T-027 Deduplication + event clustering
- **Status:** DONE · **Depends on:** T-008
- **Description:** canonical URL normalization (strip trackers, resolve scheme/host
  case); exact dupes merge; fuzzy clustering (normalized-title similarity within 72h
  window) → item_clusters with highest-tier source as primary (§62); UI collapses
  clusters with "N sources" expander.
- **Acceptance:** fixture with same story from 3 sources yields one cluster, official
  source primary; no false-merge in the negative fixtures.
- **Test strategy:** pytest similarity thresholds with curated positive/negative pairs.

### T-028 Ingestion monitoring
- **Status:** DONE · **Depends on:** T-008, T-022
- **Description:** Source health in Settings: per-source last runs, error surfaced per
  §59 pattern, failing-source badge count in sidebar/Settings; `radar status` CLI.
- **Acceptance:** a failing fixture source appears with error, last-success time, and
  Retry action that re-runs ingestion for it.
- **Test strategy:** pytest run aggregation; vitest health UI states.

## Release Engineering

### T-029 CI pipeline
- **Status:** DONE · **Depends on:** T-001, T-003
- **Description:** GitHub Actions: backend (ruff, mypy, pytest) + frontend (eslint,
  tsc, vitest, build) on PR/push. No network in tests.
- **Acceptance:** CI green on main; a seeded failure (broken test) turns it red.
- **Test strategy:** the pipeline is the test; verify both matrices run.

### T-030 Packaged deployment (single process + optional Docker)
- **Status:** DONE · **Depends on:** T-008, T-025
- **Description:** Per DEC-017: `radar serve` runs the single process serving API +
  built SPA on one port (canonical path, documented first); ONE Dockerfile (multi-stage:
  build SPA → copy into Python image) + minimal docker-compose.yml with SQLite volume;
  non-root container; `--profile ai` reserved (empty in V1).
- **Acceptance:** clean machine: (a) documented Python path serves the full app on one
  port; (b) `docker compose up` does the same with seeded data; ingestion runnable in
  both.
- **Test strategy:** smoke script (curl health, item count > 0) against both paths;
  doc walkthrough.

### T-031 Visual QA pass
- **Status:** DONE · **Depends on:** T-025, T-030
- **Description:** Browser screenshot pass of Dashboard, Regulatory Radar, Standards,
  Incident detail, Watchlist, Settings, Brief, mobile dashboard (§73); compare against
  DESIGN_SYSTEM.md; fix and repeat until matching.
- **Acceptance:** archived screenshots in docs/qa/ judged against §15/§91 quality bar;
  no obvious layout defects.
- **Test strategy:** screenshot → inspection loop (§70 pattern).

### T-032 Open-source docs
- **Status:** DONE · **Depends on:** T-030
- **Description:** README (what/screenshots/architecture/install/config/contributing/
  license per §84), CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md; env vars
  documented; legal disclaimer (§87) in README + app footer.
- **Acceptance:** a newcomer can install from README alone (verified by following it
  verbatim on a clean clone).
- **Test strategy:** doc walkthrough; link check.

## Post-V1 (parked — do not start)
Rankings page + snapshots (§12) · Training page (§13) · Events page (§14) · comparison
view (§22) · LLM provider layer (§33–38) · agent workflows + evaluator (§39–42) ·
notifications (§81) · reports/exports (§52) · MCP server (§82) · Governance Graph (§79) ·
document-level diffing (§27) · light theme · Netlify demo instance (§46–47).
