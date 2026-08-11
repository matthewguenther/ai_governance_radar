"""Test fixtures: isolated temp SQLite DB per session, no network ever."""

import os
import tempfile
from pathlib import Path

# Must run before any app import: point the app at a throwaway database.
_TMP = tempfile.mkdtemp(prefix="radar-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_TMP).as_posix()}/test.db"
os.environ["DEMO_DATA"] = "true"
os.environ["SCHEDULER_ENABLED"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import SessionLocal, engine, init_db  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def database():
    init_db(engine)
    yield engine


@pytest.fixture()
def db(database):
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def clean_db(database):
    """Truncate all tables for tests needing a pristine DB."""
    from sqlalchemy import text

    from app.core.db import Base

    session = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.execute(text("DELETE FROM items_fts"))
        session.commit()
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="session")
def client(database):
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def feed_bytes():
    def load(name: str) -> bytes:
        return (FIXTURES / "feeds" / name).read_bytes()

    return load
