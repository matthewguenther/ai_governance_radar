"""`radar` CLI: serve | ingest | seed | status | reindex."""

import argparse
import sys


def cmd_serve(args: argparse.Namespace) -> int:
    import uvicorn

    from app.core.config import settings

    uvicorn.run("app.main:app", host=args.host or settings.api_host,
                port=args.port or settings.api_port, reload=args.reload)
    return 0


def cmd_ingest(args: argparse.Namespace) -> int:
    from app.core.db import SessionLocal, init_db
    from app.ingestion.pipeline import ingest_all

    init_db()
    db = SessionLocal()
    try:
        runs = ingest_all(db, force=args.force, only_source_id=args.source)
        for run in runs:
            src = run.source.name if run.source else run.source_id
            print(f"[{run.status:7}] {src}: found={run.items_found} "
                  f"new={run.items_new} updated={run.items_updated}"
                  + (f" error={run.error_message}" if run.error_message else ""))
        return 0 if all(r.status == "success" for r in runs) else 1
    finally:
        db.close()


def cmd_seed(args: argparse.Namespace) -> int:
    from app.core.db import SessionLocal, init_db
    from app.services.seeder import seed_all

    init_db()
    db = SessionLocal()
    try:
        counts = seed_all(db)
        print(f"Seeded: {counts}")
        return 0
    finally:
        db.close()


def cmd_status(args: argparse.Namespace) -> int:
    from sqlalchemy import func, select

    from app.core.db import SessionLocal, init_db
    from app.models import Entity, Incident, Item, Source

    init_db()
    db = SessionLocal()
    try:
        items = db.execute(select(func.count(Item.id))).scalar_one()
        entities = db.execute(select(func.count(Entity.id))).scalar_one()
        incidents = db.execute(select(func.count(Incident.id))).scalar_one()
        print(f"items={items} entities={entities} incidents={incidents}")
        print(f"{'SOURCE':40} {'STATE':8} LAST SUCCESS / ERROR")
        for s in db.execute(select(Source).order_by(Source.name)).scalars():
            state = "ok" if s.last_error is None else "ERROR"
            if not s.enabled:
                state = "disabled"
            detail = s.last_error or (
                s.last_success_at.isoformat() if s.last_success_at else "never fetched"
            )
            print(f"{s.name[:40]:40} {state:8} {detail[:80]}")
        return 0
    finally:
        db.close()


def cmd_reindex(args: argparse.Namespace) -> int:
    from app.core.db import SessionLocal, init_db
    from app.services.search import reindex_all

    init_db()
    db = SessionLocal()
    try:
        count = reindex_all(db)
        db.commit()
        print(f"Reindexed {count} items")
        return 0
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(prog="radar", description="AI Governance Radar")
    sub = parser.add_subparsers(dest="command", required=True)

    p_serve = sub.add_parser("serve", help="Run the API + UI server")
    p_serve.add_argument("--host", default=None)
    p_serve.add_argument("--port", type=int, default=None)
    p_serve.add_argument("--reload", action="store_true")
    p_serve.set_defaults(func=cmd_serve)

    p_ingest = sub.add_parser("ingest", help="Run ingestion for due (or all) sources")
    p_ingest.add_argument("--source", type=int, default=None, help="Only this source id")
    p_ingest.add_argument("--force", action="store_true", help="Ignore polling intervals")
    p_ingest.set_defaults(func=cmd_ingest)

    p_seed = sub.add_parser("seed", help="Load source registry + curated seed data")
    p_seed.set_defaults(func=cmd_seed)

    p_status = sub.add_parser("status", help="Show source health and record counts")
    p_status.set_defaults(func=cmd_status)

    p_reindex = sub.add_parser("reindex", help="Rebuild the search index")
    p_reindex.set_defaults(func=cmd_reindex)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
