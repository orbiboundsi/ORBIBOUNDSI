import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@orbibound-ai/database';

interface TestUser { email: string; password: string }
type Client = SupabaseClient<Database>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const userA: TestUser | undefined = process.env.SUPABASE_TEST_USER_A_EMAIL !== undefined && process.env.SUPABASE_TEST_USER_A_PASSWORD !== undefined ? { email: process.env.SUPABASE_TEST_USER_A_EMAIL, password: process.env.SUPABASE_TEST_USER_A_PASSWORD } : undefined;
const userB: TestUser | undefined = process.env.SUPABASE_TEST_USER_B_EMAIL !== undefined && process.env.SUPABASE_TEST_USER_B_PASSWORD !== undefined ? { email: process.env.SUPABASE_TEST_USER_B_EMAIL, password: process.env.SUPABASE_TEST_USER_B_PASSWORD } : undefined;

function testClient(): Client {
  if (url === undefined || anonKey === undefined) throw new Error('SUPABASE_TEST_ENV_MISSING');
  return createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signIn(credentials: TestUser): Promise<Client> {
  const client = testClient();
  const { error } = await client.auth.signInWithPassword(credentials);
  if (error) throw error;
  return client;
}

const configured = url !== undefined && anonKey !== undefined && userA !== undefined && userB !== undefined;

(configured ? test : test.skip)('isolates two authenticated users across tenant-owned tables', async () => {
  assert.ok(userA !== undefined && userB !== undefined);
  const clientA = await signIn(userA);
  const clientB = await signIn(userB);
  const polygon = { type: 'Polygon', coordinates: [[[67, 24], [67.01, 24], [67.01, 24.01], [67, 24]]] } as unknown;
  const assetName = `RLS integration ${Date.now()}`;
  const { data: created, error: createError } = await clientB.from('monitored_assets').insert({ user_id: (await clientB.auth.getUser()).data.user?.id ?? '', asset_name: assetName, geo_boundary: polygon }).select('id').single();
  if (createError) throw createError;
  assert.ok(created !== null);
  const assetId = created.id;
  try {
    const { data: assets } = await clientA.from('monitored_assets').select('id').eq('id', assetId).limit(1);
    assert.deepEqual(assets, []);
    const { data: observations } = await clientA.from('asset_observations').select('id').eq('asset_id', assetId).limit(1);
    assert.deepEqual(observations, []);
    const { data: logs } = await clientA.from('processing_logs').select('id').eq('asset_id', assetId).limit(1);
    assert.deepEqual(logs, []);
    const { data: schedules } = await clientA.from('asset_schedules').select('asset_id').eq('asset_id', assetId).limit(1);
    assert.deepEqual(schedules, []);
    const { data: alerts } = await clientA.from('alert_history').select('id').eq('asset_id', assetId).limit(1);
    assert.deepEqual(alerts, []);
    const { data: updated } = await clientA.from('monitored_assets').update({ asset_name: 'cross-user mutation' }).eq('id', assetId).select('id');
    assert.deepEqual(updated, []);
    const { data: deleted } = await clientA.from('monitored_assets').delete().eq('id', assetId).select('id');
    assert.deepEqual(deleted, []);
  } finally {
    await clientB.from('monitored_assets').delete().eq('id', assetId);
    await clientA.auth.signOut();
    await clientB.auth.signOut();
  }
});
