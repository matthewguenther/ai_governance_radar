"""Feed/API parsers → NormalizedItem list. No structured HTML scraping (DEC-020)."""

import hashlib
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from time import struct_time
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import feedparser
import nh3


@dataclass
class NormalizedItem:
    url: str
    canonical_url: str
    title: str
    excerpt: str | None
    published_at: datetime | None
    content_hash: str
    raw_metadata: dict = field(default_factory=dict)


_TRACKING_PARAMS = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
                    "utm_id", "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"}

EXCERPT_MAX = 500


def canonicalize_url(url: str) -> str:
    """Normalize URL for dedupe: lowercase scheme/host, drop fragment + trackers."""
    p = urlparse(url.strip())
    query = urlencode(
        [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
         if k.lower() not in _TRACKING_PARAMS]
    )
    path = p.path.rstrip("/") or "/"
    return urlunparse((p.scheme.lower(), (p.netloc or "").lower(), path, p.params, query, ""))


def sanitize_text(html_or_text: str) -> str:
    """Strip ALL markup → plain text, collapse whitespace. Excerpts are data, not markup."""
    text = nh3.clean(html_or_text, tags=set())  # no tags allowed → text only
    text = re.sub(r"\s+", " ", text).strip()
    return text


def make_excerpt(raw: str | None) -> str | None:
    if not raw:
        return None
    text = sanitize_text(raw)
    if not text:
        return None
    if len(text) > EXCERPT_MAX:
        text = text[: EXCERPT_MAX - 1].rsplit(" ", 1)[0] + "…"
    return text


def content_hash(title: str, body: str | None) -> str:
    normalized = re.sub(r"\s+", " ", f"{title} {body or ''}".strip().lower())
    return hashlib.sha256(normalized.encode()).hexdigest()


def _struct_to_dt(st: struct_time | None) -> datetime | None:
    if st is None:
        return None
    try:
        return datetime(*st[:6], tzinfo=UTC)
    except (ValueError, TypeError):
        return None


def parse_feed(content: bytes, base_url: str) -> list[NormalizedItem]:
    """RSS/Atom via feedparser. Malformed feeds yield whatever entries are salvageable."""
    parsed = feedparser.parse(content)
    items: list[NormalizedItem] = []
    for entry in parsed.entries:
        link = (entry.get("link") or "").strip()
        title_raw = entry.get("title") or ""
        title = sanitize_text(title_raw)[:500]
        if not link or not title:
            continue
        summary = entry.get("summary") or entry.get("description") or ""
        if not summary and entry.get("content"):
            try:
                summary = entry["content"][0].get("value", "")
            except (IndexError, KeyError, TypeError, AttributeError):
                summary = ""
        published = _struct_to_dt(
            entry.get("published_parsed") or entry.get("updated_parsed")
        )
        excerpt = make_excerpt(summary)
        items.append(
            NormalizedItem(
                url=link,
                canonical_url=canonicalize_url(link),
                title=title,
                excerpt=excerpt,
                published_at=published,
                content_hash=content_hash(title, excerpt),
                raw_metadata={"feed_title": sanitize_text(parsed.feed.get("title", ""))},
            )
        )
    return items


def parse_json_api(data: object, mapping: dict, base_url: str) -> list[NormalizedItem]:
    """Generic JSON API parser driven by a per-source field mapping (from YAML):

    mapping:
      items_path: "results"          # dot path to the list
      url: "html_url"                # field names (dot paths) within each item
      title: "title"
      summary: "abstract"            # optional
      published: "publication_date"  # optional, ISO 8601
    """

    def dig(obj: object, path: str) -> object:
        cur = obj
        for part in path.split("."):
            if isinstance(cur, dict):
                cur = cur.get(part)
            else:
                return None
        return cur

    rows = dig(data, mapping.get("items_path", "")) if mapping.get("items_path") else data
    if not isinstance(rows, list):
        return []
    items: list[NormalizedItem] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        url = str(dig(row, mapping.get("url", "url")) or "").strip()
        title = sanitize_text(str(dig(row, mapping.get("title", "title")) or ""))[:500]
        if not url or not title:
            continue
        summary = dig(row, mapping["summary"]) if mapping.get("summary") else None
        published_raw = dig(row, mapping["published"]) if mapping.get("published") else None
        published = None
        if isinstance(published_raw, str):
            try:
                published = datetime.fromisoformat(published_raw.replace("Z", "+00:00"))
                if published.tzinfo is None:
                    published = published.replace(tzinfo=UTC)
            except ValueError:
                published = None
        excerpt = make_excerpt(str(summary)) if summary else None
        items.append(
            NormalizedItem(
                url=url,
                canonical_url=canonicalize_url(url),
                title=title,
                excerpt=excerpt,
                published_at=published,
                content_hash=content_hash(title, excerpt),
            )
        )
    return items


def page_text_hash(content: bytes) -> str:
    """Hash of normalized page text for page_watch sources (DEC-020)."""
    text = sanitize_text(content.decode("utf-8", errors="replace"))
    return hashlib.sha256(text.lower().encode()).hexdigest()
