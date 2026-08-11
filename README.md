# AI Governance Radar

Open-source, local-first **AI Governance Intelligence Dashboard**. It monitors AI
regulation, standards & frameworks, incidents, and AI security developments, then
surfaces **what changed and why it matters** — a radar, not a news feed.

- **Free & self-hostable** — one Python process, one SQLite file, zero cloud services
- **Fully functional without any LLM or paid API key** (AI enrichment is a future,
  optional, model-agnostic layer — local models included)
- **Source-integrity first** — every regulatory fact is curated, evidence-linked, and
  timestamped; ingestion detects changes but never invents legal facts
- Dark, dense, professional intelligence-terminal UI

## Quick start (Python)

Requirements: Python 3.12+, Node 20+ (build only).

```bash
git clone <repo-url> && cd ai-governance-radar

# 1. Build the UI once
cd frontend && npm install && npm run build && cd ..

# 2. Run the app (creates + seeds the database on first start)
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -e .
python -m app.cli serve
```

Open **http://127.0.0.1:8000** — dashboard, seeded regulations/standards/incidents,
and API docs at `/api/docs`.

Pull fresh intelligence from the real sources (NIST, Federal Register, GOV.UK, arXiv,
plus page-watch monitors):

```bash
python -m app.cli ingest --force
python -m app.cli status
```

Set `SCHEDULER_ENABLED=true` (see `.env.example`) to poll sources automatically while
the app runs.

## Quick start (Docker)

```bash
docker compose up
# open http://localhost:3000
```

The compose file wraps a single image (UI + API + scheduler) with a persistent volume
for the database.

## What's inside

| Area | Feature |
|---|---|
| Dashboard | KPI cards, Top Developments, global regulatory activity map, incidents, standards watch |
| Morning Brief | Deterministic "what happened since I last looked" — no LLM involved |
| Regulatory Radar | Curated regulation records with lifecycle status, key dates, penalties, verification timestamps; table + timeline views |
| Standards | NIST / ISO / OWASP / MITRE lifecycle tracking with official sources |
| Incidents | Curated AI incident intelligence with severity, fact status, framework cross-links |
| Watchlist | Watch any entity/source/jurisdiction/category; per-target change status since your last review |
| Search | Full-text (SQLite FTS5) across items, entities, incidents — grouped results |
| Ingestion | RSS/Atom + JSON APIs + hash-based page-watch, all through a hardened SafeFetcher (SSRF/DNS-rebinding/size/timeout defenses); per-source health & run history |
| Portability | JSON config import/export, CSV item export |

Demo records are explicitly badged `DEMO DATA` and can be filtered out or disabled
(`DEMO_DATA=false`).

## Architecture (short version)

React + TypeScript SPA (Vite, Tailwind) served as static files by a FastAPI backend
with SQLite (WAL + FTS5). Ingestion is a deterministic pipeline: fetch → normalize →
dedupe/cluster → rule-based classify → change-detect → transparent impact/confidence
scoring. No queue, no search engine, no ORM magic, no LLM. Full detail:
[ARCHITECTURE.md](ARCHITECTURE.md) · [DATA_MODEL.md](DATA_MODEL.md) ·
[DECISIONS.md](DECISIONS.md) · [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) ·
[TEST_PLAN.md](TEST_PLAN.md).

## Configuration

Copy `.env.example` to `.env` and adjust. Everything has working defaults; the app
runs with no configuration at all. Sources are data, not code — edit
`data/sources/sources.yaml` or add sources in Settings.

## Security

Single-user, no auth (by design, V1): keep it on localhost. Details and reporting:
[SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Source additions especially welcome —
verified feed URLs with attribution notes.

## Disclaimer

This application is an information and intelligence tool. **It is not legal advice.**
Regulatory information is presented with source, dates, jurisdiction, confidence, and
a human-verification timestamp; always verify against the linked official sources.
Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain) via the
`world-atlas` package.

## License

See [LICENSE](LICENSE).
