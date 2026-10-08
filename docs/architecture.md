# Architecture

OrbiBound AI is organized as a pnpm monorepo. The Next.js web application will serve authenticated users, the Node.js worker will process due assets on a schedule, and Supabase will provide PostgreSQL, PostGIS, Auth, and Row-Level Security.

The ingestion path is designed for Sentinel-2 metadata from a STAC API and streamed Cloud-Optimized GeoTIFF reads. The anomaly engine produces a bounded risk score and a human-readable explanation. Alert delivery is separated from scoring so delivery failures do not erase processing results.

Phase 1 only creates the repository foundation. Database objects, clients, ingestion code, scoring code, and UI are implemented only in their individually approved phases.
