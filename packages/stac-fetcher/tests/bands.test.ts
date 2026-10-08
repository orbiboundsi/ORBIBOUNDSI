import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findBandAsset, StacFetcherError, type SatelliteScene } from '../src/index.js';

const scene = (assets: SatelliteScene['assets']): SatelliteScene => ({ id: 'scene-1', datetime: '2026-10-08T00:00:00Z', cloudCover: 2, assets });

test('finds red and nir using eo band common names', () => {
  const result = scene({ red_asset: { href: 'red.tif', bands: [{ commonName: 'red' }] }, nir_asset: { href: 'nir.tif', bands: [{ commonName: 'nir' }] } });
  assert.equal(findBandAsset(result, 'red').href, 'red.tif');
  assert.equal(findBandAsset(result, 'nir').href, 'nir.tif');
});

test('falls back to Sentinel band keys', () => {
  const result = scene({ B04: { href: 'b04.tif' }, B08: { href: 'b08.tif' } });
  assert.equal(findBandAsset(result, 'red').href, 'b04.tif');
  assert.equal(findBandAsset(result, 'nir').href, 'b08.tif');
});

test('throws a typed error when a required band is missing', () => {
  assert.throws(() => findBandAsset(scene({ thumbnail: { href: 'thumb.jpg' } }), 'nir'), (error: unknown) => error instanceof StacFetcherError && error.code === 'STAC_BAND_NOT_FOUND');
});
