# Changelog

All notable changes to this project. Dates are UTC.

## [0.1.0] — 2026-08-11 — V1 implementation

### Added
- **Backend** (Python 3.12 / FastAPI / SQLite WAL + FTS5): 12-table schema, static
  jurisdictions module, SafeFetcher (SSRF, DNS-rebinding, redirect re-validation,
  size caps, rate limits), ingestion pipeline (RSS/Atom, JSON API, page_watch hash
  monitoring), deterministic classification, transparent impact/confidence scoring,
  conservative dedup clustering, change detection with entity events, deterministic
  Morning Brief + dashboard summary, watchlist delta derivation, full REST API with
  OpenAPI docs, `radar` CLI (serve/ingest/seed/status/reindex), optional asyncio
  scheduler.
- **Curated seed data**: 7 regulations (Colorado AI Act, EU AI Act, NYC LL144, Utah,
  CA SB 53, TX TRAIGA, IL HB 3773) with lifecycle events + verification timestamps;
  7 standards/frameworks (NIST AI RMF + GenAI Profile, ISO 42001/23894, OWASP LLM
  Top 10 + Agentic, MITRE ATLAS, Singapore MGF); 7 documented public incidents with
  fact-status labels and evidence links; flagged demo items.
- **Verified live sources** (2026-08-11): NIST News RSS, Federal Register API, GOV.UK
  Atom, arXiv API, page-watch on NIST AI RMF / EUR-Lex / MITRE ATLAS / OWASP GenAI /
  Stanford HAI. CISA + ISO ship disabled (403 for honest non-browser User-Agent).
- **Frontend** (React / TS / Vite / Tailwind, hand-rolled design system): Dashboard
  (KPIs, Top Developments, d3-geo choropleth, incidents, standards watch), Morning
  Brief, Regulatory Radar (table/timeline), Standards, Incidents + report-style
  detail, Intelligence Feed, Watchlist, entity details with timelines, grouped
  search, Settings (source health, add-source, import/export, ingest-now), item
  intelligence drawer with impact-factor breakdown, mobile bottom nav, full
  empty/error/loading states, explicit 404.
- **Release engineering**: single Docker image + compose, GitHub Actions CI
  (backend, frontend, docker smoke), README/CONTRIBUTING/SECURITY/CODE_OF_CONDUCT.
- **Tests**: 60 backend (offline fixtures, SSRF suite, pipeline scenarios, API
  contracts) + 11 frontend; ruff/mypy/eslint/tsc clean.

### QA
- Independent fresh-context QA evaluation (docs/reviews/V1-QA.md): no P0/P1;
  six P2/P3 findings, five fixed same-day (SSRF creation-time hardening, data
  repopulation, 404 page, category hydration, source deletion), one accepted
  (clustering covered by tests).

## [Unreleased]

### 2026-08-11 — V2 design shipped: "Refined Intelligence Dashboard" (DEC-025)
- Production UI migrated to the owner-approved Direction A rev 2 after a three-way
  prototype comparison: refreshed tokens (navy surfaces, gradient cards, accent
  radial wash), animated radar brand mark (blue structure / green sweep + blips),
  real flag chips (flag-icons + us-state-flags), org monogram avatars, incident
  category icons, impact rings + confidence dots in rows, filled status pills,
  tinted KPI cards with sparklines, glowing world-map activity markers with legend,
  Regulatory Pulse module + live feed strip on the dashboard, refined sidebar/nav.
- Regulation "effective/enforcement" pill tone: red → green (in force = healthy).
- Design playground and serif package removed; DESIGN_SYSTEM.md rewritten as the
  shipped system; Ink & Signal doc marked superseded.
- Gates: tsc, eslint, 11 vitest, production build all green; desktop + mobile
  browser-verified.

### 2026-08-11 — V2 design research & direction (no implementation)
- Researched reference interfaces (Bloomberg Terminal, FT/Origami, The Economist,
  Our World in Data, Palantir Blueprint, SOC consoles) and critiqued the running V1
  UI route-by-route in the browser.
- Proposed the "Ink & Signal" visual direction in docs/design/V2-DESIGN-DIRECTION.md:
  warm-ink palette, amber identity accent, domain-coded module language (preserving
  the widget dashboard), serif/mono/sans typography, flat mono status tokens, impact
  meters, terminal status strip, map restyle. Awaiting approval; DESIGN_SYSTEM.md V1
  rules remain authoritative.

### 2026-08-11 — Skeptical architecture review (same day, second pass)
- Recorded DEC-016…022 simplifications: asyncio loop replaces APScheduler; single
  process serves API + built SPA (one Docker image, compose optional not canonical);
  SQLite-only V1 (dropped untested Postgres promise + SearchService abstraction);
  data model trimmed 15 → 12 tables (tags/item_tags cut, jurisdictions now a static
  module); no structured HTML scrapers (feeds/APIs + page_watch hash monitoring);
  Alembic deferred to V1 schema freeze; map via d3-geo + topojson-client with
  vendored Natural Earth data.
- Synced ARCHITECTURE.md (rewritten), DATA_MODEL.md, TASKS.md (T-002, T-008, T-009,
  T-010, T-017, T-018, T-021, T-030), CLAUDE.md, .env.example accordingly.

### 2026-08-11 — Project initialization (planning session)
- Normalized the original 93-section spec into tracked `PRODUCT_SPEC.md`; scope
  clarifications recorded as DEC-010/011/013.
- Established architecture (ARCHITECTURE.md) and 15 decision records (DECISIONS.md):
  FastAPI + SQLite/Alembic backend, Vite React SPA, SVG choropleth, no-LLM V1,
  curated regulatory records, single-user local-first.
- Wrote DATA_MODEL.md (15 V1 tables + integrity rules), DESIGN_SYSTEM.md (dark
  intelligence-terminal tokens/components), TEST_PLAN.md (offline-only test layers +
  release gate), SOURCE_CATALOG.md (unverified seed candidates).
- Created V1 backlog: TASKS.md T-001…T-032, all TODO.
- Added CLAUDE.md, AGENT_HANDOFF.md, README.md stub, .gitignore, .env.example.
- No application code yet — implementation blocked on owner plan approval.
