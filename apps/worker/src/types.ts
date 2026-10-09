import type { MonitoredAsset } from '@orbibound-ai/database';
import type { AnomalyResult, SceneData } from '@orbibound-ai/anomaly-engine';

export type WorkerProcessingStatus = 'warming_up' | 'ready' | 'complete' | 'failed';

export interface ClaimedAsset extends Pick<MonitoredAsset, 'id' | 'asset_name' | 'geo_boundary' | 'refresh_frequency_days' | 'alert_threshold'> {
  user_id: string;
}

export interface SelectedScene {
  sceneId: string;
  datetime: string;
  cloudCover: number;
  redHref: string;
  nirHref: string;
}

export interface WorkerDependencies {
  now?: () => Date;
  workerId?: string;
  maxAssets?: number;
  stacApiUrl: string;
  stacCollection?: string;
  fetchMetadata: (asset: ClaimedAsset) => Promise<SelectedScene>;
  readCog: (asset: ClaimedAsset, scene: SelectedScene) => Promise<{ scene: SceneData; bytesRead: number }>;
  loadHistory: (assetId: string) => Promise<SceneData[]>;
  recordObservation: (assetId: string, scene: SceneData) => Promise<boolean>;
  updateAsset: (assetId: string, patch: { riskScore?: number; status: WorkerProcessingStatus; sceneId?: string; errorMessage?: string | null }) => Promise<void>;
  writeLog: (entry: ProcessingLogEntry) => Promise<void>;
  updateSchedule: (assetId: string, success: boolean, refreshDays: number, workerId: string, now: Date) => Promise<void>;
  sendAlert?: (asset: ClaimedAsset, result: AnomalyResult, sceneId: string) => Promise<void>;
}

export interface ProcessingLogEntry {
  assetId: string;
  status: 'started' | 'succeeded' | 'failed' | 'skipped';
  sceneId?: string;
  bytesRead?: number;
  processingTimeMs?: number;
  riskScore?: number;
  baselineValue?: number;
  currentValue?: number;
  zScore?: number;
  cloudCover?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface ProcessingOutcome {
  assetId: string;
  status: WorkerProcessingStatus;
  result?: AnomalyResult;
  errorCode?: string;
}
