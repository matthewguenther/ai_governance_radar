# Contributing

Thanks for your interest! This project optimizes for **a small team maintaining it for
years**: boring technology, few dependencies, deterministic behavior.

## Ground rules

1. Read [CLAUDE.md](CLAUDE.md) (hard rules), [ARCHITECTURE.md](ARCHITECTURE.md), and
   [DECISIONS.md](DECISIONS.md) before proposing structural changes.
2. **Never** add code that writes regulatory/legal/incident facts automatically —
   structured records are curated with source evidence (DEC-014).
3. All outbound HTTP goes through `SafeFetcher`. No exceptions.
4. No LLM dependencies in the core (Phase 2 will add an optional provider layer).
5. Tests run offline — record fixtures, never hit the network in tests.

## Dev setup

```bash
# Backend
cd backend
python -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
python -m app.cli seed
python -m app.cli serve --reload               # http://127.0.0.1:8000

# Frontend (second terminal)
cd frontend
npm install
npm run dev                                    # http://localhost:5173 (proxies /api)
```

## Before submitting a PR

```bash
cd backend  && ruff check app tests && mypy app && pytest
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

UI changes need a screenshot in the PR and a check against
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (including the accessibility checklist).

## Adding a source

Sources are data, not code: add an entry to `data/sources/sources.yaml` (see §85 shape),
verify the feed URL actually works with an honest User-Agent, note attribution
requirements, and update [SOURCE_CATALOG.md](SOURCE_CATALOG.md) with the verification
date. No bespoke HTML scrapers (DEC-020) — use `page_watch` for feed-less pages.
