# Phase 7 — Alert System

The worker now evaluates `risk_score >= alert_threshold` after successful processing and calls the alert service without making alert delivery failure invalidate satellite processing.

## Delivery

- `WebhookSender`: HTTPS POST, 10-second timeout, exponential retry for 5xx/timeouts, no retry for 4xx.
- `SmtpSender`: SMTP transport with connection/greeting/socket timeouts and three attempts.
- `sendAlert`: threshold gate, `asset_id:scene_id:threshold` deduplication, and `alert_history` persistence.
- Delivery status and provider errors are persisted separately.

## Runtime configuration

The worker reads blank-by-default server environment variables:

- `ALERT_WEBHOOK_URL`
- `ALERT_EMAIL_RECIPIENTS` (comma-separated)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`

The existing `asset_alert_configs.webhook_url_ciphertext` remains encrypted at rest. Phase 7 does not treat ciphertext as plaintext; a future configuration-management pass should add the approved encryption/decryption key contract before asset-specific webhook URLs are enabled. The current worker integration is safe for server-side environment configuration and never returns alert secrets to the web client.

## Deduplication

The existing unique `alert_history_dedupe_key_uidx` prevents repeated alerts for the same asset, scene, and threshold. Alert history is RLS-protected through the asset ownership relationship.
