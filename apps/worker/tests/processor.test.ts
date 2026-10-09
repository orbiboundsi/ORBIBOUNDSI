import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processAsset } from '../src/processor.js';
import type { ClaimedAsset, WorkerDependencies } from '../src/types.js';

const asset: ClaimedAsset = { id: 'asset-1', user_id: 'user-1', asset_name: 'Test', geo_boundary: {}, refresh_frequency_days: 5, alert_threshold: 75 };
function deps(overrides: Partial<WorkerDependencies> = {}): WorkerDependencies { const logs: string[] = []; return { stacApiUrl: 'https://example.test/search', fetchMetadata: async () => ({ sceneId: 'scene-1', datetime: '', cloudCover: 1, redHref: 'red', nirHref: 'nir' }), readCog: async () => ({ bytesRead: 20, scene: { sceneId: 'scene-1', datetime: '', cloudCover: 1, meanReflectance: 2 } }), loadHistory: async () => [{ sceneId: 'h1', datetime: '', cloudCover: 1, meanReflectance: 1 }, { sceneId: 'h2', datetime: '', cloudCover: 1, meanReflectance: 1 }, { sceneId: 'h3', datetime: '', cloudCover: 1, meanReflectance: 1 }], updateAsset: async () => undefined, writeLog: async (entry) => { logs.push(entry.status); }, updateSchedule: async () => undefined, ...overrides }; }

test('processes an asset and records success', async () => { const result = await processAsset(asset, deps()); assert.equal(result.status, 'complete'); });
test('isolates processing failure and schedules retry', async () => { const result = await processAsset(asset, deps({ fetchMetadata: async () => { throw Object.assign(new Error('timeout'), { code: 'STAC_API_TIMEOUT' }); } })); assert.equal(result.status, 'failed'); assert.equal(result.errorCode, 'STAC_API_TIMEOUT'); });
