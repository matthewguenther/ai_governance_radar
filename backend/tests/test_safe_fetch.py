"""SafeFetcher security tests — must-pass cases from TEST_PLAN.md."""

import pytest

from app.ingestion.safe_fetch import FetchBlockedError, _resolve_and_check, validate_url


@pytest.mark.parametrize("url", [
    "file:///etc/passwd",
    "ftp://example.org/data",
    "gopher://example.org/",
    "javascript:alert(1)",
    "http://",
])
def test_blocked_schemes_and_malformed(url):
    with pytest.raises(FetchBlockedError):
        validate_url(url)


@pytest.mark.parametrize("url", [
    "http://127.0.0.1/admin",
    "http://10.0.0.5/internal",
    "http://192.168.1.1/router",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://0.0.0.0/",
])
def test_blocked_private_literal_ips(url):
    with pytest.raises(FetchBlockedError):
        validate_url(url)


def test_public_urls_pass_static_validation():
    validate_url("https://www.nist.gov/news-events/news/rss.xml")
    validate_url("http://example.org/feed")


def test_dns_resolution_blocks_loopback_hostname():
    # localhost resolves to 127.0.0.1 → must be blocked at resolution time
    with pytest.raises(FetchBlockedError):
        _resolve_and_check("localhost")
