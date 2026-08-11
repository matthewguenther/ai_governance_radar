# Design System — "Refined Intelligence Dashboard"

**Status: SHIPPED (2026-08-11).** This is the approved production design system,
chosen by the owner from three prototyped directions (see
[docs/design/V2-DESIGN-DIRECTION.md](docs/design/V2-DESIGN-DIRECTION.md) for the
exploration history; the "Ink & Signal" proposal there was superseded by this
direction). Quality bar: a premium commercial intelligence platform — alive,
scannable, credible — never a generic Tailwind/AI-SaaS dashboard.

## 1. Personality

Dense but readable · professional · modern · **alive** (real flags, org marks,
sparklines, glowing activity markers, one subtle brand animation) · strong hierarchy ·
semantic color plus identity color used deliberately.

**Avoid:** glassmorphism, hero sections, giant typography, decorative gradients beyond
the sanctioned tints, cartoon illustration, constant motion.

## 2. Color tokens

Defined in `frontend/tailwind.config.js`, mirrored for inline/SVG use in
`frontend/src/lib/tokens.ts` — **keep the two in sync**.

| Token | Value | Use |
|---|---|---|
| `bg-base` | `#090C12` | app background, plus a faint accent radial wash (body) |
| `bg-surface` | `#10151E` | flat surfaces; cards use the `bg-surface` **gradient** `#131A26 → #0F141D` |
| `bg-raised` | `#1A2230` | hover, popovers, table header |
| `bd-subtle` | `#1E2836` | card/table borders |
| `bd-strong` | `#2C3A4E` | emphasis borders, micro-pill outlines |
| `tx-primary` | `#E8EDF5` | headings, values |
| `tx-secondary` | `#8FA0B5` | labels, metadata |
| `tx-muted` | `#5C6B80` | timestamps, placeholders |
| `accent` | `#628BFF` | links, active nav, focus ring, radar structure |

Semantic status colors (§16) — meanings unchanged:

| Token | Value | Meaning |
|---|---|---|
| `sev-critical` | `#F2564D` | high impact / critical severity |
| `sev-high` | `#F2913D` | elevated attention |
| `sev-watch` | `#E5C445` | watch |
| `sev-positive` | `#3FBF77` | healthy / effective / in force · **also the radar sweep + LIVE indicators** |
| `sev-info` | `#5B9BD8` | informational |
| `sev-emerging` | `#A78BFA` | emerging / research / proposed |

Rules: color is **never** the only signal — every state carries text and/or a labeled
glyph. AA contrast for text pairs. Sanctioned decorative color: KPI card tints
(`{tone}1C → {tone}08` gradient), glow shadows on live dots/map markers only.

## 3. Brand mark

`RadarLogo` (components/ui/RadarLogo.tsx): blue radar structure (rings, crosshairs,
center) with a rotating **bright green** sweep beam (`#4FE58F` — deliberately
brighter than `sev-positive` so it reads at small sizes) and matching contact blips
with a soft glow. 5s rotation; the app's only looping animation; disabled under
`prefers-reduced-motion`.

Sidebar lockup: the mark is **centered** at the top of the sidebar (56px expanded,
34px collapsed) above a centered "AI Governance / RADAR" wordmark, separated from
navigation by a hairline rule.

## 4. Typography

- UI/body: **Inter** (400/500/600, self-hosted). Data/timestamps/scores/labels:
  **JetBrains Mono**, always `tabular-nums`.
- Scale: 11px mono meta-labels (uppercase, tracked) · 12px secondary · 13px body ·
  14px row titles · 16px section headers · 20px page titles · 30px KPI numerals (mono).

## 5. Iconography (the "alive" layer)

| Component | What it shows |
|---|---|
| `FlagChip` | Real SVG flags in circular chips: countries/EU/UN via `flag-icons`, US states via `us-state-flags` (NYC → NY flag). Intergov bodies (OECD, G7…) fall back to a neutral globe. Assets bundle locally — never fetched at runtime. **Flag content is absolutely centered and scaled to cover the circle** — neither package's own wrapper centers correctly inside a fixed frame (see the component's comment); verify offsets stay 0 if the packages are upgraded. |
| `OrgAvatar` | Monogram tiles with recognizable colors: NIST blue, ISO red, OWASP slate, MITRE violet, arXiv crimson, GOV.UK blue, etc. Regex-matched from names; hashed neutral fallback. |
| `IncidentIcon` | Category glyph (terminal = prompt injection, bot = agency, scale = bias, face-scan = deepfake…) in a severity-tinted tile. |
| `ItemAvatar` | Row logic: known org entity → OrgAvatar · else jurisdiction → FlagChip · else source monogram. |

## 6. Status & data indicators

| Component | Treatment |
|---|---|
| `Pill` (Severity/Status/FactStatus/Confidence badges) | **Filled**: `{tone}/15` bg, `{tone}/40` border, colored 10.5px semibold text, 8px radius |
| `MicroPill` (categories, jurisdiction codes, Tier, DEMO) | quiet outline, mono 10px uppercase; DEMO is dashed |
| `ImpactRing` | 28px ring gauge, arc = score/100, band-colored, score text inside, aria-labeled — row-level impact |
| `ImpactBadge` | text pill ("High impact 85") — detail/drawer contexts |
| `ConfDots` | 3-dot confidence (rows); `ConfidenceBadge` text pill in details |
| `Sparkline` / `Donut` | inline SVG micro-charts (KPIs, standards mix) — no chart library |
| LIVE indicator | green dot with glow + mono label, on feeds |

Regulation lifecycle pill tones: proposed=emerging · introduced=info · passed=watch ·
signed/amended=high · **effective/enforcement=positive** (in force = green).
Standards: final=positive · updated/amended=high · draft/comment=watch ·
withdrawn=critical · announced=emerging.

## 7. Cards & layout

- **Card**: 12px radius, gradient surface, subtle border, single elevation shadow
  (`0 10px 30px rgba(0,0,0,.35)` + top inner highlight).
- **Module header**: 3px color tick + 13px semibold title + right action; ticks code
  the domain (critical=top developments, accent=map, high=incidents, info=standards,
  emerging=regulatory, positive=feed).
- **KPI card**: tone-tinted gradient + tone border, 30px mono numeral (muted when 0),
  icon + sparkline right, whole card links to its filtered view; slight hover lift.
- Dashboard grid: KPI row (4) → Top Developments (5/12) + Heat Map (7/12) →
  Incidents / Standards / Regulatory Pulse (3-up) → full-width live feed strip.
- Sidebar: RadarLogo lockup; active item = accent-tinted fill + accent border.
  Header: date (mono, ≥lg) + global search.

## 8. Map

Dark land (`#161D2A`) on transparent ocean, subtle blue fill steps under **glowing
activity markers** sized by value and colored High(red)/Medium(orange)/Emerging(violet)
with a labeled legend. Metric always named explicitly; color = activity volume, never
"good/bad" (§21). Tooltip, click/keyboard navigation, and the text alternative line
are required features.

## 9. Motion

150ms ease-out color/border transitions; KPI 1px hover lift; radar sweep (5s) and
LIVE dot glow are the only ambient motion. Everything honors `prefers-reduced-motion`.

## 10. Accessibility checklist (per feature, unchanged from V1)

- [ ] Full keyboard operability, logical tab order, visible focus ring (2px accent)
- [ ] Semantic HTML first; ARIA only where semantics fall short
- [ ] Labels for icon-only controls; aria on rings/dots/status glyphs
- [ ] AA contrast for text; status colors always paired with text
- [ ] No color-only state communication
- [ ] Responsive without horizontal body scroll; reduced-motion respected
