# Source Catalog

Seed sources for V1 (§60). **T-007 live verification performed 2026-08-11** — verified
entries are in `data/sources/sources.yaml`; this catalog records outcomes. Preferred
ingestion order: official API > RSS/Atom > structured feed > official HTML > secondary
(§61).

## Verification outcomes (2026-08-11, honest User-Agent)

| Source | Mechanism | Result |
|---|---|---|
| NIST News | RSS `nist.gov/news-events/news/rss.xml` | ✅ verified — 40 items, conditional GET works |
| Federal Register (AI query) | official JSON API | ✅ verified — 20 items, public domain |
| GOV.UK AI announcements | Atom search feed | ✅ verified — 20 items, OGL v3 attribution |
| arXiv AI-security query | Atom API `export.arxiv.org` | ✅ verified — 20 items |
| NIST AI RMF page | page_watch | ✅ verified |
| EU AI Act (EUR-Lex) page | page_watch | ✅ verified (stable text hash) |
| MITRE ATLAS | page_watch `atlas.mitre.org/` | ✅ verified (`/resources/updates` was 404) |
| OWASP GenAI project | page_watch | ✅ verified (occasional dynamic-content hash churn; capped at 1 signal/day) |
| Stanford HAI News | page_watch | ✅ verified |
| CISA advisories | RSS | ❌ HTTP 403 for non-browser UA — shipped **disabled**, no UA spoofing |
| ISO 42001 page | page_watch | ❌ HTTP 403 for non-browser UA — shipped **disabled** |

## Second verification round (2026-08-11) — incidents, press, events

| Source | Mechanism | Result |
|---|---|---|
| **AI Incident Database** | RSS `incidentdatabase.ai/rss.xml` | ✅ verified — 100 entries, current within days. Primary incident stream (CC BY-SA). GraphQL API exists but needs POST; SafeFetcher is GET-only, so RSS is used. |
| European Commission — Digital Strategy | RSS | ✅ verified — official EU AI policy announcements (Tier 1) |
| The Register — AI/ML | Atom | ✅ verified — 50 entries, AI-specific section (Tier 3) |
| MIT Technology Review — AI | RSS | ✅ verified (Tier 3) |
| TechCrunch — AI | RSS | ✅ verified (Tier 3) |
| NIST Events | RSS | ✅ feed works, but **0 of 40 entries were AI-related** — NIST's events are mostly metrology/forensics. Kept enabled behind the AI-relevance filter so AI workshops surface when held. |
| OECD AI Incidents Monitor (AIM) | — | ❌ no feed/API found; JS application only |
| CSET Georgetown, Lawfare | RSS | ❌ HTTP 403 for non-browser UA |
| VentureBeat AI | RSS | ⚠️ parses, but newest entry was ~3 months stale — not adopted |
| Tortoise Global AI Index | — | ❌ not a live source: annual publication (5th edition, Sept 2024), no API. Useful as a curation reference, not for ingestion. |

### Events & training — feature removed (2026-08-11, DEC-027)
Nine event sources were tested (IAPP, OWASP, Stanford HAI, FPF, Brookings, FAccT,
AI Verify, Turing Institute, NIST) and **none offered RSS, ICS, or an API**. NIST's
events feed works but carried 0 AI-related entries out of 40.

A structured-data route did work — relvehq.com publishes schema.org `Event` JSON-LD
across ~58 sitemap-listed pages — but its catalogue is general AI/developer/security
conferences rather than AI governance, and training/certifications had no source at
all. The feature was removed rather than shipped at low relevance. If revisited,
the implementation is in git history (DEC-026) and the research above still stands.

Tiers (§31): 1 = primary authoritative · 2 = high-quality secondary · 3 = professional
reporting · 4 = community/discovery (never establishes regulatory facts alone).

## Governance / standards (Tier 1)
| Source | Likely mechanism | Categories | Status |
|---|---|---|---|
| NIST (news + AI RMF pages) | RSS + HTML | standards, governance | unverified |
| NIST AI Resource Center (airc.nist.gov) | HTML | standards | unverified |
| CISA (advisories + AI guidance) | RSS | security, governance | unverified |
| OWASP (LLM Top 10 / GenAI Security Project) | HTML / GitHub releases | security, standards | unverified |
| MITRE ATLAS | HTML / GitHub | security, standards | unverified |
| ISO (42001/23894/22989 status pages) | HTML (no feed expected) | standards | unverified |

## Regulation — US (Tier 1)
| Source | Likely mechanism | Categories | Status |
|---|---|---|---|
| Federal Register | **official API** (documented, JSON) | regulation | unverified |
| Congress.gov | API (api.congress.gov, key required — free) | regulation | unverified |
| State legislature sites (CO, CA, NY, TX, UT, CT, IL, WA) | varies; many lack feeds — start with curated entities + targeted pages | regulation | unverified |
| NYC (LL144 / DCWP) | HTML | regulation | unverified |

## Regulation — Global (Tier 1)
| Source | Likely mechanism | Categories | Status |
|---|---|---|---|
| EU (digital-strategy.ec.europa.eu / AI Act pages) | RSS/HTML | regulation | unverified |
| UK (gov.uk AI policy) | Atom (gov.uk has feeds) | regulation | unverified |
| Singapore (PDPC / IMDA) | HTML | regulation, governance | unverified |
| OECD.AI policy observatory | HTML/API | governance, rankings | unverified |
| UNESCO AI ethics | HTML | governance | unverified |

## Research (Tier 2)
| Source | Likely mechanism | Categories | Status |
|---|---|---|---|
| Stanford HAI / AI Index | RSS/HTML | research, rankings | unverified |
| arXiv (cs.CR / cs.CY targeted queries) | official API | research, security | unverified |

## Incidents (Tier 1–2)
| Source | Likely mechanism | Categories | Status |
|---|---|---|---|
| AI Incident Database (incidentdatabase.ai) | API/export | incident | unverified |
| OECD AIM (AI incidents monitor) | HTML | incident | unverified |
| Official breach/incident reports (FTC, ICO, state AGs) | RSS/HTML | incident | unverified |

## Notes
- V1 needs **≥6 verified** sources spanning regulation, standards, security, incidents.
- Many Tier-1 regulatory sources have no feeds; that's why regulations are curated
  entities (DEC-014) with sources providing evidence items, not auto-status.
- Record attribution requirements per source when verifying (§32).
