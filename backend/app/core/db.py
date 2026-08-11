"""Database engine, session, and initialization (SQLite-only in V1, DEC-019/021)."""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def _make_engine(url: str | None = None):
    url = url or settings.database_url
    if url.startswith("sqlite:///"):
        db_path = url.removeprefix("sqlite:///")
        if db_path != ":memory:":
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    eng = create_engine(url, connect_args={"check_same_thread": False})

    @event.listens_for(eng, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _record):  # pragma: no cover - trivial
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return eng


engine = _make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

FTS_CREATE = """
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
    title, excerpt, entity_names, tokenize='porter unicode61'
)
"""


def init_db(eng=None) -> None:
    """Create all tables + FTS index. Pre-release schema management (DEC-021)."""
    eng = eng or engine
    # Import models so metadata is populated.
    from app import models  # noqa: F401

    Base.metadata.create_all(eng)
    with eng.begin() as conn:
        conn.execute(text(FTS_CREATE))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
