# Core backend API contract

Asset endpoints are planned for the web adapter: `GET /api/assets`, `POST /api/assets`, `GET/PATCH/DELETE /api/assets/:assetId`. Route handlers must authenticate the Supabase session, pass the authenticated user ID to `AssetService`, and return typed JSON errors with `code`, `message`, and `requestId`.

The backend service validates asset name, GeoJSON Polygon closure and coordinate bounds, refresh frequency, and alert threshold before delegating to a repository. Production repository adapters must use the authorized Supabase client and rely on RLS; tests may inject a minimal contract fixture only.

Phase 3 implements the service and validation contracts. Next.js route handlers remain an adapter concern for the Web phase because the Phase 1 web app is intentionally only a placeholder; no duplicate API implementation or hardcoded response data was added.
