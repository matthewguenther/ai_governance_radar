# Agent Handoff

_Last updated: 2026-08-11 (planning session)_

## Where the project stands
**Phase: planning complete, awaiting owner approval of the plan. No application code
exists.** This session read the full original spec, normalized it into PRODUCT_SPEC.md,
decided the architecture (DECISIONS.md DEC-001…015), and wrote the V1 backlog
(TASKS.md, all TODO).

## What exists
- Project artifacts: CLAUDE.md, PRODUCT_SPEC.md, ARCHITECTURE.md, DATA_MODEL.md,
  DESIGN_SYSTEM.md, TASKS.md, DECISIONS.md, TEST_PLAN.md, SOURCE_CATALOG.md,
  CHANGELOG.md, this file, .gitignore, .env.example, README.md stub.
- Original spec `AI_Governance_Radar_Product_Design_Development_Spec.md` (gitignored —
  owner to decide whether to track it, see DEC-011).
- LICENSE (CC0), .gitattributes from the initial commit. Nothing else.

## Key decisions to know before coding
FastAPI + SQLite-only (FTS5) backend; Vite React SPA served as static files by the
API in production (one process, one port, one Docker image — DEC-017); flat backend/ +
frontend/ layout; SVG choropleth via d3-geo/topojson-client with vendored data; no LLM
code in V1; curated regulatory records (ingestion never writes legal status);
single-user/no auth; ingestion = feeds/APIs + page_watch hashing only (no HTML
scrapers), CLI-driven with an optional asyncio scheduler loop; `create_all()` until V1
schema freeze, then Alembic. Full rationale in DECISIONS.md (note DEC-016…022 from the
2026-08-11 architecture review supersede parts of DEC-001/006/009/012).

## Next step
1. **Owner approves the plan** (or amends it) — blocking.
2. Then start **T-001 (backend scaffold)**, followed by T-003 (frontend scaffold) —
   they're independent and can be split across sessions. T-007 (source verification)
   is the earliest task needing web access; do it before T-008.

## Open questions for the owner
- Track the original spec in git (remove its .gitignore line) or keep the normalized
  PRODUCT_SPEC.md as the sole tracked spec? (DEC-011)
- License: repo currently carries **CC0**. For an open-source app expecting
  contributions, MIT or Apache-2.0 is more conventional (Apache adds a patent grant).
  Owner call — flagged, not changed.
- Confirm deferral of Rankings/Training/Events *pages* to post-V1 (DEC-010).

## How to resume a session
Read CLAUDE.md → this file → TASKS.md, pick the top non-blocked TODO, set it
IN PROGRESS, implement per the task's acceptance criteria, verify per TEST_PLAN.md,
mark DONE, update CHANGELOG.md and this file.
