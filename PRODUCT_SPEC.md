# AI Governance Radar — Product Specification (Normalized)

> **Provenance:** This is the normalized, version-controlled working spec, derived from
> `AI_Governance_Radar_Product_Design_Development_Spec.md` (the original 93-section source
> document, currently excluded from git by `.gitignore`). Section references like (§NN) point
> to the original. Requirements were reorganized and condensed, **not materially changed**;
> every scope clarification or deviation is recorded in [DECISIONS.md](DECISIONS.md).

## 1. What this product is

An open-source, self-hostable, local-first **AI Governance Intelligence Dashboard** for AI
governance / risk / security / GRC professionals. It collects, normalizes, deduplicates,
classifies, and surfaces developments in AI regulation, standards, incidents, and security —
emphasizing **what changed and why it matters**, not a chronological news feed. (§1–3)

> Radar detects. Intelligence explains. Dashboard prioritizes. (§2)

Hard product constraints (§1):

1. Free to use, open source, self-hostable
2. Model-agnostic; **no single AI provider required**
3. **Fully useful without any LLM or paid API key**
4. Works with local LLMs (Ollama etc.) and commercial models when the user opts in

## 2. Non-goals for V1 (§4)

Not a generic AI news site, social network, SaaS, full GRC platform, legal-advice system,
model marketplace, chatbot-with-dashboard, giant scraping framework, or mandatory cloud
service. No required OpenAI/Anthropic/Google key — ever.

## 3. Core concepts (§5)

| Concept | Definition |
|---|---|
| **Source** | An origin of information (NIST, ISO, OWASP, MITRE, CISA, EU bodies, state governments, incident DBs…). Carries metadata: name, URL, type, jurisdiction, reliability tier, feed URL, polling interval, enabled flag, last success/failure, attribution requirements. |
| **Item** | An individual piece of collected information. Retains original URL, source, pub date, first/last-seen, title, excerpt (where permitted), categories, jurisdiction, impact, confidence, related entities/frameworks, change type. |
| **Entity** | A thing tracked over time (NIST AI RMF, ISO/IEC 42001, Colorado AI Act, EU AI Act, OWASP LLM Top 10, MITRE ATLAS…). Entities have timelines and must answer "what changed about this in the last six months?" |
| **Change** | Changes matter more than documents: new/updated document, draft→final, regulation proposed/passed/signed/effective/amended, enforcement action, guidance issued/withdrawn, ranking moved, incident added/reclassified. The UI emphasizes changes. |
| **Watchlist** | Users watch entities, sources, jurisdictions, categories, topics. Dashboard answers: "how many watched things changed since my last visit?" |

## 4. V1 scope

**V1 = the Phase 0 + Phase 1 + Phase 1.5 build lists (§66) measured against the §74
acceptance criteria.** The spec describes nine intelligence domains (§6); the four that are
in the Phase 1 build list and acceptance criteria are V1 domains. The rest are represented
in the data model (as item categories) but get no dedicated pages in V1. See DEC-010.

### In scope (V1)

- **Regulatory Radar** (§6.1, §7, §22) — US federal/state + global jurisdiction tracking.
  Regulation lifecycle: PROPOSED → INTRODUCED → PASSED → SIGNED/ENACTED → EFFECTIVE →
  AMENDED → ENFORCEMENT, with jurisdiction-specific statuses. Structured fields per §7
  (jurisdiction, level, status, key dates, deadline, authority, penalties, covered entities,
  risk classification, sources, confidence, last-verified). **Legal status must be grounded
  in source records/structured data — never solely an LLM summary. Regulations are database
  entities, never hard-coded in frontend components.**
- **Standards & Frameworks Radar** (§8, §23) — NIST AI RMF (+profiles), ISO/IEC 42001/23894/22989,
  OWASP LLM Top 10 & Agentic AI, MITRE ATLAS, CISA, OECD, UNESCO, IEEE, ENISA. Document
  lifecycle: ANNOUNCED / DRAFT / PUBLIC COMMENT / FINAL / UPDATED / AMENDED / WITHDRAWN /
  SUPERSEDED. Standards cards show name, version, status, dates, change magnitude, summary,
  related frameworks, official source, watch state.
