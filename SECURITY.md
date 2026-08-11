# Security Policy

## Reporting a vulnerability

Please open a private security advisory on GitHub (Security ▸ Advisories ▸ Report a
vulnerability) rather than a public issue. Include reproduction steps and impact.

## Deployment model & boundaries

AI Governance Radar is **local-first and single-user**. V1 has **no authentication** by
design (DECISIONS.md DEC-008):

- The API binds to `127.0.0.1` by default. **Do not expose the port to untrusted
  networks.** If you must host it, put it behind your own authenticating reverse proxy.
- The Docker image listens on `0.0.0.0` *inside the container*; compose maps it to
  localhost only.

## Built-in protections

- **SafeFetcher** is the single chokepoint for all outbound HTTP: scheme allowlist,
  DNS resolution with private/loopback/link-local rejection (SSRF + DNS-rebinding),
  per-hop redirect re-validation, response size caps, timeouts, per-host rate limits,
  honest User-Agent. User-added source URLs are validated at creation *and* every fetch.
- All fetched content is sanitized to plain text before storage; the frontend never
  renders source-derived HTML.
- No API keys or secrets exist in V1; `.env` is gitignored; nothing secret is bundled
  client-side.
- ORM-parameterized queries; FTS queries are built from quoted terms, never raw user
  syntax.
- V1 contains no LLM code paths; retrieved web content can never act as instructions.
