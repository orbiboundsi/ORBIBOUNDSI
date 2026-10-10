import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWorkerConfig } from '../src/config.js';
import { createRunSummary } from '../src/runner.js';

test('loads bounded run-once worker configuration', () => {
  const config = loadWorkerConfig({ WORKER_ID: 'worker-a', STAC_API_URL: 'https://stac.test/search', STAC_COLLECTION: 'demo', WORKER_MAX_ASSETS: '25', WORKER_STALE_AFTER_MINUTES: '45' });
  assert.deepEqual(config, { workerId: 'worker-a', stacApiUrl: 'https://stac.test/search', stacCollection: 'demo', maxAssets: 25, staleAfterMinutes: 45 });
});

test('rejects invalid worker limits', () => {
  assert.throws(() => loadWorkerConfig({ WORKER_MAX_ASSETS: '0' }), /WORKER_CONFIG_INVALID/);
  assert.throws(() => loadWorkerConfig({ WORKER_STALE_AFTER_MINUTES: 'nope' }), /WORKER_CONFIG_INVALID/);
});

test('summarizes completed, skipped, and failed assets', () => {
  const summary = createRunSummary('worker-a', new Date('2026-10-10T00:00:00Z'), new Date('2026-10-10T00:00:02Z'), 3, [
    { assetId: 'a', status: 'complete' },
    { assetId: 'b', status: 'warming_up', errorCode: 'BASELINE_WARMUP' },
    { assetId: 'c', status: 'failed', errorCode: 'STAC_API_TIMEOUT' },
  ], 'run-1');
  assert.deepEqual(summary, { runId: 'run-1', workerId: 'worker-a', startedAt: '2026-10-10T00:00:00.000Z', finishedAt: '2026-10-10T00:00:02.000Z', durationMs: 2000, claimedCount: 3, completedCount: 2, failedCount: 1, skippedCount: 1 });
});
