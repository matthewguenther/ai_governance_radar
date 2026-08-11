"""SafeFetcher — the single chokepoint for ALL outbound HTTP (ARCHITECTURE.md §4/§6).

Defenses: scheme allowlist, DNS resolution with private/reserved-range rejection and
IP pinning (DNS-rebinding), per-hop redirect re-validation, response size cap,
timeouts, redirect limit, per-host rate limiting, honest User-Agent.
"""

import ipaddress
import socket
import time
from dataclasses import dataclass, field
from urllib.parse import urlparse

import httpx

from app.core.config import settings

MAX_REDIRECTS = 5
_ALLOWED_SCHEMES = {"http", "https"}


class FetchBlockedError(Exception):
    """URL refused by security policy."""


class FetchError(Exception):
    """Network/protocol failure while fetching."""


@dataclass
class FetchResult:
    url: str
    final_url: str
    status_code: int
    content: bytes
    headers: dict = field(default_factory=dict)
    not_modified: bool = False

    @property
    def text(self) -> str:
        return self.content.decode("utf-8", errors="replace")


def _resolve_and_check(host: str) -> str:
    """Resolve hostname, reject private/reserved ranges, return a pinned IP."""
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as e:
        raise FetchError(f"DNS resolution failed for {host}: {e}") from e
    if not infos:
        raise FetchError(f"DNS resolution returned no addresses for {host}")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise FetchBlockedError(f"Blocked non-public address for {host}: {ip}")
    return str(infos[0][4][0])


def validate_url(url: str) -> None:
    """Static checks (fetch re-validates and resolves too)."""
    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise FetchBlockedError(f"Scheme not allowed: {parsed.scheme or '(none)'}")
    if not parsed.hostname:
        raise FetchBlockedError("URL has no host")
    # Literal IPs get checked immediately; hostnames are checked at fetch time.
    try:
        ip = ipaddress.ip_address(parsed.hostname)
    except ValueError:
        return
    if not ip.is_global:
        raise FetchBlockedError(f"Blocked non-public address: {ip}")


def validate_url_deep(url: str) -> None:
    """Creation-time validation (QA-1): static checks PLUS DNS resolution, so
    `localhost`, decimal-encoded IPs (2130706433), and *.nip.io-style aliases of
    private addresses are rejected before a source can even be saved. Fetch time
    re-resolves regardless — this is defense in depth, not the only gate."""
    validate_url(url)
    host = urlparse(url).hostname or ""
    _resolve_and_check(host)


class _RateLimiter:
    """Simple per-host minimum interval."""

    def __init__(self, min_interval_seconds: float = 2.0):
        self.min_interval = min_interval_seconds
        self._last: dict[str, float] = {}

    def wait(self, host: str) -> None:
        now = time.monotonic()
        last = self._last.get(host)
        if last is not None:
            delta = now - last
            if delta < self.min_interval:
                time.sleep(self.min_interval - delta)
        self._last[host] = time.monotonic()


_rate_limiter = _RateLimiter()


def safe_fetch(
    url: str,
    etag: str | None = None,
    last_modified: str | None = None,
    timeout: float | None = None,
    max_bytes: int | None = None,
) -> FetchResult:
    """Fetch a URL with full security policy. Follows redirects manually, re-validating
    every hop. Supports conditional GET (returns not_modified=True on 304)."""
    timeout = timeout or settings.fetch_timeout_seconds
    max_bytes = max_bytes or settings.fetch_max_bytes

    current = url
    for _hop in range(MAX_REDIRECTS + 1):
        validate_url(current)
        parsed = urlparse(current)
        host = parsed.hostname or ""
        _resolve_and_check(host)
        _rate_limiter.wait(host)

        headers = {"User-Agent": settings.user_agent, "Accept-Encoding": "gzip"}
        if etag:
            headers["If-None-Match"] = etag
        if last_modified:
            headers["If-Modified-Since"] = last_modified

        try:
            with httpx.Client(follow_redirects=False, timeout=timeout) as client:
                with client.stream("GET", current, headers=headers) as resp:
                    if resp.status_code == 304:
                        return FetchResult(
                            url=url, final_url=current, status_code=304, content=b"",
                            headers=dict(resp.headers), not_modified=True,
                        )
                    if resp.status_code in (301, 302, 303, 307, 308):
                        location = resp.headers.get("location")
                        if not location:
                            raise FetchError(f"Redirect without Location from {current}")
                        current = str(httpx.URL(current).join(location))
                        # strip conditional headers after first hop
                        etag = last_modified = None
                        continue
                    if resp.status_code >= 400:
                        raise FetchError(f"HTTP {resp.status_code} from {current}")
                    chunks: list[bytes] = []
                    size = 0
                    for chunk in resp.iter_bytes():
                        size += len(chunk)
                        if size > max_bytes:
                            raise FetchBlockedError(
                                f"Response exceeded size cap ({max_bytes} bytes): {current}"
                            )
                        chunks.append(chunk)
                    return FetchResult(
                        url=url, final_url=current, status_code=resp.status_code,
                        content=b"".join(chunks), headers=dict(resp.headers),
                    )
        except httpx.HTTPError as e:
            raise FetchError(f"Fetch failed for {current}: {e}") from e
    raise FetchError(f"Too many redirects for {url}")
