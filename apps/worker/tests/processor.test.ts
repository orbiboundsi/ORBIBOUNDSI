import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processAsset } from '../src/processor.js';
import type { ClaimedAsset, WorkerDependencies } from '../src/types.js';

const asset: ClaimedAsset = { id: 'asset-1', user_id: 'user-1', asset_name: 'Test', geo_boundary: {}, refresh_frequency_days: 5, alert_threshold: 75 };
const current = { sceneId: 'scene-1', datetime: '2026-10-09T00:00:00Z', cloudCover: 1, meanReflectance: 2 };

function deps(initialHistory = [
  { sceneId: 'h1', datetime: '2026-10-01T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
  { sceneId: 'h2', datetime: '2026-10-02T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
  { sceneId: 'h3', datetime: '2026-10-03T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
], overrides: Partial<WorkerDependencies> = {}): WorkerDependencies {
  const history = [...initialHistory];
  return {
    stacApiUrl: 'https://example.test/search',
    fetchMetadata: async () => ({ sceneId: current.sceneId, datetime: current.datetime, cloudCover: current.cloudCover, redHref: 'red', nirHref: 'nir' }),
    readCog: async () => ({ bytesRead: 20, scene: current }),
    loadHistory: async () => [...history],
    recordObservation: async (_assetId, scene) => {
      if (history.some((item) => item.sceneId === scene.sceneId)) return false;
      history.push(scene);
      return true;
    },
    updateAsset: async () => undefined,
    writeLog: async () => undefined,
    updateSchedule: async () => undefined,
    ...overrides,
  };
}

test('processes an asset after three historical observations and records success', async () => {
  const result = await processAsset(asset, deps());
  assert.equal(result.status, 'complete');
  assert.equal(result.result?.riskScore, 95);
});

test('keeps a fresh asset in warm-up and does not score it', async () => {
  const result = await processAsset(asset, deps([
    { sceneId: 'h1', datetime: '2026-10-01T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
    { sceneId: 'h2', datetime: '2026-10-02T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
  ]));
  assert.equal(result.status, 'ready');
  assert.equal(result.errorCode, 'BASELINE_WARMUP');
  assert.equal(result.result, undefined);
});

test('does not count a duplicate scene twice', async () => {
  const result = await processAsset(asset, deps([
    { sceneId: 'h1', datetime: '2026-10-01T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
    { sceneId: 'h2', datetime: '2026-10-02T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
    { sceneId: 'h3', datetime: '2026-10-03T00:00:00Z', cloudCover: 1, meanReflectance: 1 },
    current,
  ]));
  assert.equal(result.status, 'ready');
  assert.equal(result.errorCode, 'OBSERVATION_DUPLICATE');
});

test('isolates processing failure and schedules retry', async () => {
  const result = await processAsset(asset, deps(undefined, { fetchMetadata: async () => { throw Object.assign(new Error('timeout'), { code: 'STAC_API_TIMEOUT' }); } }));
  assert.equal(result.status, 'failed');
  assert.equal(result.errorCode, 'STAC_API_TIMEOUT');
});
