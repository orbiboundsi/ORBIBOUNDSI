import { StacFetcherError } from './errors.js';
import type { FetchOptions, FetchResult, SatelliteScene, StacFetcherConfig } from './types.js';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_LIMIT = 5;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function isNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function validateOptions(options: FetchOptions): void {
  const { minLng, minLat, maxLng, maxLat } = options.bbox;
  if (![minLng, minLat, maxLng, maxLat].every(isNumber) || minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90 || minLng >= maxLng || minLat >= maxLat) throw new StacFetcherError('STAC_INVALID_RESPONSE', 'Invalid bounding box');
}
function parseScenes(payload: unknown): SatelliteScene[] {
  if (!isRecord(payload) || !Array.isArray(payload.features)) throw new StacFetcherError('STAC_INVALID_RESPONSE', 'STAC response does not contain features');
  const scenes: SatelliteScene[] = [];
  for (const feature of payload.features) {
    if (!isRecord(feature) || typeof feature.id !== 'string' || !isRecord(feature.properties) || typeof feature.properties.datetime !== 'string' || !isNumber(feature.properties['eo:cloud_cover']) || !isRecord(feature.assets)) throw new StacFetcherError('STAC_INVALID_RESPONSE', 'STAC feature has an invalid shape');
    const assets: Record<string, { href: string }> = {};
    for (const [key, value] of Object.entries(feature.assets)) if (isRecord(value) && typeof value.href === 'string') assets[key] = { href: value.href };
    scenes.push({ id: feature.id, datetime: feature.properties.datetime, cloudCover: feature.properties['eo:cloud_cover'], assets });
  }
  return scenes;
}

export async function fetchSatelliteMetadata(options: FetchOptions, config: StacFetcherConfig): Promise<FetchResult | null> {
  validateOptions(options);
  const now = options.now ?? new Date();
  const daysBack = options.daysBack ?? 30;
  if (!Number.isInteger(daysBack) || daysBack < 1 || daysBack > 365) throw new StacFetcherError('STAC_INVALID_RESPONSE', 'daysBack must be between 1 and 365');
  const maxCloudCover = options.maxCloudCover ?? 100;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const start = new Date(now.getTime() - daysBack * 86_400_000).toISOString();
  const end = now.toISOString();
  const body = { collections: ['sentinel-2-l2a'], bbox: [options.bbox.minLng, options.bbox.minLat, options.bbox.maxLng, options.bbox.maxLat], datetime: `${start}/${end}`, limit, query: { 'eo:cloud_cover': { lte: maxCloudCover } } };
  const fetchImpl = config.fetchImpl ?? fetch;
  const retries = config.maxRetries ?? DEFAULT_RETRIES;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: StacFetcherError | undefined;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(config.apiUrl, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/geo+json, application/json' }, body: JSON.stringify(body), signal: controller.signal });
      if (response.status === 429) throw new StacFetcherError('STAC_RATE_LIMITED', 'STAC API rate limit exceeded', response.status);
      if (response.status >= 500) throw new StacFetcherError('STAC_API_ERROR', 'STAC API server error', response.status);
      if (!response.ok) throw new StacFetcherError('STAC_API_ERROR', 'STAC API request failed', response.status);
      const scenes = parseScenes(await response.json());
      scenes.sort((a, b) => a.cloudCover - b.cloudCover);
      return { scenes: scenes.slice(0, limit), searchedAt: now.toISOString() };
    } catch (error: unknown) {
      if (error instanceof StacFetcherError) lastError = error;
      else if (error instanceof DOMException && error.name === 'AbortError') lastError = new StacFetcherError('STAC_API_TIMEOUT', `STAC API timeout after ${timeoutMs}ms`);
      else if (error instanceof Error && error.name === 'AbortError') lastError = new StacFetcherError('STAC_API_TIMEOUT', `STAC API timeout after ${timeoutMs}ms`);
      else lastError = new StacFetcherError('STAC_API_ERROR', 'STAC API request failed');
      if (attempt === retries || lastError.code === 'STAC_INVALID_RESPONSE') throw lastError;
      await (config.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))))(250 * 2 ** attempt);
    } finally { clearTimeout(timer); }
  }
  throw lastError ?? new StacFetcherError('STAC_API_ERROR', 'STAC API request failed');
}
