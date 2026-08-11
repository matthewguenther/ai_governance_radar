# Decisions

Architecture/product decision records. Format: decision · alternatives · rationale ·
consequences. §NN references the original spec document.

---

## DEC-001 — SQLite is the default database; schema stays Postgres-compatible
> **Superseded in part by DEC-019** (2026-08-11 architecture review): SQLite is now the
> *only supported* database in V1; the tested-Postgres-compatibility promise is dropped.

**Decision:** Ship V1 on SQLite (WAL mode) as the default and only required database.
Write all SQLAlchemy models and Alembic migrations dialect-portably so PostgreSQL is a
config-swap (`DATABASE_URL`) for hosted/team instances.
**Alternatives:** (a) Postgres as default per spec §30 "prefer PostgreSQL as canonical";
(b) Postgres-only with a bundled container.
**Rationale:** Local-first is the canonical deployment (§45) and the spec explicitly
permits SQLite locally. A DB server adds a container, ops burden, and a hard Docker
dependency for what is a single-user desktop-class workload. SQLite + FTS5 covers V1
search too. This inverts the spec's *default* but honors its *requirement* (Postgres
compatibility) via portable schema.
**Consequences:** Zero-install local run (`pip install` + one command). Must avoid
dialect-specific features (arrays, tsvector) or hide them behind service interfaces
(SearchService). CI should eventually run tests against Postgres to keep the claim honest.

