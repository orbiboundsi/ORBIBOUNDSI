# OrbiBound AI — YC-MVP website plan

## Implementation approach

Reuse the existing Next.js 14 monorepo and preserve the authenticated asset workflow, API routes, Supabase/PostGIS contracts, worker, STAC fetcher, anomaly engine, COG reader, alert service, tests, and migrations. Add a public investor-facing home page at `/` and move the existing operations overview to `/app` so public visitors can understand the product before entering the secure workspace. Keep `/auth/*` and `/assets/new` intact, update middleware protection to cover `/app` and `/assets` without blocking the public home page, and update internal navigation links accordingly.

The public page will be server-rendered static React markup with inline SVG product diagrams and CSS-only signal motifs. No credentials, live customer data, fabricated logos, or unsupported traction claims will enter the browser bundle. The existing dashboard remains connected to its current authenticated APIs and Supabase client code. A Dockerfile will build the monorepo with pnpm and run the Next.js app in standalone production mode on the platform's `PORT`.

Project structure additions:

- `apps/web/app/page.tsx`: public investor-facing landing page.
- `apps/web/app/app/page.tsx`: retained authenticated operations overview.
- `apps/web/app/globals.css`: shared mission-control tokens plus public landing-page layout and responsive styles.
- `apps/web/public/manus-routes.json`: complete page-route manifest.
- `apps/web/public/brand-mark.svg`: durable brand mark used by metadata and public UI.
- `apps/web/middleware.ts`: public `/` with protected `/app` and `/assets` routes.
- `Dockerfile`: clean production build and standalone runtime.
- `app.config.ts`: durable logo URL metadata.

## Design direction

Three candidate styles sampled from the requested mission-control direction:

1. **Orbital Instrument Panel** — a restrained satellite-operations visual language with data rails, orbit lines, and evidence-first layouts. **Probability: 0.07**.
2. **Field Signal Editorial** — a quieter editorial page pairing satellite-grid diagrams with large typographic statements. **Probability: 0.05**.
3. **Industrial Horizon** — a harder supply-chain control-room aesthetic with amber risk accents and dense operational readouts. **Probability: 0.03**.

Chosen style: **Orbital Instrument Panel**.

- **Design movement:** mission-control precision adapted for an investor narrative: calm, technical, spatial, and evidence-led.
- **Core principles:** signal over spectacle; explain every risk; show the pipeline, not a black box; make the next action obvious.
- **Color philosophy:** deep navy and slate establish trust and focus; cyan marks satellite signal and system agency; amber and red appear only where risk needs attention; a muted green confirms healthy processing.
- **Layout paradigm:** asymmetrical editorial flow with a left narrative rail and right instrument panels, alternating full-bleed signal bands and anchored evidence cards instead of repeated centered cards.
- **Signature elements:** concentric orbital rings, faint coordinate/grid lines, and compact mono readouts that make the page feel like an operating instrument without becoming a dashboard replica.
- **Interaction philosophy:** links feel like routing controls, not marketing buttons; hover states reveal signal and focus states remain explicit; CTAs route to early access or the live workspace.
- **Animation:** subtle 150–220ms ease-out transitions, signal-line shimmer only on the hero diagram, no continuous decorative motion, and reduced-motion fallbacks.
- **Typography system:** IBM Plex Sans for narrative and UI; IBM Plex Mono for coordinates, timestamps, labels, and risk metrics. Large headlines use tight tracking and short line lengths.
- **Brand essence:** OrbiBound AI gives capital and operations teams an explainable early-warning layer for physical assets; precise, anticipatory, grounded.
- **Brand voice:** direct, calm, and specific. Example lines: “See the physical world before it moves.” and “Every alert arrives with the evidence behind it.”
- **Wordmark and logo:** an orbital ring enclosing a signal node, paired with the OrbiBound AI wordmark; the node is offset to imply a monitored asset crossing a threshold.
- **Signature brand color:** signal cyan `#43D9E6`, used as a precise accent rather than a wash.

## Serving and publishing

The app is published as a server container because the retained authenticated dashboard and API routes need Next.js runtime support. The public home page remains visitor-independent and safe for shared caching. `manus-routes.json` declares `/`, `/app`, `/assets/new`, and all authentication pages. Build verification runs the workspace typecheck, tests, and Next production build; the migration set is reviewed and verified locally as SQL because this sandbox has no Supabase CLI or live Supabase connector enabled. The completed code and unchanged migration set are then synchronized to `orbiboundsi/ORBIBOUNDSI` on `main`, followed by a managed Webdev checkpoint and explicit publication.
