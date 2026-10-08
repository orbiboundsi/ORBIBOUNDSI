import { computeRiskScore, type AnomalyResult, type SceneData } from '@orbibound-ai/anomaly-engine';

export interface AnomalyService { score(historicalScenes: SceneData[], currentScene: SceneData): AnomalyResult }

export class DefaultAnomalyService implements AnomalyService {
  public score(historicalScenes: SceneData[], currentScene: SceneData): AnomalyResult { return computeRiskScore(historicalScenes, currentScene); }
}
