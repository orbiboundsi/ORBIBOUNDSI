# COG Reader

Remote Cloud Optimized GeoTIFF reader for the worker pipeline. It uses `geotiff` remote sources so tile/IFD reads are fulfilled through HTTP range requests rather than downloading the complete object. `readCogWindow` reads Red and NIR windows for an AOI, filters non-finite pixels, and returns means plus byte metrics.

The reader is worker-only; COG URLs are never exposed through the browser API.
