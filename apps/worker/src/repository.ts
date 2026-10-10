import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, MonitoredAsset } from '@orbibound-ai/database';
import type { SceneData } from '@orbibound-ai/anomaly-engine';
import type { ClaimedAsset, ProcessingLogEntry, WorkerProcessingStatus } from './types.js';

type Client = SupabaseClient<Database>;
interface RpcClient { rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> }
interface ObservationRow { scene_id: string; scene_datetime: string; mean_reflectance: number; cloud_cover: number }

export function createWorkerClient(): Client {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || key === undefined) throw new Error('SUPABASE_WORKER_ENV_MISSING');
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function claimDueAssets(client: Client, workerId: string, maxAssets = 50, staleAfterMinutes = 30): Promise<ClaimedAsset[]> {
  const rpc = client as unknown as RpcClient;
  const { data, error } = await rpc.rpc('claim_due_asset_schedules', { p_worker_id: workerId, p_limit: maxAssets, p_stale_after: `${staleAfterMinutes} minutes` });
  if (error) throw new Error(`CLAIM_ERROR: ${error.message}`);
  return Array.isArray(data) ? data.map((row: unknown) => row as ClaimedAsset) : [];
}

export async function recordObservation(client: Client, assetId: string, scene: SceneData): Promise<boolean> {
  const { data, error } = await client.from('asset_observations').upsert({
    asset_id: assetId,
    scene_id: scene.sceneId,
    scene_datetime: scene.datetime,
    mean_reflectance: scene.meanReflectance,
    cloud_cover: scene.cloudCover,
  }, { onConflict: 'asset_id,scene_id', ignoreDuplicates: true }).select('id').maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function loadObservations(client: Client, assetId: string): Promise<SceneData[]> {
  const { data, error } = await client.from('asset_observations').select('scene_id,scene_datetime,mean_reflectance,cloud_cover').eq('asset_id', assetId).order('scene_datetime', { ascending: true }).limit(100);
  if (error) throw error;
  return (data as ObservationRow[]).map((row) => ({ sceneId: row.scene_id, datetime: row.scene_datetime, meanReflectance: row.mean_reflectance, cloudCover: row.cloud_cover }));
}

export async function updateAsset(client: Client, assetId: string, patch: { riskScore?: number; status: WorkerProcessingStatus; sceneId?: string; errorMessage?: string | null }): Promise<void> {
  const values: Database['public']['Tables']['monitored_assets']['Update'] = {
    processing_status: patch.status,
    last_scene_id: patch.sceneId ?? null,
    last_processed_at: patch.status === 'failed' ? null : new Date().toISOString(),
    last_error_at: patch.status === 'failed' ? new Date().toISOString() : null,
    last_error_message: patch.errorMessage ?? null,
  };
  if (patch.riskScore !== undefined) values.risk_score = patch.riskScore;
  const { error } = await client.from('monitored_assets').update(values).eq('id', assetId);
  if (error) throw error;
}

export async function writeProcessingLog(client: Client, entry: ProcessingLogEntry): Promise<void> {
  const { error } = await client.from('processing_logs').insert({ asset_id: entry.assetId, status: entry.status, scene_id: entry.sceneId ?? null, bytes_read: entry.bytesRead ?? null, processing_time_ms: entry.processingTimeMs ?? null, risk_score: entry.riskScore ?? null, baseline_value: entry.baselineValue ?? null, current_value: entry.currentValue ?? null, z_score: entry.zScore ?? null, cloud_cover: entry.cloudCover ?? null, error_code: entry.errorCode ?? null, error_message: entry.errorMessage ?? null });
  if (error) throw error;
}

export async function updateSchedule(client: Client, assetId: string, success: boolean, refreshDays: number, workerId: string, now: Date): Promise<void> {
  const { data: current, error: readError } = await client.from('asset_schedules').select('run_count,failure_count').eq('asset_id', assetId).eq('locked_by', workerId).maybeSingle();
  if (readError) throw readError;
  const jitter = Math.floor(Math.random() * 3 * 60 * 60 * 1000);
  const next = new Date(now.getTime() + refreshDays * 86_400_000 + jitter).toISOString();
  const { error } = await client.from('asset_schedules').update({ next_run_at: next, last_run_at: now.toISOString(), run_count: (current?.run_count ?? 0) + (success ? 1 : 0), failure_count: (current?.failure_count ?? 0) + (success ? 0 : 1), locked_at: null, locked_by: null }).eq('asset_id', assetId).eq('locked_by', workerId);
  if (error) throw error;
}

export type { MonitoredAsset };