## DEC-002 — Flat `backend/` + `frontend/` layout instead of apps/packages monorepo
**Decision:** Two top-level projects plus `data/`, `docs/`. No `packages/ui|types|config`.
**Alternatives:** spec §88 monorepo (apps/web, apps/api, packages/*) with a workspace tool.
**Rationale:** §88 itself allows a "materially simpler architecture". One frontend and one
backend don't need workspace tooling; shared types come from the OpenAPI contract. Fewer
moving parts for contributors and for one maintainer.
**Consequences:** If a second app (MCP server, CLI client) appears in Phase 3/4, revisit.

## DEC-003 — Keep the spec's Python/FastAPI backend (two-language repo accepted)
**Decision:** Python 3.12 + FastAPI + SQLAlchemy for the API and ingestion.
**Alternatives:** single-language TypeScript stack (Node + Fastify/Hono + Drizzle) to
avoid two toolchains.
**Rationale:** Ingestion is the hard part of this product, and Python's feed/scraping
ecosystem (feedparser, httpx, bleach) is the most mature and boring option; FastAPI gives
typed models + free OpenAPI docs (§54 documented API). The spec recommends it and no
material simplification justified overriding it.
**Consequences:** Contributors need Python and Node. Mitigated by one-command dev scripts
and Docker.

## DEC-004 — Vite SPA, no Next.js/SSR
**Decision:** React + Vite single-page app.
**Alternatives:** Next.js (spec allows if SSR materially helps).
**Rationale:** Local-first single-user dashboard: no SEO, no first-paint-critical public
pages. SSR adds a server runtime and framework coupling for zero product value here. Also
keeps a future static Netlify deploy of the frontend trivial (§46).
**Consequences:** None significant for V1.

## DEC-005 — Search via SQLite FTS5 behind a SearchService interface
**Decision:** FTS5 virtual table for §28 search; grouped results done in the API layer.
**Alternatives:** Meilisearch/Typesense container; Postgres tsvector; LIKE queries.
**Rationale:** No extra service, adequate quality for tens of thousands of items,
satisfies "searchable" acceptance criteria. Interface seam allows tsvector on Postgres.
**Consequences:** No typo tolerance/semantic search in V1 (semantic search is Phase 2
via embeddings anyway).

## DEC-006 — Regulatory heat map as SVG choropleth, not MapLibre GL
> **Amended by DEC-022**: implement with d3-geo + topojson-client directly (no
> react-simple-maps), Natural Earth data vendored in the repo.

**Decision:** Implement §21's world map with react-simple-maps (or hand-rolled SVG) over
Natural Earth TopoJSON, colored by a clearly-labeled activity metric.
**Alternatives:** MapLibre GL JS per spec recommendation.
**Rationale:** All §21 requirements (country status, hover, click, filters, legend) are
country-level — WebGL tiles buy nothing but ~250KB+ of dependency, GPU variance, and
complexity. "Few dependencies / simplicity" wins; the spec's mapping tech is a
recommendation, not a requirement.
**Consequences:** No zoom-to-street detail (not needed). MapLibre remains the upgrade
path if sub-national mapping (US states) outgrows SVG — unlikely.

## DEC-007 — V1 ships with zero LLM code paths
**Decision:** No provider abstraction, no LLM calls, no embeddings in V1. Deterministic
rule-based classification, dedupe, scoring, and Morning Brief only. Settings shows the
AI section as "available in a future release".
**Alternatives:** building the LLMProvider interface now.
**Rationale:** §33 mandates V1 works without an LLM; building unused abstraction ahead
of need is speculative complexity. Architecture keeps a clean seam (services take
interfaces; prompt-injection data boundary already respected in design).
**Consequences:** Phase 2 adds `providers/` fresh; some scoring heuristics may later be
replaced/augmented by model output with an evaluator (§41–42).

## DEC-008 — Single-user, no auth, no `users` table in V1
**Decision:** Single local user; preferences in `app_state`; watchlist is one implicit
list (`watches` table). API binds to localhost by default.
**Alternatives:** users/sessions/auth now.
**Rationale:** §74 acceptance criteria contain no multi-user requirement; local-first
single-professional is the primary persona (§3). Auth is the classic V1 scope-killer.
**Consequences:** A hosted multi-tenant instance needs auth work later; `watches` and
`app_state` would gain a `user_id`. Documented limitation in README/SECURITY notes:
don't expose the API publicly.

## DEC-009 — Ingestion = one-shot CLI + optional in-process scheduler
> **Amended by DEC-016**: the in-process scheduler is a plain asyncio loop, not APScheduler.

**Decision:** `radar ingest` CLI is the canonical trigger; APScheduler runs it on
interval inside the API process when `SCHEDULER_ENABLED=true`. No queue, no worker
containers.
**Alternatives:** Celery/RQ + Redis; separate worker container; cron-only.
**Rationale:** §30 says "do not build a complex distributed task queue for V1". Polling
a few dozen feeds every 6h is trivial concurrency.
**Consequences:** Long fetches share the API process (acceptable; httpx async +
timeouts). Cron/GitHub Actions can drive the CLI without the scheduler.

## DEC-010 — V1 scope = Phase 0/1/1.5 build lists judged by §74 acceptance criteria
**Decision:** Dedicated Rankings (§12), Training/Certifications (§13), and
Events/Conferences (§14) **pages** are deferred. Their content types exist as item
categories so ingestion/search/KPI ("New Opportunities" counts training/event items)
still work. Morning Brief ships in V1 as a deterministic view (see DEC-013).
**Alternatives:** building all nine domain pages in V1.
**Rationale:** The spec is internally ambiguous: §6 lists nine domains "V1 should
contain", but §66 Phase 1 builds only dashboard/regulatory/standards/incidents/watchlist/
search, and §74 (explicitly "V1 is complete only when") requires only those. §93 resolves
conflicts: small excellent V1, feature breadth last.
**Consequences:** Sidebar shows deferred sections as future/hidden. Backlog contains the
deferred pages as post-V1 tasks.

## DEC-011 — Tracked normalized PRODUCT_SPEC.md; original spec file left gitignored
**Decision:** `PRODUCT_SPEC.md` (normalized, §-referenced) is the authoritative tracked
spec. The original `AI_Governance_Radar_Product_Design_Development_Spec.md` remains in
the working tree and remains listed in `.gitignore` (a pre-existing user choice this
session preserved).
**Alternatives:** committing the original verbatim; deleting it.
**Rationale:** The task required normalization without material requirement changes;
the original's ignore entry predates this session and was not overridden without owner
input. All normalization deltas are these DEC records.
**Consequences:** Fresh clones only get the normalized spec. **Recommend the owner
either commits the original (remove the .gitignore line) or confirms the normalized
spec as sole source of truth.**

## DEC-012 — Alembic migrations from day one
> **Superseded by DEC-021** (2026-08-11 architecture review): migrations begin at the
> first tagged release, not day one.

**Decision:** All schema changes flow through Alembic, starting with the initial schema.
**Alternatives:** `create_all()` now, migrations later.
**Rationale:** Long-running multi-session project with a persistent local DB; retrofitting
migrations after users have data is far costlier than starting clean.
**Consequences:** Slightly slower first schema task; every model change needs a revision.

## DEC-013 — Morning Brief is V1, deterministic-only
**Decision:** Ship `/brief` in V1: pure aggregation over stored data (high-impact since
last visit, per-domain counts, watchlist deltas) per §25's layout. No LLM narrative.
**Alternatives:** defer entirely to Phase 3 (where §66 lists "morning brief").
**Rationale:** Spec conflict — §25 calls it "one of the most important features" and
says "generated deterministically from stored data first", while §66 puts it in Phase 3.
Read §66's Phase 3 entry as the *automated/LLM* brief. The deterministic version is a
cheap query + template over data V1 already has, and it directly serves the core product
question ("what happened since I last looked?").
**Consequences:** Small extra V1 surface; Phase 3 upgrades it rather than creating it.

## DEC-014 — Regulations/standards/incidents are curated records; ingestion only flags
**Decision:** Structured legal/lifecycle/incident fields are written only via reviewed
seed data or explicit API edits. The pipeline links evidence items and can mark an entity
"needs review", but never mutates status/dates/penalties itself.
**Alternatives:** auto-updating status from feed text (regex/LLM).
**Rationale:** §7 "never represent legal status solely based on an LLM summary", §65
structured fields require evidence, §93 correctness + source integrity first. Without an
LLM, auto-extraction of legal status would be guesswork.
**Consequences:** V1 regulatory status freshness depends on curation; the "needs review"
queue makes that workable for one maintainer. Phase 2/3 agents can draft updates for
human review.

## DEC-015 — Excerpt-only storage; no full-article republication
**Decision:** Store title, metadata, and a sanitized plain-text excerpt (≤ ~500 chars)
plus the original URL; never full copyrighted article bodies.
**Alternatives:** full-text archival.
**Rationale:** §61 copyright/attribution rules; keeps DB small; the product is a radar,
not an archive. (Full text of *public-domain government documents* may be revisited for
diffing in Phase 2's "what changed" document diffs.)
**Consequences:** V1 change detection is hash/metadata-based, not section-level diffs;
§27's rich diffing is deferred with this.

---

*DEC-016 through DEC-022 result from the 2026-08-11 skeptical architecture review,
optimizing for a small open-source team maintaining the project for years.*

## DEC-016 — Plain asyncio loop instead of APScheduler (amends DEC-009)
**Decision:** The optional in-process scheduler is a single asyncio background task in
the FastAPI lifespan: every N minutes, run ingestion for sources whose interval has
elapsed. ~20 lines, zero dependencies.
**Alternatives:** APScheduler (previous plan); cron-only.
**Rationale:** APScheduler brings cron expressions, job stores, executors, and misfire
handling — none needed for "poll a few dozen feeds when due". One less dependency to
track for years; behavior trivially unit-testable.
**Consequences:** No cron-syntax schedules (per-source interval minutes only — which is
all the spec asks for). `SCHEDULER_ENABLED` env flag unchanged.

## DEC-017 — Single-process deployment: the API serves the built frontend
**Decision:** `vite build` output is served by FastAPI as static files. Canonical local
run = one process, one port (`radar serve` → http://localhost:8000). Docker becomes ONE
image (optional convenience via a minimal docker-compose.yml), not two images + nginx,
and is **not** the canonical path.
**Alternatives:** (a) previous plan: frontend container (nginx) + backend container,
compose canonical per §45; (b) Electron/desktop wrapper.
**Rationale:** For a single-user local-first app, Docker Desktop (WSL2, licensing,
resources) is a heavier prerequisite than Python — spec §45's `docker compose up` is a
means to "start locally with one command", not an end. One process removes CORS config,
the nginx image, the port-3000/8000 split, and halves the deployment surface a small
team must keep working for years. Dev mode keeps Vite's dev server + proxy for HMR.
**Consequences:** docker-compose.yml still ships (spec checkbox §74 "Docker deployment
works") but wraps the single image. A future public demo can still host the SPA
statically (DEC-004 preserved this). README documents both paths, simplest first.

## DEC-018 — Data model trim: drop `tags`/`item_tags` and the `jurisdictions` table
**Decision:** V1 schema is 12 tables (+ FTS index): sources, source_runs, items,
item_clusters, entities, regulations, standards, incidents, entity_events,
item_entities, watches, app_state. Tagging is covered by the existing `categories` JSON
list on items; jurisdictions become a static Python module (code, name, kind, parent,
iso3) shipped with the app.
**Alternatives:** keep all 15 tables (previous plan).
**Rationale:** Tags duplicated categories with no V1 feature behind the difference.
Jurisdictions are a slow-changing reference list — a constants module is versioned with
code, needs no migration, and the map/filters read it directly. Fewer tables = fewer
migrations, fixtures, and API surfaces to maintain.
**Consequences:** Watch-by-tag becomes watch-by-category (same UX). If user-defined
tags become a real feature later, add the tables then. Jurisdiction validation happens
in code, not FK constraints (acceptable: values originate from the same module).

## DEC-019 — SQLite is the *only* supported database in V1 (supersedes part of DEC-001)
**Decision:** V1 supports SQLite, period. No `DATABASE_URL` Postgres path, no dual-
dialect CI, no SearchService abstraction over FTS5 — search code targets FTS5 directly
in one module. We avoid gratuitous SQLite-isms elsewhere (SQLAlchemy keeps the door
ajar), but compatibility is not promised, tested, or documented.
**Alternatives:** previous plan — untested "Postgres-compatible" claim with a swap
interface; dual-dialect CI.
**Rationale:** An untested compatibility promise is technical debt pretending to be a
feature: it constrains every schema/search decision and *will* silently rot. No V1
deployment needs Postgres (single user, tens of thousands of rows). When a hosted
multi-tenant instance is genuinely planned, migrate deliberately with real tests.
**Consequences:** One database to document, back up (copy one file), and debug. Search
is simpler. A future Postgres port is a real project — accepted and recorded.

## DEC-020 — V1 ingests feeds/APIs only; feed-less pages get hash-based change monitoring
**Decision:** V1 parsers: RSS, Atom, JSON APIs. No structured HTML scraping. Tier-1
sources without feeds (ISO pages, some state legislatures) are covered by a
**page-watch** source type: fetch → normalize text → hash → on change, emit a
"page changed — review" item/entity_event linking the URL. A human curates the actual
facts (consistent with DEC-014).
**Alternatives:** per-site HTML scrapers (previous plan allowed `html` parsing).
**Rationale:** Every bespoke scraper is a permanent maintenance liability that breaks
silently on redesigns — the worst possible burden for a small team over years. Hash
monitoring delivers the product's core promise ("detect that something changed") at
~zero marginal maintenance, and the curated-record model already requires human review
for structured facts anyway.
**Consequences:** Feed-less sources yield "something changed here" signals, not parsed
items — a deliberate fidelity trade. The `html` source_type becomes `page_watch`.
Community scrapers can arrive post-V1 as isolated, fixture-tested plugins if ever.

## DEC-021 — Alembic starts at schema freeze / first release (supersedes DEC-012)
**Decision:** During pre-release development, the schema is created via
`metadata.create_all()`; breaking model changes are handled by "delete radar.db and
re-seed" (documented). The initial Alembic migration is generated once, from the final
models, when V1 tags. All post-release changes flow through Alembic.
**Alternatives:** Alembic from day one (previous plan).
**Rationale:** Pre-release there are no users and all data is reproducible (seed +
re-ingest), so migrations protect nothing while taxing every model iteration with
revision churn. Generating migration #1 at freeze costs nothing — the "painful
retrofit" DEC-012 feared only exists once real users hold data.
**Consequences:** Contributors occasionally reset their local DB before v0.1 —
acceptable and documented. Watchlists made during development are disposable.

## DEC-022 — Map built on d3-geo + topojson-client directly (amends DEC-006)
**Decision:** Render the choropleth with `topojson-client` + `d3-geo` (geoPath /
geoNaturalEarth1) in a React SVG component (~50–80 lines). Natural Earth countries
TopoJSON is **vendored in the repo** — no runtime download, preserving offline/local-
only operation.
**Alternatives:** react-simple-maps (previous plan) — a wrapper over these same libs
with sporadic maintenance history.
**Rationale:** Removing a semi-maintained wrapper dependency in favor of its two small,
stable, widely-used foundations is strictly less risk over a multi-year horizon, and
the wrapper saved little code.
**Consequences:** We own ~80 lines of projection/path code (fixture-testable). Data
attribution note for Natural Earth (public domain) in README.

---

*DEC-023+ recorded during V1 implementation (2026-08-11).*

## DEC-023 — Hand-rolled UI primitives instead of shadcn/ui
**Decision:** Implement the DESIGN_SYSTEM.md components (badges, pills, cards, states,
drawer, watch button) directly in Tailwind + React; no shadcn/ui, no Radix.
**Alternatives:** shadcn/ui per original plan.
**Rationale:** Every component in the design system is bespoke intelligence-terminal
UI, not a generic admin control; shadcn's value (prebuilt generic components) didn't
apply, and the copied-in code would have been restyled beyond recognition anyway.
Fewer dependencies, less code to own.
**Consequences:** Complex controls (combobox, popover menus) would need Radix later if
ever required. Current UI needs none.

## DEC-024 — Brief window has a 24-hour floor; watch deltas reset on leaving Watchlist
**Decision:** (a) The Morning Brief covers `min(last_visit, now − 24h)` — at least a
full day, more if the user was away longer. (b) `POST /visit` (app load) only updates
the app-level timestamp; per-watch `last_viewed_at` resets when the user leaves the
Watchlist page, via `POST /watchlist/mark-viewed`.
**Alternatives:** naive "since last visit" everywhere (original implementation).
**Rationale:** Found via real browser QA: marking everything visited on app load made
the Brief and watch deltas almost always empty — the app reported "nothing happened"
seconds after showing what happened. "What changed since I last looked?" (§25/§51)
means since the user *reviewed* the information, not since the process started.
**Consequences:** Brief always has a day of content; watchlist statuses persist until
actually viewed; frequent visitors see stable, truthful deltas.
