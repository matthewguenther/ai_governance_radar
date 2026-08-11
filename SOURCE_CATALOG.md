# Source Catalog

Candidate seed sources for V1 (§60). **Every row is UNVERIFIED until T-007 confirms the
actual feed/API URL, format, cadence, and ToS/robots by fetching it.** Do not copy
unverified URLs into `data/sources/` YAML. Preferred ingestion order: official API >
RSS/Atom > structured feed > official HTML > secondary (§61).

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
