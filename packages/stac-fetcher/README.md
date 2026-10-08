# STAC fetcher

Typed Sentinel-2 STAC metadata client with bounding-box validation, dynamic date windows, cloud-cover filtering, timeout handling, retry/backoff, and stable error codes. It accepts an injected `fetchImpl` only for tests; production callers use the platform `fetch` and `STAC_API_URL` configuration.

Asset metadata preserves STAC `roles` and `eo:bands`. `findBandAsset(scene, 'red' | 'nir')` resolves bands by `common_name`, band name (`B04`/`B08`), or asset key and throws `STAC_BAND_NOT_FOUND` when a required band is unavailable. The collection is configurable through `StacFetcherConfig.collection` and should be sourced from `STAC_COLLECTION`.
