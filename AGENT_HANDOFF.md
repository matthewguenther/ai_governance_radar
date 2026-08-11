# Agent Handoff

_Last updated: 2026-08-11 (V1 implementation session)_

## Where the project stands
**V1 is implemented, tested, QA-reviewed, and functional.** The app runs locally with
real ingested data, all automated gates pass, and the independent QA pass
([docs/reviews/V1-QA.md](docs/reviews/V1-QA.md)) found no P0/P1 issues; 5 of 6 P2/P3
findings were fixed same-day, one accepted with rationale.

## How to run it
```bash
cd frontend && npm install && npm run build && cd ..      # UI (once)
cd backend && python -m venv .venv && .venv\Scripts\pip install -e .
.venv\Scripts\python -m app.cli serve                     # http://127.0.0.1:8000
.venv\Scripts\python -m app.cli ingest --force            # pull real sources
```
Dev mode: `python -m app.cli serve --reload` + `npm run dev` (Vite on :5173, /api proxied).
Gates: backend `ruff check app tests && mypy app && pytest` · frontend
`npm run lint && npm run typecheck && npm test && npm run build`.

## What exists (beyond the planning artifacts)
- `backend/` — FastAPI app: 12-table SQLite schema, SafeFetcher, ingestion pipeline
  (rss/atom/json_api/page_watch), scoring/dedupe/changes/brief/search services,
  full REST API, `radar` CLI, 60 offline tests.
- `frontend/` — React SPA with the full design system and all V1 pages; 11 tests.
- `data/` — verified source registry (see SOURCE_CATALOG.md outcomes) + curated seed
  (7 regulations, 7 standards, 7 incidents, flagged demo items).
- `Dockerfile` + `docker-compose.yml` + `.github/workflows/ci.yml` (see caveats).
- `docs/reviews/V1-QA.md` — independent QA report + fix outcomes.

## Known limitations / first things a next session should check
1. **CI and Docker have never executed** — no Docker on the dev machine and the repo
   hasn't been pushed. First push exercises both (CI includes a docker build + smoke
   job). Expect possible small CI environment fixes.
2. Automated axe accessibility scan deferred (manual a11y review done).
3. 10k-item performance smoke not run (trivial at current volumes).
4. OWASP page_watch source shows occasional dynamic-content hash churn (capped at
   one signal item/day by design).
5. Regulation facts were verified as of **2026-01-15** (knowledge-based curation);
   `last_verified_at` staleness is surfaced in the UI. A maintainer should re-verify
   against official sources and bump the timestamps.
6. Incident evidence deep-links were not all live-verified; QA checked structure, not
   every URL's liveness.

## Next milestones (post-V1, all parked in TASKS.md)
Phase 2: LLM provider abstraction (see ARCHITECTURE.md §8 for the prompt-injection
contract), semantic search, summaries. Post-V1 pages: Rankings, Training, Events.
Alembic baseline migration at first tagged release (DEC-021).

## How to resume a session
Read CLAUDE.md → this file → TASKS.md (post-V1 list) → DECISIONS.md (DEC-001…024).
Keep the hard rules: curated legal facts only, SafeFetcher for all outbound HTTP,
no LLM code in core, attribution everywhere, demo data always flagged.
