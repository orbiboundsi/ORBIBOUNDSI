# Web app

Next.js 14 App Router API adapter for OrbiBound. Phase 4 provides authenticated asset route handlers backed by Supabase RLS. The browser never receives the service-role key.

Required runtime variables are documented in the repository `.env.example`.

Implemented endpoints: `GET/POST /api/assets` and `GET/PATCH/DELETE /api/assets/:assetId`. Requests require an authenticated Supabase session, use user-scoped queries, and create an initial schedule row for new assets. No service-role key is required by the route handlers.
