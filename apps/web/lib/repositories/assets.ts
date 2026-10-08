import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, MonitoredAsset } from '@orbibound-ai/database';
import type { AssetRepository, CreateAssetInput, UpdateAssetInput } from '@orbibound-ai/backend';
import { polygonToWkt } from '../geo';

type Client = SupabaseClient<Database>;

export class SupabaseAssetRepository implements AssetRepository {
  public constructor(private readonly client: Client) {}
  public async listByUser(userId: string): Promise<MonitoredAsset[]> { const { data, error } = await this.client.from('monitored_assets').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) throw error; return data; }
  public async findByUser(userId: string, assetId: string): Promise<MonitoredAsset | null> { const { data, error } = await this.client.from('monitored_assets').select('*').eq('user_id', userId).eq('id', assetId).maybeSingle(); if (error) throw error; return data; }
  public async create(userId: string, input: CreateAssetInput): Promise<MonitoredAsset> { const { data, error } = await this.client.from('monitored_assets').insert({ user_id: userId, asset_name: input.assetName.trim(), geo_boundary: polygonToWkt(input.geoBoundary), refresh_frequency_days: input.refreshFrequencyDays ?? 5, alert_threshold: input.alertThreshold ?? 75 }).select().single(); if (error) throw error; const schedule = await this.client.from('asset_schedules').insert({ asset_id: data.id, next_run_at: new Date().toISOString() }); if (schedule.error) { await this.client.from('monitored_assets').delete().eq('id', data.id).eq('user_id', userId); throw schedule.error; } return data; }
  public async update(userId: string, assetId: string, input: UpdateAssetInput): Promise<MonitoredAsset | null> { const patch: Database['public']['Tables']['monitored_assets']['Update'] = {}; if (input.assetName !== undefined) patch.asset_name = input.assetName.trim(); if (input.geoBoundary !== undefined) patch.geo_boundary = polygonToWkt(input.geoBoundary); if (input.refreshFrequencyDays !== undefined) patch.refresh_frequency_days = input.refreshFrequencyDays; if (input.alertThreshold !== undefined) patch.alert_threshold = input.alertThreshold; const { data, error } = await this.client.from('monitored_assets').update(patch).eq('id', assetId).eq('user_id', userId).select().maybeSingle(); if (error) throw error; return data; }
  public async remove(userId: string, assetId: string): Promise<boolean> { const { data, error } = await this.client.from('monitored_assets').delete().eq('id', assetId).eq('user_id', userId).select('id'); if (error) throw error; return data.length > 0; }
}
