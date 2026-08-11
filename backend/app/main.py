"""FastAPI application: API + static SPA + optional ingestion scheduler (DEC-016/017)."""

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api import (
    dashboard,
    entities,
    incidents,
    ingest,
    items,
    meta,
    search,
    sources,
    transfer,
    watchlist,
)
from app.core.config import settings
from app.core.db import SessionLocal, init_db

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger("radar")

SCHEDULER_TICK_SECONDS = 300  # check for due sources every 5 minutes


async def _scheduler_loop() -> None:
    """~20-line asyncio scheduler (DEC-016): run due sources every tick."""
    from app.ingestion.pipeline import ingest_all

    while True:
        try:
            await asyncio.sleep(SCHEDULER_TICK_SECONDS)
            db = SessionLocal()
            try:
                runs = await asyncio.to_thread(ingest_all, db, False, None)
                if runs:
                    logger.info("Scheduler ingested %d sources", len(runs))
            finally:
                db.close()
        except asyncio.CancelledError:
            raise
        except Exception:  # never let the loop die silently
            logger.exception("Scheduler tick failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Auto-seed on first run so the app is never empty (idempotent).
    db = SessionLocal()
    try:
        from app.services.seeder import seed_all

        counts = seed_all(db)
        logger.info("Seed check: %s", counts)
    except Exception:
        logger.exception("Seeding failed — continuing with existing data")
    finally:
        db.close()

    task = None
    if settings.scheduler_enabled:
        task = asyncio.create_task(_scheduler_loop())
        logger.info("Ingestion scheduler enabled (tick=%ss)", SCHEDULER_TICK_SECONDS)
    yield
    if task:
        task.cancel()


app = FastAPI(title="AI Governance Radar", version=__version__, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = FastAPI(title="AI Governance Radar API", version=__version__)
for router in (meta.router, sources.router, items.router, entities.router,
               incidents.router, watchlist.router, search.router, dashboard.router,
               ingest.router, transfer.router):
    api.include_router(router)
app.mount("/api", api)

# Serve the built SPA when present (DEC-017). Dev mode uses Vite on :5173 instead.
_SPA_DIR = Path(settings.spa_dir)
if _SPA_DIR.exists():
    app.mount("/assets", StaticFiles(directory=_SPA_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        target = _SPA_DIR / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(_SPA_DIR / "index.html")
