# OrbiBound Visual Language

**Status:** Approved reusable visual default for OrbiBound and future product interfaces we build together.

## Intent

A cinematic orbital visual language: quiet, precise, and image-led. The interface should feel like an instrument for examining places, not a generic SaaS card dashboard. Product UI remains readable and functional; full-screen photography is a contextual visual layer, never evidence of live product data.

## Core tokens

| Token | Value | Use |
|---|---|---|
| Space black | `#000000` | Page canvas and unoccupied space |
| Spectral white | `#f0f0fa` | Primary text, controls, and key outlines |
| Muted white | `rgba(240, 240, 250, 0.70)` | Secondary information |
| Ghost surface | `rgba(240, 240, 250, 0.10)` | Minimal interactive surfaces |
| Ghost border | `rgba(240, 240, 250, 0.35)` | Buttons and compact controls |
| Hairline | `rgba(240, 240, 250, 0.18)` | Necessary table, form, and section separation |
| Image overlay | `rgba(0, 0, 0, 0.50)` | Darken photography for text contrast |

No decorative accent palette, gradients on controls, or shadows. A dark gradient is permitted only over photography for legibility. Functional data states should use explicit words and values rather than relying on color.

## Typography

- **Display:** `D-DIN`, `DIN Alternate`, then `Arial, Verdana, sans-serif` fallbacks; bold, uppercase, tightly led, and positively tracked.
- **Navigation and UI labels:** uppercase, approximately 9–13px, with 0.9–1.2px tracking.
- **Body copy:** 14–16px, comfortable 1.5–1.7 line height; uppercase where it remains easy to read.
- **Data, record names, IDs, coordinates, GeoJSON, and user-entered values:** preserve their actual case and spacing. Never visually uppercase case-sensitive code or editable values.
- Use only regular and bold weights. Do not depend on a remote font download for basic rendering.

## Imagery and layout

- Favor one edge-to-edge, high-quality orbital or Earth-observation photograph in a full-bleed hero/scene; use `cover` and responsive focal positioning.
- Put text directly over the image with a dark overlay—no text panels, image frames, rounded cards, or drop shadows.
- Label contextual imagery with its source and make clear when it is illustrative rather than live OrbiBound imagery.
- Use full-viewport scenes where they serve the product. Dense operational tables and forms may flow naturally below the hero; do not force every data module into a fixed-height screen.
- Base spacing on 8px increments, with restrained responsive padding and open edges.

## Controls and product surfaces

- The primary button is a **ghost button**: translucent white surface, spectral-white text, a 1px ghost border, and a 32px radius. Keep hover changes subtle.
- Links remain visually quiet and gain a clear hover and focus state.
- Forms, maps, tables, and alerts are allowed when needed for real product work. Keep them black, unboxed where possible, and separated with hairlines. Use a small sharp radius only for map/control boundaries; avoid card styling.
- Loading, empty, error, and incomplete-feature states must be explicit and accessible. Never imply that a future capability is live.

## Accessibility and responsive behavior

- Keep semantic headings, links, buttons, form labels, table headers, and screen-reader text.
- Use a clearly visible spectral-white `:focus-visible` outline and at least 44px touch targets.
- Do not communicate risk or processing state by color alone; include text and, where applicable, a numeric value.
- Collapse horizontal navigation to a labeled mobile menu; preserve full-width imagery and reflow data without clipping controls.
- Honor `prefers-reduced-motion` and maintain readable contrast over every image crop.

## Product-truth rule

The visual system must not make a prototype look more operational than it is. Show a live/healthy/connected label only when it is backed by current system telemetry. Label unavailable modules as **not active** or **in development**; do not invent records, scores, scenes, delivery success, or operational guarantees.
