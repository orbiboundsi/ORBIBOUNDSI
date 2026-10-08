# Backend services

Typed asset service and validation boundary for future API route handlers. The service depends on an injected repository, so production adapters can use Supabase while tests use a small in-memory contract fixture. No hardcoded production/mock data path exists.

`DefaultStacService` delegates to the configured STAC fetcher, and `DefaultAnomalyService` delegates to the deterministic scorer. Both are dependency-injectable and contain no fixture data.
