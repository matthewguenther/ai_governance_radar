# Changelog

All notable changes to this project. Dates are UTC.

## [Unreleased]

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
