import type { WorkerConfig } from './types.js';

function positiveInteger(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`WORKER_CONFIG_INVALID: ${name} must be a positive integer`);
  return parsed;
}

export function loadWorkerConfig(environment: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const workerId = environment.WORKER_ID?.trim() || `worker-${process.pid}`;
  const stacApiUrl = environment.STAC_API_URL?.trim() || 'https://earth-search.aws.element84.com/v1/search';
  const stacCollection = environment.STAC_COLLECTION?.trim() || 'sentinel-2-l2a';
  return {
    workerId,
    stacApiUrl,
    stacCollection,
    maxAssets: positiveInteger('WORKER_MAX_ASSETS', environment.WORKER_MAX_ASSETS, 50),
    staleAfterMinutes: positiveInteger('WORKER_STALE_AFTER_MINUTES', environment.WORKER_STALE_AFTER_MINUTES, 30),
  };
}