- **AI Incident Intelligence** (§9, §24) — categorized incidents (prompt injection, data
  leakage, bias, deepfake abuse, agent failure, model theft, poisoning, excessive agency…)
  with severity, geography, root cause, governance/security relevance, related frameworks,
  confidence. Fact status labels: Confirmed / Reported / Alleged / Under investigation /
  Disputed. **Never fabricate incident details.** Incident detail page reads like a security
  intelligence report.
- **AI Security Radar** (§10) — security content cross-linked to governance frameworks
  (Incident → OWASP category → ATLAS technique → NIST RMF function → ISO 42001). In V1 this
  is a category/cross-linking capability, not a separate page.
- **Curated news** (§11) — prioritized by regulatory/standards/incident/security relevance;
  generic model-release news only when governance-relevant. In V1: category + impact
  filtering, no dedicated page beyond items views.
- **Dashboard** (§17–21): KPI cards (High Impact / Total Changes / Incidents / New
  Opportunities — each click-through to a filtered view), Top Developments (5–7 items with
  severity badge, source, category, one-line explanation, relative time, link), global
  regulatory heat map (clearly labeled metric; color ≠ good/bad), incidents card, standards
  watch card.
- **Watchlist** (§5.5, §51) — Watch button on every entity; watchlist page shows per-item
  change status; dashboard counts changes since last visit.
- **Search** (§28) — across title/source/entity/regulation/jurisdiction/framework/incident/
  tags/extracted text; results grouped by type (REGULATIONS / STANDARDS / INCIDENTS / NEWS /
  EVENTS / TRAINING).
- **Item detail / intelligence view** (§26) — What happened / Why it matters / Who is
  affected / What changed / Related / Evidence (source links) / Confidence.
- **Morning Brief** (§25) — "what happened since I last looked?", **generated
  deterministically from stored data**; LLM narrative is optional and out of V1 scope.
- **Settings** (§50) — sources (enable/disable, polling, manual creation), dashboard prefs,
  AI provider config placeholder (disabled in V1), notifications marked future.
- **Ingestion pipeline** (§29, §60–62) — source registry → fetch (API > RSS/Atom >
  structured feed > official HTML > secondary) → normalize → dedupe → classify → change
  detection → impact/confidence → DB → REST API → frontend. Respect robots.txt, rate
  limits, ToS, copyright; store metadata + short excerpts, never republish full articles.
- **Data quality** (§31–32, §62–65): 4-tier source reliability model (Tier 1 primary
  authoritative → Tier 4 community/discovery; Tier 4 never independently establishes
  regulatory facts). Every item preserves source, pub date, original URL, retrieval date.
  Duplicate events group into one intelligence event with the official source as primary
  evidence. **Impact and confidence are separate, both surfaced, both transparent**
  ("Why is this high impact?" must be explainable). Structured claims require evidence;
  nothing may silently invent legal status, dates, penalties, incident details, costs,
  or rankings.
- **API** (§54) — documented, provider-neutral REST endpoints: items, entities,
  regulations, standards, incidents, sources, watchlist, ingest trigger.
- **Import/export** (§53) — JSON/CSV export, JSON/CSV import for watchlists and
  configuration (no vendor lock-in).

### Explicitly deferred (with phase)

- Dedicated Rankings & Indices pages (§12) — Phase 2+ (data model supports snapshots)
- Dedicated Training & Certifications page (§13) — Phase 2+ (ingested as items/categories)
- Dedicated Conferences & Webinars page (§14) — Phase 2+ (ingested as items/categories)
- LLM provider abstraction, OpenRouter/Ollama/OpenAI-compatible/Anthropic providers,
  model routing, semantic search, structured summaries (§33–38) — **Phase 2**
- Agentic workflows: research / regulatory-change / incident-analysis agents,
  evaluator-optimizer (§39–42) — **Phase 2/3**
