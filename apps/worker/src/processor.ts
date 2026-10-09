import { computeRiskScore, type AnomalyResult } from '@orbibound-ai/anomaly-engine';
import type { ClaimedAsset, ProcessingOutcome, WorkerDependencies, WorkerProcessingStatus } from './types.js';

function warmupStatus(observationCount: number): WorkerProcessingStatus {
  return observationCount >= 3 ? 'ready' : 'warming_up';
}

export async function processAsset(asset: ClaimedAsset, dependencies: WorkerDependencies): Promise<ProcessingOutcome> {
  const now = dependencies.now ?? (() => new Date());
  const workerId = dependencies.workerId ?? 'worker';
  const started = now().getTime();
  await dependencies.writeLog({ assetId: asset.id, status: 'started' });
  try {
    const selected = await dependencies.fetchMetadata(asset);
    const cog = await dependencies.readCog(asset, selected);
    const inserted = await dependencies.recordObservation(asset.id, cog.scene);
    const observations = await dependencies.loadHistory(asset.id);
    const historicalScenes = observations.filter((scene) => scene.sceneId !== cog.scene.sceneId);

    if (!inserted) {
      const status = warmupStatus(observations.length);
      await dependencies.updateAsset(asset.id, { status, sceneId: selected.sceneId, errorMessage: null });
      await dependencies.writeLog({ assetId: asset.id, status: 'skipped', sceneId: selected.sceneId, bytesRead: cog.bytesRead, processingTimeMs: now().getTime() - started, cloudCover: selected.cloudCover, errorCode: 'OBSERVATION_DUPLICATE', errorMessage: 'Scene was already recorded; baseline was not changed.' });
      await dependencies.updateSchedule(asset.id, true, asset.refresh_frequency_days, workerId, now());
      return { assetId: asset.id, status, errorCode: 'OBSERVATION_DUPLICATE' };
    }

    if (historicalScenes.length < 3) {
      const status = warmupStatus(observations.length);
      const message = status === 'ready' ? 'Three valid observations collected; scoring begins on the next new observation.' : `Baseline warm-up: ${observations.length} of 3 valid observations collected.`;
      await dependencies.updateAsset(asset.id, { status, sceneId: selected.sceneId, errorMessage: null });
      await dependencies.writeLog({ assetId: asset.id, status: 'skipped', sceneId: selected.sceneId, bytesRead: cog.bytesRead, processingTimeMs: now().getTime() - started, currentValue: cog.scene.meanReflectance, cloudCover: selected.cloudCover, errorCode: 'BASELINE_WARMUP', errorMessage: message });
      await dependencies.updateSchedule(asset.id, true, asset.refresh_frequency_days, workerId, now());
      return { assetId: asset.id, status, errorCode: 'BASELINE_WARMUP' };
    }

    const result: AnomalyResult = computeRiskScore(historicalScenes, cog.scene);
    await dependencies.updateAsset(asset.id, { riskScore: result.riskScore, status: 'complete', sceneId: selected.sceneId, errorMessage: null });
    await dependencies.writeLog({ assetId: asset.id, status: 'succeeded', sceneId: selected.sceneId, bytesRead: cog.bytesRead, processingTimeMs: now().getTime() - started, riskScore: result.riskScore, baselineValue: result.baselineValue, currentValue: result.currentValue, zScore: result.zScore, cloudCover: selected.cloudCover });
    if (dependencies.sendAlert !== undefined && result.riskScore >= asset.alert_threshold) {
      try { await dependencies.sendAlert(asset, result, selected.sceneId); } catch { /* Alert delivery is isolated from satellite processing. */ }
    }
    await dependencies.updateSchedule(asset.id, true, asset.refresh_frequency_days, workerId, now());
    return { assetId: asset.id, status: 'complete', result };
  } catch (error: unknown) {
    const errorCode = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : error instanceof Error ? error.name : 'WORKER_ERROR';
    const errorMessage = error instanceof Error ? error.message : 'Unknown worker error';
    await dependencies.updateAsset(asset.id, { status: 'failed', errorMessage });
    await dependencies.writeLog({ assetId: asset.id, status: 'failed', processingTimeMs: now().getTime() - started, errorCode, errorMessage });
    await dependencies.updateSchedule(asset.id, false, asset.refresh_frequency_days, workerId, now());
    return { assetId: asset.id, status: 'failed', errorCode };
  }
}

export async function processBatch(assets: ClaimedAsset[], dependencies: WorkerDependencies): Promise<ProcessingOutcome[]> {
  const outcomes: ProcessingOutcome[] = [];
  for (const asset of assets) outcomes.push(await processAsset(asset, dependencies));
  return outcomes;
}
