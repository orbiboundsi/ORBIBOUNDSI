import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeRiskScore } from '../src/index.js';

test('computes explainable score for a changed scene', () => {
  const result = computeRiskScore([{ sceneId: 'a', datetime: '', meanReflectance: 10, cloudCover: 2 }, { sceneId: 'b', datetime: '', meanReflectance: 11, cloudCover: 3 }, { sceneId: 'c', datetime: '', meanReflectance: 9, cloudCover: 1 }], { sceneId: 'current', datetime: '', meanReflectance: 12, cloudCover: 1 });
  assert.ok(result.riskScore > 50);
  assert.match(result.explanation, /reflectance increased/);
});

test('handles zero variance deterministically', () => {
  const result = computeRiskScore([{ sceneId: 'a', datetime: '', meanReflectance: 10, cloudCover: 2 }, { sceneId: 'b', datetime: '', meanReflectance: 10, cloudCover: 2 }, { sceneId: 'c', datetime: '', meanReflectance: 10, cloudCover: 2 }], { sceneId: 'current', datetime: '', meanReflectance: 12, cloudCover: 1 });
  assert.equal(result.riskScore, 95);
  assert.equal(result.zScore, 3);
});

test('rejects insufficient baseline', () => {
  assert.throws(() => computeRiskScore([], { sceneId: 'current', datetime: '', meanReflectance: 1, cloudCover: 1 }), /INSUFFICIENT_BASELINE/);
});
