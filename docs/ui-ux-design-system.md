# OrbiBound AI — Phase 8A UI/UX Design System

## Status

**Phase 8A specification — awaiting design-direction confirmation before frontend implementation.**

## Design Read

```yaml
artifact: B2B satellite-intelligence operations dashboard
primary-audience: hedge-fund analysts, supply-chain operators, operations teams
visual-language: mission-control precision with quiet geospatial intelligence
mode: greenfield extension of existing Next.js API surface
visual-variance: 4/10
motion-intensity: 3/10
information-density: 8/10
asset-dependence: 7/10
brand-fidelity: 6/10
```

## Product positioning

OrbiBound AI should feel like an **analyst's instrument**, not a marketing site: high signal, calm under pressure, spatially aware, and explainable. The interface prioritizes the map and current risk state, then progressively reveals scene history, processing evidence, and alert delivery details.

## Positioning questions

| Question | Decision |
|---|---|
| Narrative role | Operational workspace: orient → inspect → act |
| Viewing distance | Laptop-first at 1m, usable on 375px mobile for triage |
| Visual temperature | Authoritative, calm, precise; urgency appears only in risk states |
| Capacity check | Dense dashboard with progressive disclosure; no card soup or oversized hero area |

## Design decisions

- **Anchor / recipe:** Custom mission-control system informed by UI UX Pro Max dashboard, accessibility, and resilient-text guidance.
- **Color palette:** Deep ink/navy canvas, elevated slate surfaces, cyan satellite accent, amber/red risk states, restrained green success.
- **Typography:** `IBM Plex Sans` for UI and data; `IBM Plex Mono` for IDs, timestamps, coordinates, and processing metrics. Use system fallbacks if remote font loading is unavailable.
- **Spacing:** 4px base unit; primary layout rhythm uses 8px multiples.
- **Border radius:** 8px controls and panels; 12px primary surfaces; 4px compact data badges; no pill-shaped everything.
- **Shadow hierarchy:** Mostly border-defined surfaces; low-elevation shadow only for floating map controls and dialogs.
- **Motion:** 150ms interaction transitions, 220ms panel transitions, ease-out; no continuous decorative animation; honor `prefers-reduced-motion`.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--ob-canvas` | `#07111F` | App background |
| `--ob-surface` | `#0D1B2A` | Panels and navigation |
| `--ob-surface-raised` | `#13263A` | Hovered/raised panels |
| `--ob-border` | `#26445C` | Dividers and controls |
| `--ob-text` | `#E6F0F7` | Primary text |
| `--ob-text-muted` | `#8EA6B8` | Secondary text |
| `--ob-cyan` | `#43D9E6` | Primary action, map selection, links |
| `--ob-blue` | `#5AA7FF` | Informational state |
| `--ob-green` | `#52D49A` | Healthy/complete state |
| `--ob-amber` | `#F2B84B` | Watch/medium risk |
| `--ob-red` | `#F26B6B` | High risk/failure |

Risk must never be communicated by color alone. Every risk state includes a label, numeric score, and icon/shape distinction.

## Type scale

| Role | Size / line height | Weight |
|---|---:|---:|
| Page title | 24 / 32px | 600 |
| Section title | 16 / 24px | 600 |
| Body | 14 / 20px | 400 |
| Compact label | 12 / 16px | 500 |
| Metric | 28 / 32px | 600 |
| Mono data | 12 / 16px | 400 |

## Application shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Top bar: product mark · workspace · system status · profile   │
├──────────────┬───────────────────────────────────────────────┤
│ Side nav     │ Page header: title · filters · primary action  │
│              ├───────────────────────────────────────────────┤
│ Overview     │ Main workspace                                │
│ Assets       │                                               │
│ Alerts       │                                               │
│ Processing   │                                               │
│ Settings     │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

