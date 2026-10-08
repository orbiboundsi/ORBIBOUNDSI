# STAC fetcher

Typed Sentinel-2 STAC metadata client with bounding-box validation, dynamic date windows, cloud-cover filtering, timeout handling, retry/backoff, and stable error codes. It accepts an injected `fetchImpl` only for tests; production callers use the platform `fetch` and `STAC_API_URL` configuration.
