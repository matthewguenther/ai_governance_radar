"""FTS5-backed search (§28, DEC-019 — direct FTS5, no dialect abstraction)."""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Entity, Item


def index_item(db: Session, item: Item, entity_names: str = "") -> None:
    db.execute(text("DELETE FROM items_fts WHERE rowid = :rid"), {"rid": item.id})
    db.execute(
        text(
            "INSERT INTO items_fts (rowid, title, excerpt, entity_names) "
            "VALUES (:rid, :title, :excerpt, :names)"
        ),
        {
            "rid": item.id,
            "title": item.title,
            "excerpt": item.excerpt or "",
            "names": entity_names,
        },
    )


def reindex_all(db: Session) -> int:
    db.execute(text("DELETE FROM items_fts"))
    count = 0
    for item in db.query(Item).all():
        names = " ".join(link.entity.name for link in item.entity_links)
        index_item(db, item, names)
        count += 1
    return count


def _fts_query(q: str) -> str:
    """Build a safe FTS5 MATCH query: quoted prefix terms, no user-controlled syntax."""
    terms = [t.replace('"', "") for t in q.split() if t.strip('"')]
    return " ".join(f'"{t}"*' for t in terms[:8])


def search_item_ids(db: Session, q: str, limit: int = 100) -> list[int]:
    match = _fts_query(q)
    if not match:
        return []
    rows = db.execute(
        text("SELECT rowid FROM items_fts WHERE items_fts MATCH :q ORDER BY rank LIMIT :lim"),
        {"q": match, "lim": limit},
    ).fetchall()
    return [r[0] for r in rows]


def search_entities(db: Session, q: str, limit: int = 25) -> list[Entity]:
    """Entities searched via LIKE on name/slug (small table; FTS unnecessary)."""
    pattern = f"%{q.strip()}%"
    return (
        db.query(Entity)
        .filter((Entity.name.ilike(pattern)) | (Entity.slug.ilike(pattern)))
        .limit(limit)
        .all()
    )