- Desktop: 240px collapsible navigation.
- Tablet: 72px icon rail with tooltips.
- Mobile: top bar plus bottom navigation for Overview, Assets, Alerts, Settings.
- The active navigation item uses cyan rail/accent and text, not a full bright fill.

## Core screens

### Overview dashboard

- Header: `Operations overview`, date range, refresh status.
- KPI strip: monitored assets, high-risk assets, last successful run, alert delivery health.
- Primary module: risk map with selected asset outline and legend.
- Secondary module: ranked risk queue with score, trend, last scene, and status.
- Tertiary module: recent alerts and processing exceptions.

### Asset list

- Dense table on desktop; stacked rows on mobile.
- Columns: asset name, risk score, trend, cloud cover, processing status, last processed, next run.
- Filters: status, risk band, search, sort.
- Empty state explains how to create the first AOI; no fake assets.

### Create asset / AOI workspace

- MapLibre map occupies the main canvas.
- Side panel contains name, draw instructions, threshold, refresh frequency, and validation messages.
- Polygon must show editable vertices and a clear close/complete affordance.
- Save is disabled until geometry and required fields validate.

### Asset detail

- Header: asset name, risk badge, processing status, actions.
- Summary: current score, threshold, change versus baseline, last scene.
- Main chart: risk score timeline with threshold line.
- Evidence panel: explanation, baseline/current values, z-score, cloud cover.
- Processing timeline: scene fetch, COG read, scoring, alert delivery.

### Alerts and processing

- Alerts table includes severity label, delivery channels, delivery result, timestamp, and explanation.
- Processing table includes status, bytes read, processing time, error code, and retry state.
- Error messages remain human-readable but retain machine error codes in expandable detail.

## Component inventory

- `AppShell`
- `TopBar`
- `SideNav`
- `PageHeader`
- `RiskBadge`
- `RiskScoreCard`
- `StatusBadge`
- `MetricCard`
- `AssetTable`
- `AssetRow`
- `RiskTrendChart`
- `MapWorkspace`
- `MapLegend`
- `AoiEditorPanel`
- `AlertHistoryTable`
- `ProcessingTimeline`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`

## Interaction and accessibility contract

- All controls use native button/link semantics.
- Visible `:focus-visible` state uses cyan outline with sufficient contrast.
- Every map action has a keyboard-accessible alternative or instruction.
- Loading, success, and failure updates use an accessible live region where appropriate.
- Tables provide headings and mobile row labels.
- Charts include a text summary and data table fallback.
- Risk status combines text, score, icon, and color.
- Touch targets are at least 44×44px.
- Long IDs wrap or expose a copy action with accessible label.
- Motion is disabled or reduced under `prefers-reduced-motion`.

## Data and API integration rules

- No hardcoded mock assets in production components.
- Asset list reads from `GET /api/assets`.
- Asset creation uses `POST /api/assets` with validated GeoJSON.
- Asset detail reads from `GET /api/assets/[assetId]`.
- Asset updates use `PATCH /api/assets/[assetId]`.
- Delete uses `DELETE /api/assets/[assetId]` and requires an explicit confirmation dialog.
- Authenticated server access remains server-side; service-role credentials never enter client bundles.
- Loading, empty, unauthorized, validation, network, and server-error states are first-class UI states.

## Responsive breakpoints

| Viewport | Layout behavior |
|---|---|
| 375–639px | Single column, bottom nav, map above collapsible detail panel |
| 640–1023px | Two-column asset/detail where space permits, compact nav |
| 1024–1439px | Full sidebar, map plus detail rail |
| 1440px+ | Full shell, wider map canvas, persistent evidence rail |

## Phase 8B implementation boundary

The first frontend implementation slice should include:

1. Tailwind tokens and global CSS variables.
2. `AppShell`, `TopBar`, `SideNav`, and responsive navigation.
3. Authenticated asset list connected to `GET /api/assets`.
4. Loading, empty, error, and unauthorized states.
5. No MapLibre drawing or charts until the shell and data states are accepted.
