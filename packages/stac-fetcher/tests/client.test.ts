import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchSatelliteMetadata } from '../src/index.js';

const bbox = { minLng: 10, minLat: 20, maxLng: 11, maxLat: 21 };
const response = (status: number, payload: unknown): Response => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

test('fetches and sorts valid STAC scenes by cloud cover', async () => {
  const result = await fetchSatelliteMetadata({ bbox, now: new Date('2026-10-08T00:00:00Z') }, { apiUrl: 'https://example.invalid/search', fetchImpl: async () => response(200, { features: [{ id: 'scene-b', properties: { datetime: '2026-10-07T00:00:00Z', 'eo:cloud_cover': 20 }, assets: {} }, { id: 'scene-a', properties: { datetime: '2026-10-06T00:00:00Z', 'eo:cloud_cover': 5 }, assets: {} }] }), sleep: async () => undefined });
  assert.deepEqual(result?.scenes.map((scene) => scene.id), ['scene-a', 'scene-b']);
});

test('maps 429 to STAC_RATE_LIMITED', async () => {
  await assert.rejects(() => fetchSatelliteMetadata({ bbox }, { apiUrl: 'https://example.invalid/search', maxRetries: 0, fetchImpl: async () => response(429, {}) }), { code: 'STAC_RATE_LIMITED' });
});
