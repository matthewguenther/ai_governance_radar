# Test Plan

Testing philosophy: deterministic, offline, fast. **No network access in any automated
test** — ingestion is tested against recorded fixtures. Verification is layered; UI
work additionally requires the visual pass (§73). Per-task strategies live in TASKS.md;
this file defines the layers, tooling, and release gates.

## 1. Layers

### Backend unit tests (pytest)
- Scoring (table-driven cases; bounds properties), dedupe/clustering (curated
  positive/negative pairs), change detection (re-ingest scenarios), brief/dashboard
  aggregation (fixture DB with hand-computed expected counts), watchlist delta
  derivation, SafeFetcher security behavior.
- Location: `backend/tests/unit/`.

### Backend API tests (pytest + TestClient)
- Contract tests per router: status codes, schema shape, filter matrix, pagination,
  error responses. Runs against a temp SQLite DB seeded from fixtures.
- Location: `backend/tests/api/`.

### Ingestion fixture tests
- Recorded real feed samples in `backend/tests/fixtures/feeds/` (captured during T-007
  source verification, then frozen). Cases: happy parse, malformed XML, empty feed,
  encoding weirdness, oversized response (truncation), duplicate re-ingest, modified
  content (change event).
- **Security cases (must-pass):** SafeFetcher rejects `file://`, `ftp://`, loopback,
  RFC1918, link-local (169.254.0.0/16, incl. metadata IP), redirect-to-private;
  enforces timeout, size cap, redirect limit. Sanitizer strips script/HTML from
  excerpts (XSS corpus).

### Frontend tests (Vitest + React Testing Library)
- Every primitive renders in all states (T-004 kit); page tests with mocked API
  (loading/empty/error/data); interaction tests (filters, watch toggle, search
  keyboard nav, KPI click-through routing).

### Accessibility
- axe-core automated scan on the `/dev/kit` page and each route (serious/critical = 0).
- Manual: keyboard-only walkthrough, focus visibility, reduced-motion, screen-reader
  labels spot-check. Checklist = DESIGN_SYSTEM.md §8.

### Visual QA (manual, agent-driven browser loop)
- Screenshot Dashboard, Regulatory Radar, Standards, Incident detail, Watchlist,
  Settings, Morning Brief at 1280 / 768 / 375 px. Compare against DESIGN_SYSTEM.md.
  Archive in `docs/qa/YYYY-MM-DD/`. Repeat until no obvious defects (§70, §73).

### End-to-end (deferred until after T-030)
- Playwright smoke against docker compose: boot → seed visible on dashboard → search
  returns grouped results → watch an entity → brief reflects it. Keep to ~5 flows.

## 2. Static gates (every change)

Backend: `ruff check`, `ruff format --check`, `mypy`, `pytest`.
Frontend: `eslint`, `tsc --noEmit`, `vitest run`, `vite build`.
All wired into CI (T-029); all must pass before a task is marked DONE.

## 3. Data-quality verification (maps to §74 checklist)

- Seed integrity test: every regulation/standard/incident has official source URL,
  confidence, and (regulations) last_verified_at; incident fact_status present.
- No-fabrication review: seed content is human-reviewed against cited sources before
  merge; demo items must carry the DEMO flag and render with the DEMO badge.
- Attribution test: item detail responses always include source name, pub date,
  original URL, retrieval date.

## 4. Release gate (V1)

V1 ships when: all TASKS.md V1 tasks DONE · §74 acceptance checklist walked and checked
off in a docs/qa/ report · CI green · docker compose verified on a clean machine ·
README install walkthrough performed verbatim · no known P0/P1 defects (P0 = data
integrity/security/crash; P1 = core flow broken).
