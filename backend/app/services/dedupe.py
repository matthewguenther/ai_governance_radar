"""Deduplication + conservative event clustering (§62, DEC-020 review posture).

Exact dedupe: (source_id, canonical_url) unique constraint + content_hash comparison.
Cross-source clustering: near-exact normalized-title match within a 72h window —
deliberately conservative to avoid false merges (T-027).
"""

import re
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Item, ItemCluster, Source

CLUSTER_WINDOW = timedelta(hours=72)

_STOP = {"the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "its", "is", "as"}


def normalize_title(title: str) -> str:
    words = re.sub(r"[^a-z0-9 ]", " ", title.lower()).split()
    return " ".join(w for w in words if w not in _STOP)


def titles_match(a: str, b: str) -> bool:
    """Near-exact: identical normalized titles, or one contains the other with >=5 words."""
    na, nb = normalize_title(a), normalize_title(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    shorter, longer = (na, nb) if len(na) <= len(nb) else (nb, na)
    return len(shorter.split()) >= 5 and shorter in longer


def assign_cluster(db: Session, item: Item) -> None:
    """Cluster a newly ingested item with near-duplicate coverage from other sources."""
    ref_time = item.published_at or item.first_seen_at
    lo, hi = ref_time - CLUSTER_WINDOW, ref_time + CLUSTER_WINDOW
    candidates = db.execute(
        select(Item)
        .where(Item.id != item.id, Item.source_id != item.source_id)
        .where((Item.published_at.between(lo, hi)) | (Item.first_seen_at.between(lo, hi)))
    ).scalars().all()

    match = next((c for c in candidates if titles_match(item.title, c.title)), None)
    if match is None:
        return

    if match.cluster_id is not None:
        cluster = db.get(ItemCluster, match.cluster_id)
        assert cluster is not None  # FK guarantees existence
    else:
        cluster = ItemCluster(title=match.title, primary_item_id=match.id)
        db.add(cluster)
        db.flush()
        match.cluster_id = cluster.id
    item.cluster_id = cluster.id
    _update_primary(db, cluster)


def _update_primary(db: Session, cluster: ItemCluster) -> None:
    """Primary evidence = the clustered item from the highest-reliability source (§62)."""
    members = db.execute(
        select(Item, Source.reliability_tier)
        .join(Source, Item.source_id == Source.id)
        .where(Item.cluster_id == cluster.id)
    ).all()
    if members:
        best = min(members, key=lambda row: row[1])
        cluster.primary_item_id = best[0].id
