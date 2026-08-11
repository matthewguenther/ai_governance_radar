# Architecture

Simplest viable architecture that satisfies the V1 requirements in
[PRODUCT_SPEC.md](PRODUCT_SPEC.md), optimized for a small open-source team maintaining
this for years. Deviations from the original spec's recommendations are recorded in
[DECISIONS.md](DECISIONS.md). Revised 2026-08-11 after a skeptical architecture review
(DEC-016…022).

## 1. System overview

```
┌──────────────────────────────────────────────────────────────┐
│  ONE PROCESS (prod/local): FastAPI on :8000                  │
│                                                              │
│  ├── /            static files ← built React SPA (frontend/) │
│  ├── /api/*       REST endpoints                             │
│  ├── /docs        OpenAPI documentation                      │
│  ├── ingestion    fetch → normalize → dedupe → classify →    │
│  │                change-detect → score   (asyncio loop or   │
│  │                `radar ingest` CLI)                        │
│  └── SQLite file (WAL + FTS5) — the entire persistence layer │
└──────────────────────────────────────────────────────────────┘
```

One process, one port, one database file. No DB server, no queue, no cache, no search
engine, no nginx, no cloud dependency, no LLM dependency. Dev mode runs the Vite dev
server alongside for HMR (proxying `/api`); production and Docker use the single
process (DEC-017).

## 2. Technology stack

### Backend — Python 3.12 + FastAPI
- **FastAPI + Pydantic v2** — typed request/response models, free OpenAPI docs (§54).
- **SQLAlchemy 2.0** — ORM. **SQLite is the only supported database in V1** (DEC-019):
  WAL mode, FTS5 for search, backup = copy one file. No Postgres promise until a hosted
  instance is genuinely planned. Pre-release schema via `create_all()`; Alembic
  migrations begin at V1 schema freeze (DEC-021).
- **httpx** — fetching (timeouts, conditional GET); **feedparser** — RSS/Atom;
  **nh3 (or bleach)** — sanitization to plain text.
- **Scheduling:** a ~20-line asyncio background task in the app lifespan runs due
  sources when `SCHEDULER_ENABLED=true`; `radar ingest` CLI for manual/cron use
  (DEC-009/016). No APScheduler, no Celery.
- **pytest** — offline tests against recorded feed fixtures.

### Frontend — React + TypeScript + Vite
- **Tailwind CSS + shadcn/ui (Radix) + lucide-react** — components copied into repo.
- **TanStack Query** (server state, loading/error handling) + **React Router**. SPA
  only, no SSR/Next.js (DEC-004).
- **Recharts** — compact charts.
- **Choropleth:** `topojson-client` + `d3-geo` directly in a small React SVG component;
  Natural Earth countries data **vendored in the repo** — no runtime downloads, fully
  offline (DEC-022). Fonts self-hosted for the same reason.
- **Vitest + React Testing Library**; Playwright reserved for post-V1 e2e.

## 3. Repository layout (DEC-002)

```
ai-governance-radar/
├── backend/
│   ├── app/
│   │   ├── api/            # routers
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── ingestion/      # safe_fetch, parsers (rss/atom/json_api/page_watch), pipeline
│   │   ├── services/       # scoring, dedupe, change detection, search (FTS5), brief
│   │   ├── core/           # config, db, jurisdictions (static ref data), static-SPA mount
│   │   └── cli.py          # radar serve | ingest | seed | seed-sources | status
│   ├── tests/              #   (alembic/ appears at schema freeze, DEC-021)
│   └── pyproject.toml
├── frontend/               # Vite app; `npm run build` → served by backend
├── data/
│   ├── sources/            # seed source registry (YAML)
│   ├── seed/               # curated demo data (marked DEMO)
│   └── geo/                # vendored Natural Earth TopoJSON
├── docs/
├── docker-compose.yml      # optional single-image convenience (DEC-017)
└── (project artifacts: CLAUDE.md, PRODUCT_SPEC.md, …)
```

## 4. Ingestion pipeline (§29, §60–62; DEC-020)

