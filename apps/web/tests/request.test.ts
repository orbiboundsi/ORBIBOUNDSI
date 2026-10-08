import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BackendError } from '@orbibound-ai/backend';
import { parseCreateAssetInput, parseUpdateAssetInput } from '../lib/request';

const polygon = { type: 'Polygon' as const, coordinates: [[[67, 24], [68, 24], [68, 25], [67, 24]]] };

test('parses create input without introducing fixture data', () => { const input = parseCreateAssetInput({ assetName: 'Port', geoBoundary: polygon }); assert.equal(input.assetName, 'Port'); assert.equal(input.geoBoundary.type, 'Polygon'); });
test('rejects invalid refresh frequency at the API boundary', () => { assert.throws(() => parseCreateAssetInput({ assetName: 'Port', geoBoundary: polygon, refreshFrequencyDays: 2 }), (error: unknown) => error instanceof BackendError && error.code === 'INVALID_ASSET_INPUT'); });
test('parses partial update input', () => { const input = parseUpdateAssetInput({ alertThreshold: 80 }); assert.equal(input.alertThreshold, 80); });
