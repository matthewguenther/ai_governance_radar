# Data Model

SQLAlchemy 2.0 models on **SQLite only** (DEC-019). Pre-release schema via
`create_all()`; Alembic begins at V1 schema freeze (DEC-021). Follows the spec's
guidance (§30): start with a core subset, expand deliberately. 11 tables (+ FTS5
virtual index) after `watches` was dropped with the watchlist (DEC-028).
`summaries`, `embeddings`, `model_providers`, `users`, `rankings`, `tags` tables are
**deferred** (Phase 2+ / when a feature needs them).

Conventions: integer PK `id`; UTC ISO-8601 timestamps (`*_at`); `created_at` /
`updated_at` on every table; enums stored as short strings (readable, greppable);
JSON columns for flexible metadata. Jurisdictions are a **static Python module**
(`core/jurisdictions.py`: code, name, kind, parent_code, iso3), not a table (DEC-018) —
columns named `jurisdiction_code` validate against it in code.

## V1 tables

### sources (§5.1, §31)
| column | type | notes |
|---|---|---|
| id | int PK | |
| name | str, unique | e.g. "NIST News" |
| url | str | homepage |
| feed_url | str? | RSS/Atom/API endpoint if any |
| source_type | str | `rss` \| `atom` \| `json_api` \| `page_watch` (hash-based change monitoring, DEC-020) |
| category_default | str? | default category for its items |
| jurisdiction_code | str? | validated against core/jurisdictions.py |
| reliability_tier | int | 1–4 (§31); tier 4 can never establish regulatory facts |
| polling_interval_minutes | int | default 360 |
| enabled | bool | |
| attribution | str? | attribution requirements text |
| last_success_at / last_failure_at | datetime? | |
| last_error | str? | |

### source_runs (§59 — failures are data)
id, source_id FK, started_at, finished_at, status (`success`|`error`|`partial`),
items_found, items_new, items_updated, error_message, http_status.

### items (§5.2)
| column | type | notes |
|---|---|---|
| id | int PK | |
| source_id | int FK | |
| url | str | original URL — always preserved |
| canonical_url | str, indexed | normalized for dedupe |
| content_hash | str, indexed | sha256 of normalized title+body |
| title | str | |
| excerpt | text? | plain text, ≤ ~500 chars, sanitized |
| published_at | datetime? | from source |
| first_seen_at / last_seen_at | datetime | retrieval timestamps — always preserved |
| categories | JSON | list: `regulation`,`standard`,`incident`,`security`,`news`,`research`,`training`,`event`,`ranking` |
| jurisdiction_code | str? | |
| change_type | str? | `new` \| `update` \| `status_change` … |
| impact_score | int? | 0–100, transparent |
| impact_factors | JSON? | list of {factor, weight} → renders "why high impact?" |
| confidence | str | `high` \| `medium` \| `low` |
| fact_status | str? | `confirmed`\|`reported`\|`alleged`\|`under_investigation`\|`disputed` (§9) |
| cluster_id | int? FK item_clusters | dedupe/event grouping |
| raw_metadata | JSON? | parser leftovers |

### item_clusters (§62)
id, primary_item_id FK (highest-tier source = primary evidence), title, created_at.
Groups duplicate coverage of one real-world event.

### entities (§5.3)
| column | type | notes |
|---|---|---|
| id | int PK | |
| slug | str unique | `nist-ai-rmf`, `eu-ai-act` |
| name | str | |
| entity_type | str | `regulation` \| `standard` \| `framework` \| `organization` \| `program` |
| jurisdiction_code | str? | |
| description | text? | |
| official_url | str? | |
| current_status | str? | denormalized latest lifecycle status |
| metadata | JSON? | |

### regulations (1:1 extension of entities where entity_type='regulation') (§7)
entity_id PK/FK; government_level (`federal`|`state`|`local`|`supranational`);
status (lifecycle: `proposed`|`introduced`|`passed`|`signed`|`effective`|`amended`|
`enforcement` — jurisdiction-specific values allowed via status_label);
introduced_at?, passed_at?, signed_at?, effective_at?, compliance_deadline?,
last_amended_at?; enforcement_authority?, penalties?, covered_entities?,
risk_classification?, applicability_notes?; official_source_url;
confidence, last_verified_at. **Every status/date field is curated + evidence-linked;
ingestion may only flag "needs review", never write these silently.**

### standards (1:1 extension of entities where entity_type='standard') (§8)
entity_id PK/FK; publisher (`NIST`|`ISO`|`OWASP`|`MITRE`|`IEEE`|`CISA`|`OECD`|…);
version?; status (`announced`|`draft`|`public_comment`|`final`|`updated`|`amended`|
`withdrawn`|`superseded`); published_at?, last_updated_at?; change_magnitude
(`major`|`minor`|`editorial`)?; related_framework_slugs JSON; official_source_url.

### incidents (§9) — curated records, evidence via linked items
id; title; occurred_at?; reported_at; severity (`critical`|`high`|`medium`|`low`);
category (from §9 taxonomy: `prompt_injection`, `data_leakage`, `bias_discrimination`,
`deepfake_abuse`, `agent_failure`, `sandbox_escape`, `hallucination_harm`,
`ai_cyberattack`, `system_compromise`, `model_theft`, `data_poisoning`,
`model_manipulation`, `excessive_agency`, `tool_misuse`, `autonomous_failure`,
`safety_control_failure`, `privacy`, `other`); system_vendor?; system_type?;
geography?; affected_domain?; what_happened text; root_cause?; governance_relevance?;
security_relevance?; mitigation?; fact_status (§9 labels); confidence;
related_framework_slugs JSON (OWASP/ATLAS/NIST/ISO cross-links, §10).

### entity_events (§5.4 — the "changes" backbone)
id; entity_id FK; event_type (`created`|`status_change`|`document_updated`|
`date_changed`|`amended`|`enforcement`|`note`); occurred_at; previous_value?;
new_value?; summary; evidence_item_id? FK items; impact_score?; created_at.
Entity timeline = ordered entity_events.

### item_entities
item_id FK + entity_id FK (composite PK), relation (`about`|`mentions`|`evidence`).

### app_state
key PK, value JSON — single-user prefs: dashboard settings, last_visit_at,
default time window, visible modules. (Replaces a `users` table in V1.)

### items_fts (SQLite FTS5 virtual table)
Indexes items.title + excerpt (+ entity names), kept in sync on ingest. Queried
directly by the search service module — no dialect abstraction (DEC-019).

## Relationships (summary)

```
sources 1─* source_runs
sources 1─* items *─1 item_clusters
items *─* entities (item_entities)
entities 1─0..1 regulations            entities 1─0..1 standards
entities 1─* entity_events (*─0..1 evidence item)
incidents *─(evidence via item_entities on linked items; framework slugs JSON)
jurisdiction codes ← validated against core/jurisdictions.py (static module)
```

## Integrity rules (§65 — enforced in code + review, not just schema)

1. Structured legal/incident fields are only written via curated seed data or explicit
   API calls — never inferred by the ingestion pipeline.
2. Every regulation/standard/incident must carry ≥1 official source URL.
3. `confidence` and `fact_status` are mandatory on incidents; `last_verified_at`
   mandatory on regulations.
4. Items are immutable evidence except `last_seen_at`, scoring, and linkage fields.