```
source registry (DB, seeded from data/sources/*.yaml)
  → scheduler loop or CLI selects due, enabled sources
  → SafeFetcher — the single outbound-HTTP chokepoint:
      · http/https only; DNS resolved and pinned; private/loopback/link-local
        ranges rejected (SSRF + DNS-rebinding defense); redirects re-checked
      · timeout, response size cap, redirect limit, per-host rate limit
      · conditional GET (ETag/Last-Modified); honest User-Agent; robots.txt respect
  → parser by source_type:
      · rss / atom  (feedparser)
      · json_api    (per-source field mapping in YAML, not code)
      · page_watch  (feed-less Tier-1 pages: normalize text → hash →
                     on change emit a "page changed — review" signal item;
                     NO structured HTML scraping in V1)
  → normalizer → sanitized plain-text excerpt (≤ ~500 chars) + metadata
  → dedupe: canonical-URL + content-hash exact matching; conservative
    near-exact title clustering into item_clusters (official source primary)
  → rule-based classifier (source defaults + keyword rules; NO LLM in V1)
  → change detection (new vs. content-hash change vs. curated entity edits
    → entity_events)
  → transparent impact + confidence scoring (factors persisted for
    "why is this high impact?")
  → persist (items, item_entities, entity_events, source_runs)
```

Every run writes a `source_runs` row — failures are first-class data surfaced in
Settings source health (§59), never silently dropped.

**Curated vs. ingested (DEC-014):** regulations, standards, and incidents are curated
structured records (reviewed seed data / explicit API edits). Ingestion links evidence
items and flags "needs review" but never writes legal status, dates, or penalties.
Regulation views surface `last_verified_at` age so staleness is visible, not hidden.

## 5. API surface (V1)

`GET /api/health` · `GET/POST/PATCH /api/sources` · `GET /api/source-runs` ·
`GET /api/items` (filters: category, jurisdiction, impact≥, confidence, source, date,
watched, cluster-collapsed; sort; offset pagination) · `GET /api/items/{id}` ·
`GET /api/entities[/{id}]` (incl. timeline) · `GET /api/regulations` ·
`GET /api/standards` · `GET /api/incidents[/{id}]` · `GET /api/search?q=` (grouped) ·
`GET/POST/DELETE /api/watchlist` · `GET /api/brief` · `GET /api/dashboard/summary` ·
`POST /api/ingest` · export/import (JSON/CSV). Documented at `/docs`.

## 6. Security architecture (§86)

- SafeFetcher chokepoint (above) for every outbound request, including user-added
  source URLs (validated on creation *and* on every fetch — creation-time checks alone
  don't survive DNS changes).
- All stored text sanitized to plain text before persistence; the frontend never
  renders source-derived HTML. Excerpts are data, never markup.
- No secrets anywhere in V1 (there are none to hold); `.env` gitignored; config via
  env vars. Single-user, no auth (DEC-008): binds 127.0.0.1 by default; README/SECURITY
  warn against public exposure.
- ORM-parameterized queries; single-origin serving (DEC-017) removes CORS surface in
  production entirely.

## 7. Local-only guarantee

Everything required at runtime ships in the repo or on PyPI/npm at build time: SQLite
in-process, fonts self-hosted, map data vendored, no CDN references, no telemetry, no
cloud calls except ingestion of the user's enabled sources. The app runs airgapped
(with ingestion idle) — this is tested by the "no network in tests" rule.

## 8. Phase 2+ seams (designed now, built later — no code in V1)

- **LLM enrichment (Phase 2):** a small `LLMProvider` interface (generate /
  structured_output / embeddings / health_check) with per-task model policies; prefer
  plain HTTP adapters over vendor SDKs to avoid lock-in. **Prompt-injection boundary:**
  retrieved content enters prompts only inside delimited data blocks; model output is
  schema-validated; models get no tools while untrusted content is in context; AI text
  is always labeled "AI-generated summary"; and per DEC-014 models can *draft* but
  never *write* structured legal/incident fields — human review commits them.
- `summaries` / `embeddings` tables are created in Phase 2, not reserved now.
- item_clusters is the future hook for multi-source intelligence events and the
  Governance Graph.
- A future public demo = static SPA hosting (Netlify, frontend-only per §46) + a
  read-only API instance, or fully static JSON snapshots. Nothing in V1 depends on it.
