import assert from 'node:assert/strict';
import { test } from 'node:test';
import { polygonToWkt } from '../lib/geo';

test('converts validated GeoJSON polygon to PostGIS WKT', () => { assert.equal(polygonToWkt({ type: 'Polygon', coordinates: [[[67, 24], [68, 24], [68, 25], [67, 24]]] }), 'POLYGON((67 24, 68 24, 68 25, 67 24))'); });
