# Design System

> **Note (2026-08-11):** A V2 visual direction — *"Ink & Signal"* (warm-ink surfaces,
> amber identity accent, domain-coded module system, serif/mono/sans three-voice
> typography, flat mono status tokens) — is **proposed** in
> [docs/design/V2-DESIGN-DIRECTION.md](docs/design/V2-DESIGN-DIRECTION.md) and awaits
> owner approval. Until approved, everything below remains the authoritative V1
> system. The V2 direction preserves the widget/module dashboard concept, the
> semantic color meanings, and all accessibility rules defined here.

Dark-first intelligence terminal. Quality bar: professional intelligence product
(Bloomberg-terminal / SOC-dashboard feel) — never an admin panel, RSS reader, or
marketing site (§15, §91). Implemented as Tailwind theme tokens + shadcn/ui components
restyled to these tokens.

## 1. Personality

Dense but readable · technical · modern · slightly futuristic · minimal decoration ·
strong hierarchy · crisp borders · rounded cards · small status indicators · compact
data viz · subtle gradients · restrained glow.

**Avoid:** heavy glassmorphism, hero sections, giant typography, excessive whitespace,
constant animation, cartoon illustration, generic SaaS template look.

## 2. Color tokens (dark theme is default and primary)

| Token | Value (dark) | Use |
|---|---|---|
| `bg-base` | `#0B0E14` | app background (near-black, slightly blue) |
| `bg-surface` | `#12161F` | cards, sidebar |
| `bg-raised` | `#1A2029` | hover, popovers, table header |
| `border-subtle` | `#232B36` | card/table borders |
| `border-strong` | `#33404F` | focus containers, dividers |
| `text-primary` | `#E8EDF4` | headings, values |
| `text-secondary` | `#9AA7B8` | labels, metadata |
| `text-muted` | `#5E6B7E` | timestamps, placeholders |
| `accent` | `#4D9FFF` | links, active nav, primary actions |

Semantic status colors (§16) — each has a dim background variant for badges
(~12% opacity on surface):

| Token | Value | Meaning |
|---|---|---|
| `sev-critical` | `#F0554D` | red — high impact / critical |
| `sev-high` | `#F2913D` | orange — medium-high attention |
| `sev-watch` | `#E5C445` | yellow — watch |
| `sev-positive` | `#3FBF77` | green — healthy / effective |
| `sev-info` | `#4D9FFF` | blue — informational |
| `sev-emerging` | `#A78BFA` | purple — emerging / research |

Rules: color is **never** the only signal — every state also has text and/or an icon
(§16, §55). All text/background pairs must meet WCAG AA (4.5:1 body, 3:1 large).
A light theme is a post-V1 nicety; do not block on it.

## 3. Typography

- UI/body: **Inter** (self-hosted woff2 — no CDN fetch; local-first).
- Data/mono (timestamps, IDs, tickers, scores): **JetBrains Mono**.
- Scale (dense): 11px meta-labels (uppercase, +0.06em tracking), 12px table/secondary,
  13px body, 14px card titles, 16px section headers, 20px page titles, 28px KPI values
  (mono, tabular-nums). Line-height tight (1.35–1.45).

## 4. Spacing, radius, elevation

- 4px spacing grid; dense paddings (cards 16px, table cells 8–12px).
- Radius: 10px cards, 6px buttons/inputs, 999px pills.
- Elevation via borders + subtle shadow (`0 1px 2px rgba(0,0,0,.4)`), not big blurs.
  One restrained glow allowed on critical KPI accents (`0 0 12px` at ~15% opacity).

## 5. Core components

| Component | Notes |
|---|---|
| **KpiCard** | uppercase 11px label, 28px mono value, delta chip, whole card clickable → filtered view |
| **SeverityBadge** | pill: dot + text (`CRITICAL`, `HIGH`, `WATCH`, `INFO`…), dim bg variant |
| **ConfidenceBadge** | `HIGH / MED / LOW` — always distinct from impact (§64) |
| **TierBadge** | source reliability `T1`–`T4` |
| **StatusPill** | lifecycle statuses (regulation/standard), semantic color + label |
| **IntelCard** | standard card: header row (title + badges), body, footer (source · relative time · link) |
| **DataTable** | dense, sticky header, sortable, row hover, keyboard navigable |
| **EntityTimeline** | vertical timeline of entity_events with type icons |
| **WatchButton** | star/radar toggle; watched state visible without color alone |
| **SourceAttribution** | source name, pub date, retrieval date, original-URL link — required on every item view (§32) |
| **EmptyState** | icon, one-line explanation, action button (§58) — never blank cards |
| **ErrorState** | what failed, last success timestamp, Retry + View source actions (§59) |
| **Skeleton** | shimmer placeholders matching final layout |
| **Sidebar** | fixed left, collapsible to icons, active accent bar |
| **MobileNav** | bottom bar: Brief, Home, Watchlist, Incidents, More |

## 6. Layout

- Desktop (≥1280px): fixed sidebar 240px (64px collapsed) + 12-col content grid,
  24px gutters. Dashboard: 4 KPI cards row → 2-col row (Top Developments ~40% /
  Heatmap ~60%) → 2-col row (Incidents / Standards Watch) (§17).
- Tablet (768–1279): sidebar collapsed to icons, content 2-col → 1-col.
- Mobile (<768): bottom nav + drawer; priority order per §56; no attempt to reproduce
  desktop density.

## 7. Motion (§57)

150–200ms ease-out transitions: card hover (border-color + slight lift), status
changes, drawer slide, skeleton shimmer, chart/map enter. Honor
`prefers-reduced-motion` (disable non-essential animation). Nothing loops forever.

## 8. Accessibility checklist (per feature, §55)

- [ ] Full keyboard operability, logical tab order, visible focus ring (2px accent)
- [ ] Semantic HTML first; ARIA only where semantics fall short
- [ ] Labels for icon-only controls; alt/aria on status indicators
- [ ] AA contrast verified for both text and status colors on their backgrounds
- [ ] No color-only state communication
- [ ] Responsive without horizontal body scroll; reduced-motion respected
