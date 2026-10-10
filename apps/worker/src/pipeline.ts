import { findBandAsset, fetchSatelliteMetadata } from '@orbibound-ai/stac-fetcher';
import { readCogWindow } from '@orbibound-ai/cog-reader';
import { sendAlert, SmtpSender, WebhookSender, type AlertConfig, type AlertSender } from '@orbibound-ai/alert-service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@orbibound-ai/database';
import { claimDueAssets, loadObservations, recordObservation, updateAsset, updateSchedule, writeProcessingLog } from './repository.js';
import { processBatch } from './processor.js';
import type { ClaimedAsset, WorkerDependencies, WorkerRunSummary } from './types.js';
import { createRunSummary, logRunSummary } from './runner.js';

type WorkerClient = SupabaseClient<Database>;
interface Polygon { type: 'Polygon'; coordinates: number[][][] }

class CompositeAlertSender implements AlertSender {
  public constructor(private readonly webhook: WebhookSender, private readonly smtp?: SmtpSender) {}
  public async send(event: Parameters<AlertSender['send']>[0], config: AlertConfig): Promise<{ webhookDelivered: boolean; emailSent: boolean; webhookError: string | null; emailError: string | null }> {
    const webhookResult = await this.webhook.send(event, config);
    const emailResult = this.smtp === undefined ? { emailSent: false, emailError: null } : await this.smtp.send(event, config);
    return { webhookDelivered: webhookResult.webhookDelivered, emailSent: emailResult.emailSent, webhookError: webhookResult.webhookError, emailError: emailResult.emailError };
  }
}

function alertConfig(): AlertConfig {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  const recipients = (process.env.ALERT_EMAIL_RECIPIENTS ?? '').split(',').map((item) => item.trim()).filter((item) => item.length > 0);
  const config: AlertConfig = { webhookEnabled: webhookUrl !== undefined && webhookUrl.length > 0, emailEnabled: recipients.length > 0, emailRecipients: recipients };
  if (webhookUrl !== undefined && webhookUrl.length > 0) config.webhookUrl = webhookUrl;
  return config;
}

function polygon(value: unknown): Polygon {
  if (typeof value !== 'object' || value === null || (value as { type?: unknown }).type !== 'Polygon') throw new Error('INVALID_GEOMETRY');
  return value as Polygon;
}

function bbox(value: unknown): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  const points = polygon(value).coordinates[0] ?? [];
  const lngs = points.map((point) => point[0] ?? 0);
  const lats = points.map((point) => point[1] ?? 0);
  return { minLng: Math.min(...lngs), minLat: Math.min(...lats), maxLng: Math.max(...lngs), maxLat: Math.max(...lats) };
}

export function createDependencies(client: WorkerClient, apiUrl: string, collection = 'sentinel-2-l2a', workerId?: string): WorkerDependencies {
  const id = workerId ?? `worker-${process.pid}`;
  const smtp = process.env.SMTP_HOST !== undefined && process.env.SMTP_USER !== undefined && process.env.SMTP_PASSWORD !== undefined && process.env.SMTP_FROM !== undefined
    ? new SmtpSender({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? '587'), secure: process.env.SMTP_PORT === '465', user: process.env.SMTP_USER, password: process.env.SMTP_PASSWORD, from: process.env.SMTP_FROM })
    : undefined;
  const sender = new CompositeAlertSender(new WebhookSender(), smtp);
  const history = {
    exists: async (dedupeKey: string): Promise<boolean> => {
      const { data, error } = await client.from('alert_history').select('id').eq('dedupe_key', dedupeKey).limit(1);
      if (error) throw error;
      return data.length > 0;
    },
    insert: async (entry: { assetId: string; sceneId: string; riskScore: number; threshold: number; explanation: string; dedupeKey: string; webhookDelivered: boolean; emailSent: boolean; webhookError: string | null; emailError: string | null }): Promise<void> => {
      const { error } = await client.from('alert_history').insert({ asset_id: entry.assetId, scene_id: entry.sceneId, risk_score: entry.riskScore, threshold: entry.threshold, explanation: entry.explanation, dedupe_key: entry.dedupeKey, webhook_delivered: entry.webhookDelivered, email_sent: entry.emailSent, webhook_error: entry.webhookError, email_error: entry.emailError });
      if (error) throw error;
    },
  };
  return {
    workerId: id,
    stacApiUrl: apiUrl,
    stacCollection: collection,
    fetchMetadata: async (asset: ClaimedAsset) => {
      const result = await fetchSatelliteMetadata({ bbox: bbox(asset.geo_boundary), daysBack: 30, maxCloudCover: 80, limit: 5 }, { apiUrl, collection });
      const scene = result?.scenes[0];
      if (scene === undefined) throw new Error('STAC_NO_SCENES');
      return { sceneId: scene.id, datetime: scene.datetime, cloudCover: scene.cloudCover, redHref: findBandAsset(scene, 'red').href, nirHref: findBandAsset(scene, 'nir').href };
    },
    readCog: async (asset, scene) => {
      const cog = await readCogWindow({ url: scene.redHref, polygon: polygon(asset.geo_boundary) }, { url: scene.nirHref, polygon: polygon(asset.geo_boundary) });
      return { bytesRead: cog.bytesRead, scene: { sceneId: scene.sceneId, datetime: scene.datetime, cloudCover: scene.cloudCover, meanReflectance: cog.meanReflectance } };
    },
    loadHistory: (assetId: string) => loadObservations(client, assetId),
    recordObservation: (assetId, scene) => recordObservation(client, assetId, scene),
    updateAsset: (assetId, patch) => updateAsset(client, assetId, patch),
    writeLog: (entry) => writeProcessingLog(client, entry),
    updateSchedule: (assetId, success, refreshDays, worker, now) => updateSchedule(client, assetId, success, refreshDays, worker, now),
    sendAlert: async (asset, result, sceneId) => {
      const config = alertConfig();
      await sendAlert({ id: asset.id, assetName: asset.asset_name, threshold: asset.alert_threshold }, result, sceneId, config, sender, history);
    },
  };
}

export async function claimAndProcess(client: WorkerClient, apiUrl: string, collection = 'sentinel-2-l2a', workerId?: string, maxAssets = 50, staleAfterMinutes = 30): Promise<WorkerRunSummary> {
  const startedAt = new Date();
  const id = workerId ?? `worker-${process.pid}`;
  const assets = await claimDueAssets(client, id, maxAssets, staleAfterMinutes);
  const dependencies = createDependencies(client, apiUrl, collection, id);
  const outcomes = await processBatch(assets, dependencies);
  const summary = createRunSummary(id, startedAt, new Date(), assets.length, outcomes);
  logRunSummary(summary);
  return summary;
}
