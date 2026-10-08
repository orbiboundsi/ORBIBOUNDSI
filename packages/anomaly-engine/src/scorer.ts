import type { AnomalyResult, SceneData } from './types.js';

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
function round(value: number, places: number): number { const factor = 10 ** places; return Math.round(value * factor) / factor; }

export function computeRiskScore(historicalScenes: SceneData[], currentScene: SceneData): AnomalyResult {
  if (historicalScenes.length < 3) throw new Error('INSUFFICIENT_BASELINE');
  if (!Number.isFinite(currentScene.meanReflectance)) throw new Error('INVALID_CURRENT_SCENE');
  const values = historicalScenes.map((scene) => scene.meanReflectance);
  if (values.some((value) => !Number.isFinite(value))) throw new Error('INVALID_HISTORICAL_SCENE');
  const baselineValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - baselineValue) ** 2, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const percentChange = baselineValue === 0 ? 0 : ((currentScene.meanReflectance - baselineValue) / Math.abs(baselineValue)) * 100;
  const zScore = standardDeviation === 0 ? (currentScene.meanReflectance === baselineValue ? 0 : currentScene.meanReflectance > baselineValue ? 3 : -3) : (currentScene.meanReflectance - baselineValue) / standardDeviation;
  const riskScore = clamp(50 + zScore * 15, 0, 100);
  const direction = percentChange >= 0 ? 'increased' : 'decreased';
  const explanation = `Risk ${Math.round(riskScore)} because reflectance ${direction} by ${Math.abs(round(percentChange, 2))}% versus the ${values.length}-scene baseline.`;
  return { riskScore: round(riskScore, 2), explanation, baselineValue: round(baselineValue, 6), currentValue: currentScene.meanReflectance, percentChange: round(percentChange, 2), zScore: round(zScore, 4) };
}
