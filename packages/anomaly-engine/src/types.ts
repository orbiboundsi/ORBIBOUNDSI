export interface SceneData { sceneId: string; datetime: string; meanReflectance: number; cloudCover: number }
export interface AnomalyResult { riskScore: number; explanation: string; baselineValue: number; currentValue: number; percentChange: number; zScore: number }
