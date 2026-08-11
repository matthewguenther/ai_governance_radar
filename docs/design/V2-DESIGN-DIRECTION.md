# V2 Design Direction — "Ink & Signal"

**Status: SUPERSEDED (2026-08-11).** After prototyping three directions, the owner
selected **Direction A — "Refined Intelligence Dashboard" (rev 2)**, which now ships
as the production design; see [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md). This
document is retained as design research: its critique of the original V1 UI and its
reference analysis informed the shipped direction (density discipline, color-as-data,
status-strip thinking), while its warm-ink/serif/Bloomberg-mosaic proposals were
explored as prototype Directions B and C and not adopted.
Scope: visual design and UX only. The widget/module dashboard concept, information
architecture, functionality, schema, APIs, and ingestion are all unchanged by this
document. The modular, scannable, multi-domain dashboard is a core product asset and
is preserved and strengthened here — not replaced.

The target feeling, in one sentence:

> **An intelligence terminal edited like a serious newspaper** — Bloomberg's density
> and accountability-per-pixel, with the Financial Times' editorial warmth and
> typographic confidence. Built for analysts, not for a landing page.

---

## 1. Design principles

1. **Every pixel is accountable.** Hierarchy is earned by information importance,
   never by decoration. If an element doesn't help an analyst decide what to read or
   do next, it goes.
2. **Headlines over badges.** The content is the interface. Metadata (impact,
   confidence, source, time) supports the headline; it never outshouts it.
3. **Alignment beats boxes.** Scannability comes from a strict grid and aligned
   columns, not from wrapping everything in a card. Chrome is the last resort.
4. **Color is data.** Semantic colors appear only where they encode meaning
   (severity, status, category). Identity color is rare and therefore powerful.
   Neutral ink does everything else.
5. **Monospace is the voice of data; serif is the voice of judgment.** Numbers,
   timestamps, codes, and labels speak in mono. Headlines and analysis speak in a
   display face. UI chrome stays quiet in a neutral sans.
6. **Absolute time, always available.** Analysts cite intelligence; "2h ago" is a
   convenience, "Aug 11 14:32 UTC" is a fact. Terminals show the clock.
7. **The system shows its own state.** Data freshness, source health, and coverage
   window are ambient, first-class UI — a terminal you trust tells you how current it is.
8. **Distinctive through discipline, not effects.** No gradients-as-decoration, no
   glass, no glow, no oversized radii. The identity comes from typography, the module
   language, the warm ink palette, and density done well.

## 2. Research references

