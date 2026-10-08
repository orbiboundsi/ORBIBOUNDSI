# Database package

Typed database contracts for the OrbiBound AI Supabase schema. The package exports generated table types and status unions without creating a client or exposing service credentials.

The Phase 2 schema contains `monitored_assets`, `processing_logs`, `asset_schedules`, `asset_alert_configs`, and `alert_history`, all protected by Row-Level Security. Browser clients must use the publishable Supabase key; worker service-role access remains server-only.

After a migration change, refresh `src/generated.ts` from the authorized Supabase project and run `pnpm --filter @orbibound-ai/database typecheck`.
