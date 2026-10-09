import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAoiPolygon } from '../lib/aoi';

test('accepts a closed WGS84 polygon', () => { const polygon = parseAoiPolygon(JSON.stringify({ type: 'Polygon', coordinates: [[[67, 24], [68, 24], [68, 25], [67, 24]]] })); assert.equal(polygon.type, 'Polygon'); });
test('rejects an open polygon', () => { assert.throws(() => parseAoiPolygon(JSON.stringify({ type: 'Polygon', coordinates: [[[67, 24], [68, 24], [68, 25], [67, 25]]] })), /closed/); });
test('rejects coordinates outside longitude latitude bounds', () => { assert.throws(() => parseAoiPolygon(JSON.stringify({ type: 'Polygon', coordinates: [[[267, 24], [68, 24], [68, 25], [267, 24]]] })), /longitude/); });
