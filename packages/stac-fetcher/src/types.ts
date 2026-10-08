export interface BoundingBox { minLng: number; minLat: number; maxLng: number; maxLat: number }
export interface FetchOptions { bbox: BoundingBox; daysBack?: number; maxCloudCover?: number; limit?: number; now?: Date }
export interface SatelliteAsset { href: string }
export interface SatelliteScene { id: string; datetime: string; cloudCover: number; assets: Record<string, SatelliteAsset> }
export interface FetchResult { scenes: SatelliteScene[]; searchedAt: string }
export interface StacFetcherConfig { apiUrl: string; timeoutMs?: number; maxRetries?: number; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> }
