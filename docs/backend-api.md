# Core backend API contract

Asset endpoints are planned for the web adapter: `GET /api/assets`, `POST /api/assets`, `GET/PATCH/DELETE /api/assets/:assetId`. Route handlers must authenticate the Supabase session, pass the authenticated user ID to `AssetService`, and return typed JSON errors with `code`, `message`, and `requestId`.

The backend service validates asset name, GeoJSON Polygon closure and coordinate bounds, refresh frequency, and alert threshold before delegating to a repository. Production repository adapters must use the authorized Supabase client and rely on RLS; tests may inject a minimal contract fixture only.

Phase 4 implements these Next.js route handlers in `apps/web/app/api/assets`. They use the authenticated Supabase session, the typed `AssetService`, a Supabase repository adapter, PostGIS WKT conversion, request IDs, and standard JSON error responses. No service-role key is used in route handlers and no hardcoded response data is included.