- LLM-narrative Morning Brief, scheduled research, notifications, weekly reports,
  cross-framework mapping automation (§25, §81) — **Phase 3**
- Governance Graph (§79), Personal Intelligence Layer (§80), MCP server (§82),
  Governance Copilot (§83), community source packs (Phase 4)
- Reports & export formats beyond JSON/CSV (§52) — future
- Multi-user accounts/auth — not in spec's V1 criteria; single-user local-first (DEC-008)

## 5. UX direction (§15–19, §55–59)

- **Dark-first, dense, professional intelligence terminal** — Bloomberg-terminal feel, not
  an admin panel, RSS reader, or marketing site. Details in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Semantic colors only (red=critical, orange=medium/high, yellow=watch, green=healthy,
  blue=informational, purple=emerging/research); **color is never the only indicator**.
- Fixed left sidebar (collapsible to icons): Home, Morning Brief, Regulatory Radar, Global
  Landscape, Standards & Frameworks, Incidents & Risks, News & Insights, Rankings,
  Training, Events, Watchlist, Reports, Settings. (Deferred domains appear as disabled/
  future entries or are hidden until built.)
- Desktop primary; tablet functional; mobile uses bottom nav with priority: Morning Brief,
  Top Developments, Watchlist, Regulatory changes, Incidents, Standards.
- Accessibility baseline: keyboard nav, visible focus, contrast, semantic HTML, screen-reader
  labels, reduced motion. Restrained animation. Meaningful empty states; visible, actionable
  error states — **never silently discard ingestion failures**.

## 6. Security & privacy requirements (§43–44, §86)

- Retrieved web content is **untrusted data**; source content must never be able to act as
  instructions (prompt-injection boundary, relevant from Phase 2 but architected now).
- Local-first privacy: watchlists, notes, keys, DB contents never leave the machine unless
  the user explicitly enables a cloud provider.
- API keys: never committed, never logged, never in client bundles; env-var support.
- SSRF protection for user-added source URLs; safe fetch (timeouts, size limits, scheme
  allowlist, private-IP blocking); rate limiting; HTML sanitization; XSS protection;
  parameterized DB access; safe Markdown rendering; dependency scanning; secure Docker config.

## 7. Legal disclaimer (§87)

The app is an information tool, not legal advice. Legal/regulatory info always shows
source, date, jurisdiction, confidence, and verification timestamp. When uncertain, say so.

## 8. Deployment (§45–49)

- **Canonical: local-first.** `git clone` → `docker compose up` → `http://localhost:3000`.
  Plain non-Docker dev mode must also work (two documented commands).
- Optional profiles: `docker compose --profile ai up` adds Ollama (Phase 2); never force
  model downloads; CPU-only must work.
- Netlify may host the frontend of a public demo later; GitHub Actions may run demo
  ingestion later. **Local deployment must not depend on either.**

## 9. V1 acceptance criteria (§74) — authoritative

**Functional:** app starts locally with documented commands; DB initializes automatically;
seed data loads; several real authoritative sources are ingestible; items searchable;
regulations filterable; standards filterable; incidents viewable; watchlist works; source
attribution works; API works; configuration works.

**UI:** dark intelligence-dashboard aesthetic; desktop layout matches design direction;
responsive tablet + mobile layouts; strong hierarchy; consistent badges/cards; loading,
empty, and error states; accessible navigation.

**Data quality:** duplicate detection; source tiering; confidence scores; impact scores;
original URLs + retrieval timestamps preserved; no unsupported legal facts.

**Engineering:** typecheck, lint, tests, and production build pass; Docker deployment
works; env vars documented; no secrets committed.

**Definition of done for any feature (§75):** implemented + tested + documented + visually
verified + error states handled + accessibility reviewed.

## 10. Priority order when requirements conflict (§93)

1. Correctness 2. Source integrity 3. Security 4. User value 5. Usability
6. Visual quality 7. Maintainability 8. Feature breadth

The goal is the **best open-source AI Governance Radar that one person can actually
maintain** — a small, excellent V1.
