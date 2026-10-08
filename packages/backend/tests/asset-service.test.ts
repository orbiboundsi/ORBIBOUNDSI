import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AssetService, BackendError, type AssetRepository, type CreateAssetInput } from '../src/index.js';
import type { MonitoredAsset } from '@orbibound-ai/database';

const polygon = { type: 'Polygon' as const, coordinates: [[[10, 20], [11, 20], [11, 21], [10, 20]]] };
const asset = (id: string): MonitoredAsset => ({ id, user_id: 'user-a', asset_name: 'Port', geo_boundary: polygon, risk_score: 0, processing_status: 'pending', refresh_frequency_days: 5, alert_threshold: 75, last_processed_at: null, last_scene_id: null, last_error_at: null, last_error_message: null, created_at: '', updated_at: '' });
const input: CreateAssetInput = { assetName: 'Port', geoBoundary: polygon };

class Repository implements AssetRepository {
  public async listByUser(): Promise<MonitoredAsset[]> { return [asset('a')]; }
  public async findByUser(_userId: string, id: string): Promise<MonitoredAsset | null> { return id === 'a' ? asset(id) : null; }
  public async create(): Promise<MonitoredAsset> { return asset('a'); }
  public async update(_userId: string, id: string): Promise<MonitoredAsset | null> { return id === 'a' ? asset(id) : null; }
  public async remove(_userId: string, id: string): Promise<boolean> { return id === 'a'; }
}

test('validates and delegates asset creation without mock production paths', async () => { const result = await new AssetService(new Repository()).create('user-a', input); assert.equal(result.id, 'a'); });
test('rejects an unclosed polygon', async () => { await assert.rejects(() => new AssetService(new Repository()).create('user-a', { ...input, geoBoundary: { type: 'Polygon', coordinates: [[[10, 20], [11, 20], [11, 21], [10, 21]]] } }), (error: unknown) => error instanceof BackendError && error.code === 'INVALID_GEOMETRY'); });
