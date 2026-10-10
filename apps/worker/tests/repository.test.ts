import assert from 'node:assert/strict';
import { test } from 'node:test';
import { claimDueAssets } from '../src/repository.js';

test('passes configured stale-lock duration to the claim RPC', async () => {
  let received: Record<string, unknown> | undefined;
  const client = {
    rpc: async (_name: string, args: Record<string, unknown>) => { received = args; return { data: [{ id: 'asset-1' }], error: null }; },
  } as unknown as Parameters<typeof claimDueAssets>[0];
  const assets = await claimDueAssets(client, 'worker-a', 25, 45);
  assert.deepEqual(received, { p_worker_id: 'worker-a', p_limit: 25, p_stale_after: '45 minutes' });
  assert.deepEqual(assets, [{ id: 'asset-1' }]);
});