- **Bloomberg Terminal** — information density, keyboard-first speed, mono tabular
  data, color-as-data on near-black, deliberate continuity of its bitmap-derived
  type; "conceals complexity, reveals density." ([density discussion](https://mattstromawn.com/writing/ui-density/),
  [Bloomberg on color accessibility](https://www.bloomberg.com/company/stories/designing-the-terminal-for-color-accessibility/),
  [Bloomberg UX on concealing complexity](https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity))
- **Financial Times** — the most ownable identity move in publishing is a *surface
  color* (FT paper pink); restrained hairline rules; the Origami system's principle
  of one coherent language across products; the Visual Vocabulary for chart-type
  discipline. ([Origami principles](https://medium.com/@kaelig/origami-design-principles-at-the-financial-times-a76a14d24050),
  [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md))
- **The Economist** — the section top-rule as a structural signature; editorial
  typography carrying hierarchy; small multiples; charts with almost no chrome.
- **Our World in Data** — annotations on the chart instead of legends; sources cited
  under every visualization; muted, deliberate palettes. ([OWID redesign notes](https://ourworldindata.org/redesigning-our-interactive-data-visualizations))
- **Palantir Blueprint** — dense dark UI done rigorously: compact controls, squared
  corners, strong focus treatment, restrained hue count.
- **Ops/monitoring done well (SOC consoles, Grafana at its best)** — status as small
  consistent glyph+text tokens in fixed-width columns; freshness indicators.

**Borrowing principles, not pixels** — nothing below copies any product's trade dress.

## 3. What we should borrow

| From | Principle |
|---|---|
| Bloomberg | Density with aligned mono data; color only as signal; the status strip/clock; stat "tickers" instead of stat "cards" |
| FT | An ownable *surface tint* as identity; hairline rules; serif headlines over data |
| Economist | Colored top-rule as the section/domain signature; charts stripped to the data |
| OWID | Source + as-of citation under every visualization; direct labeling |
| Blueprint | 2px radii, compact control heights, disciplined dark-theme elevation |
| SOC consoles | `● OK` / `▲ ERR` style status tokens; fixed-width health columns |

## 4. What we should avoid

- Blue-black background + blue accent (the default look of every AI dashboard)
- Rounded tinted pills with colored dots (the shadcn/Tailwind tell — we have them today)
- Floating cards with big gaps, big radii, soft shadows; glassmorphism; glow effects
  (we currently have one on the High Impact KPI — it goes)
- Gradients as decoration; illustration; oversized hero numbers with tiny context
- Animation that exists to be noticed; skeleton shimmer as a personality trait
- Icon soup — icons only where they carry meaning faster than a word

## 5. Critique of the current UI (from the running app, all routes)

### What works and must be preserved
- **The module/widget dashboard concept and its grid** — four KPIs, Top Developments,
  map, incidents, standards watch. The scan-multiple-domains-at-once layout is right.
- Information architecture and navigation structure; the dense Regulatory Radar table;
  the entity timeline; the incident report layout (§24 feel is genuinely there).
- The discipline already in place: dark-first, semantic color vocabulary, text-always
  badges (never color-only), mono for timestamps/labels, source attribution blocks,
  meaningful empty/error states, DEMO flagging, the impact-factor breakdown drawer.
- Restrained motion; solid keyboard/focus behavior.

### What feels generic (the "vibe-coded SaaS" tells)
1. **Blue-black + blue accent + rounded cards + tinted pills** — the exact default
   stack of contemporary AI dashboards. Nothing about the surface says *this product*.
2. **Every widget is the same card.** Identical header treatment, identical body
   chrome — the Incidents module and the Standards module differ only in text. The
   modular concept deserves a modular *language* (domain identity per module).
3. **Badge noise inverts hierarchy.** Item rows lead with 2–3 pills of equal visual
   weight (`● HIGH IMPACT 85` `● CONF HIGH` `DEMO DATA`); on the live dashboard the
   eye reads colored pills first and headlines second. Analysts scan headlines.
4. **KPI cards are boxes with small numbers.** Large padding, small value, lots of
   air — they read as placeholders (especially "0"). Terminals make numbers the
   object: huge, tabular, tightly labeled, with deltas.
5. **The map floats.** Ocean = page background inside a card; small landmass in a big
   panel; ramp uses the accent blue (identity and data conflated); no graticule, no
   cartographic texture — reads like a default choropleth component.
6. **The header row is dead space.** One search box. A terminal would show the UTC
   clock, coverage window, freshness, and source health here.
7. Relative-only timestamps ("19h ago") on most rows; absolute time hidden until the
   drawer.

### Visual inconsistencies found
- Title-case vs uppercase labels mix within the same modules; pill heights vary
  slightly between SeverityBadge/ConfidenceBadge/TierBadge/DemoBadge.
- Three different "list row" treatments (Top Developments row, Incidents card list,
  Standards watch list) with different paddings on the same dashboard.
- Standards page cards: `dl` rows are faint gray-on-gray with near-equal weight
  label/value; the publisher (the most identifying fact) is the smallest text on the card.
- The glow effect on the High Impact KPI is the only shadow-effect in the app —
  inconsistent with the otherwise flat language.
- Watch button appears in three sizes/styles across table, card, and page header.

### Content observation (out of scope here, but visible)
The GOV.UK keyword feed surfaces non-AI items ("cost of living", scholarships) badged
HIGH IMPACT — a classifier precision issue that no visual design can hide. Logged for
a future data-quality task; the *design* must still assume occasional noise (headline-
first hierarchy helps analysts skip noise fast).

## 6. Proposed visual identity — "Ink & Signal"

Three moves define the identity; everything else follows from them.

1. **Warm ink surfaces.** Replace the blue-black family with warm near-black "ink"
   (below). It is the FT-paper move translated to dark: instantly differentiated from
   the blue-cast default of the genre, calmer, and it makes the cool semantic colors
   (red/orange/blue) *pop harder* because the ground no longer competes in hue.
2. **Signal amber as the only identity color.** A restrained amber (terminal
   heritage) used *only* for: active navigation marker, focus ring, selection,
   primary action, the radar glyph, and the live/freshness indicator. Blue is demoted
   to a purely semantic "informational" value. Rarity makes it a signature.
3. **The module rule.** Every widget/module carries a 2px top rule in its
   intelligence-domain color plus a standardized mono header. It's the Economist rule
   turned into a system: the dashboard becomes a mosaic of domain-coded panels you
   can identify from across the room — the "distinctive widget language" the cards
   currently lack.

Supporting moves: near-flush tiling (panels share hairline borders on the dashboard
grid instead of floating with wide gaps), 2px corner radius everywhere (from 10px),
no shadows/glows (borders + surface steps only), serif headlines (see §8), and a
terminal **status strip** in the header (UTC clock · coverage window · sources OK/ERR
· last ingest).

## 7. Widget design system — the "module" language

Anatomy of every module (dashboard widgets, page panels — one system):

```
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜ ← 2px domain rule
▌ ◆ TOP DEVELOPMENTS            7 ITEMS   [View all →]  ▐ ← header bar, 28px:
▌───────────────────────────────────────────────────────▐    mono 11px uppercase title,
▌ 14:02  I▮▮▮▯ 85  Colorado AG opens rulemaking on…     ▐    glyph, mono count,
▌        REGULATION · US-CO · Demo Data      C:HIGH     ▐    quiet action link
▌ ‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥‥ ▐ ← hairline row rules
▌ 09:41  I▮▮▯▯ 63  Singapore IMDA releases GenAI…       ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟
```

- **Domain rule colors** (top rule + header glyph tint): Regulatory = signal red-orange,
  Standards = steel blue, Incidents/Security = red, Research = violet, Watchlist =
  amber, Events/Training = green, System/Sources = neutral. (Exact values in §9 —
  they are the existing semantic hues, recalibrated; no new vocabulary to learn.)
- **Header bar**: mono uppercase title (11px, +0.08em), right-aligned mono count,
  one quiet action. No icons unless they disambiguate (domain glyph only).
- **Body**: rows on hairline rules, zero side-padding wastage (12px), fixed-height
  rows where content allows. Footer only when a module needs a source/as-of citation.
- **Tiling**: on the dashboard, modules abut with shared 1px borders (mosaic), not
  16px floating gaps — the Bloomberg-pane feel; interior pages may breathe more.
- **Item row grid** (the workhorse, replaces badge-first stacked rows):
  `[mono time HH:MM] [impact meter+score] [headline (serif, primary)] … [source · geo tags] [confidence]`
  Headline is the largest element; all metadata is mono, muted, and column-aligned
  across rows so the eye can run down any column.

## 8. Typography

Three voices, strict roles:

| Voice | Face | Used for |
|---|---|---|
| **Judgment** | *Source Serif 4* (self-hosted, SIL OFL) | Page titles, item/incident/entity headlines, brief prose. The editorial signature. |
| **Chrome** | Inter (existing) | Navigation, buttons, form controls, body/secondary text |
| **Data** | JetBrains Mono (existing) | All numbers, timestamps, counts, scores, codes, uppercase micro-labels, status tokens — always `tabular-nums` |

Scale (tightened): 10px mono micro-labels (+0.08em) · 12px secondary/mono data ·
13px body · 15px serif row headlines · 18px serif module-level titles · 22px serif
page titles · 32–40px mono stat numerals. Line-height 1.3–1.4. Weight discipline:
serif 500–600 for headlines; Inter 400/500 only; mono 400/500.

Time format: `14:02` in-row (same day) / `AUG 09` (older) with full
`2026-08-11 14:02 UTC` on hover/title and in details. Header clock ticks in UTC.

*One new dependency (a font package, @fontsource/source-serif-4) — flagged per the
no-unnecessary-dependencies constraint; it is the single most identity-defining
addition in this direction and replaces zero functionality.*

## 9. Color system

### Surfaces (warm ink — replaces the blue-cast set)
| Token | Current | Proposed | Note |
|---|---|---|---|
| bg-base | `#0B0E14` | **`#121110`** | warm near-black ink |
| bg-surface | `#12161F` | **`#181614`** | panels |
| bg-raised | `#1A2029` | **`#21201D`** | hover / popover / table head |
| border-subtle | `#232B36` | **`#2A2825`** | hairlines |
| border-strong | `#33404F` | **`#3E3B36`** | emphasis rules |
| text-primary | `#E8EDF4` | **`#EDEAE4`** | warm paper-white |
| text-secondary | `#9AA7B8` | **`#A8A296`** | |
| text-muted | `#5E6B7E` | **`#6E695F`** | |

### Identity
| Token | Value | Use (narrow!) |
|---|---|---|
| **signal (amber)** | `#E0A83C` | active nav marker, focus ring, selection, primary action, live dot, brand |

### Semantics (recalibrated for warm ground; meanings unchanged — §16 of spec)
critical `#E4574D` · elevated `#D97F2E`* · watch `#D4B83A` · positive `#4CAE72` ·
info `#5B9BD8` (demoted from identity to pure semantics) · emerging `#9E86D8` ·
neutral `#6E695F`.
*Elevated orange sits far enough from identity amber via saturation/value and because
severity always renders as a bordered mono tag with text, never a bare swatch. All
pairs re-verified for AA on the new grounds before implementation.

### Status/metadata tokens (replaces tinted pills)
- **Impact**: 4-step meter + mono score — `▮▮▮▯ 85` — meter tinted by band
  (≥70 critical, ≥50 elevated, ≥30 watch, else neutral). Compact, comparable
  down a column, and quantitative instead of adjectival.
- **Confidence**: three-dot mono token `●●● HIGH / ●●○ MED / ●○○ LOW` in neutral ink
  (low = watch-yellow) — visibly a *different species* from impact, killing the
  current "two similar pills" confusion.
- **Severity / lifecycle status / fact status**: flat mono uppercase tags, 2px
  radius, 1px border in semantic color, ink background, colored text —
  `EFFECTIVE` `CRITICAL` `ALLEGED`. No dots, no tinted fills.
- **Tier**: `T1`…`T4` unchanged concept, restyled to match. **DEMO**: dashed-border
  neutral tag, unchanged concept.

## 10. Data visualization guidance

- **Map**: ocean = bg-base; land = surface tone; **graticule** at low opacity (the
  cartographic texture that says "intelligence product"); activity ramp
  neutral-ink → signal-amber (identity and data now cooperate; blue ramp retired);
  active jurisdictions get a small crosshair/point marker; hover tooltip in mono;
  legend as labeled mono stops; metric label stays explicit (§21 rule); the existing
  text-alternative line becomes a proper mono "wire" line under the map.
- **Charts (current + future)**: no chart chrome — hairline baseline only, direct
  labels over legends where possible, muted single-hue series with semantic color
  reserved for meaning; every chart carries an OWID-style source/as-of line.
- **Standards "at a glance" strip**: becomes a single mono distribution line
  (`FINAL 4 · UPDATED 3 · DRAFT 0 · COMMENT 0 · WITHDRAWN 0`) with count emphasis —
  five boxes → one scannable line.
- **Sparklines** (later, no new deps — inline SVG): 7-day activity per domain in
  module headers.

## 11. Navigation & layout guidance

- **Sidebar**: keep structure; restyle — mono uppercase labels, domain glyph tint on
  active, 3px amber left marker, tighter rows; brand lockup gets the serif treatment;
  collapsed mode unchanged.
- **Header → status strip** (highest-impact chrome change, uses existing APIs only):
  left: coverage context ("7-DAY WINDOW"); center: search (existing); right:
  `12:41:07 UTC` ticking clock · `SOURCES 9/11 OK` (links to Settings health) ·
  `LAST INGEST 14m` · live amber dot. The product now *wears* its system state.
- **Dashboard grid**: same modules, same placement; tiled/flush treatment per §7;
  KPI row becomes a **stat strip** — one full-width segmented band, each segment:
  mono 36px numeral, 10px label, small delta vs. previous window, 2px semantic left
  rule; whole segment clickable (unchanged behavior). Zero-states show `0` in muted
  ink with "quiet period" microcopy instead of looking broken.
- **Interior pages**: serif page title + mono context line (counts, as-of); filters
  restyled as compact mono controls in a single toolbar row; content in modules.

## 12. Motion & interactions

- Durations 100–140ms, ease-out, opacity/color/border only (no movement, no scale).
- **Row hover**: bg-raised + 2px left rule in the row's domain color (replaces
  whole-card border lightening) — reinforces the domain-color system.
- **Focus**: 2px amber ring (existing pattern, new color); focus and hover visibly
  distinct.
- **Live updates**: the header live-dot pulses *once* on refetch (single 400ms
  opacity pulse, not a loop); numbers change without animation.
- Loading: static skeleton blocks (no shimmer sweep); drawer slide stays (120ms).
- `prefers-reduced-motion` continues to disable all of it.

## 13. Responsive behavior

Same breakpoints and mobile IA (bottom nav, §56 priorities). Adjustments:
- The stat strip wraps 2×2 on mobile keeping the segmented look (not four boxes).
- Tiled modules stack full-width with their top rules — domain identity survives on
  mobile better than card chrome did.
- Status strip collapses to clock + live dot; row grid drops the meter column at
  <480px (score stays inline after the time).
- Serif headlines drop one step on mobile; mono columns keep alignment.

## 14. Route-by-route recommendations

| Route | Keep | Change |
|---|---|---|
| **Dashboard** | module set, placement, click-throughs | stat strip; tiled mosaic; module rules/headers; item-row grid; map restyle (§10); unify the three list-row treatments into one |
| **Regulatory Radar** | table structure, filters, timeline toggle | table head → mono 10px on raised band; row height 36px; status as flat mono tag; add mono absolute dates; serif regulation names; timeline gets mono date gutter + rule treatment |
| **Standards** | tabs, card grid, glance data | publisher becomes the card's dominant mark (mono, larger, domain-tinted top rule per publisher); glance strip → one mono line; `dl` rows → aligned label/value with stronger value weight |
| **Incidents** | list + report layout | severity tag leads the *metadata line*, serif headline leads the row; detail page: serif title, mono metadata panel with hairline rows, framework cross-links as mono chips |
| **Item drawer** | factor breakdown, cluster view, attribution | serif headline; factor list as mono ledger (dotted leader lines between factor and points); attribution as the standard module footer |
| **Morning Brief** | deterministic content, sections | the most editorial page: serif-led, newspaper rules between sections, drop remaining card chrome — it should read like a typeset brief (still a page, not the dashboard) |
| **Watchlist** | status derivation, rows | status column fixed-width mono tags; `last change` absolute+relative; row grid alignment |
| **Settings** | health-first layout | health rows → SOC-style fixed columns: `● OK` / `▲ ERR` mono tokens, last-run mono timestamps, aligned intervals; forms restyled to compact controls |
| **Search** | grouped results | group headers = module headers; rows use the standard item-row grid |
| **404 / empty / error states** | copy & actions | restyle to mono "wire message" blocks (`— NO SIGNAL —` register), consistent everywhere |

## 15. Recommended implementation order

Each step is independently shippable and verifiable in the browser; no step touches
functionality, schema, API, or ingestion.

1. **Foundations** — new surface/identity/semantic tokens in `tailwind.config.js` +
   Source Serif 4; global radius 2px; remove shadows/glow. (Whole app shifts at once.)
2. **Token components** — badges → mono tags, impact meter, confidence dots; unify
   heights. (Kills the strongest "generic" tell everywhere simultaneously.)
3. **Module system** — module header/rule/body primitives; apply to dashboard
   widgets; tiled dashboard grid; unified item-row grid.
4. **Stat strip + header status strip** (clock, freshness, source health — existing
   endpoints only).
5. **Map restyle** — ink ocean, graticule, amber ramp, crosshairs, mono legend.
6. **Tables & timelines** — Regulatory Radar, Watchlist, Settings health, entity
   timelines.
7. **Detail surfaces** — item drawer, incident report, entity page, Standards cards.
8. **Editorial pass** — Morning Brief typesetting; empty/error "wire" states; 404.
9. **Interaction polish** — hover rules, single-pulse live dot, focus audit.
10. **Responsive + a11y verification** — 1280/768/375 sweep, AA re-verification of
    every new pair, reduced-motion check; archive before/after screenshots in
    `docs/qa/`.

---

*Constraint check: no functionality, schema, API, or ingestion changes anywhere in
this plan. One new dependency proposed (self-hosted serif font package), explicitly
flagged. Existing DESIGN_SYSTEM.md decisions remain authoritative until this
direction is approved.*
