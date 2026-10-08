import type { MonitoredAsset } from '@orbibound-ai/database';
import { BackendError } from './errors.js';
import { validateCreateAssetInput, validateUpdateAssetInput, type CreateAssetInput, type UpdateAssetInput } from './validation.js';

export interface AssetRepository {
  listByUser(userId: string): Promise<MonitoredAsset[]>;
  findByUser(userId: string, assetId: string): Promise<MonitoredAsset | null>;
  create(userId: string, input: CreateAssetInput): Promise<MonitoredAsset>;
  update(userId: string, assetId: string, input: UpdateAssetInput): Promise<MonitoredAsset | null>;
  remove(userId: string, assetId: string): Promise<boolean>;
}

export class AssetService {
  public constructor(private readonly repository: AssetRepository) {}
  public async list(userId: string): Promise<MonitoredAsset[]> { return this.repository.listByUser(userId); }
  public async get(userId: string, assetId: string): Promise<MonitoredAsset> {
    const asset = await this.repository.findByUser(userId, assetId);
    if (asset === null) throw new BackendError('ASSET_NOT_FOUND', 'Asset not found');
    return asset;
  }
  public async create(userId: string, input: CreateAssetInput): Promise<MonitoredAsset> { validateCreateAssetInput(input); return this.repository.create(userId, input); }
  public async update(userId: string, assetId: string, input: UpdateAssetInput): Promise<MonitoredAsset> { validateUpdateAssetInput(input); const asset = await this.repository.update(userId, assetId, input); if (asset === null) throw new BackendError('ASSET_NOT_FOUND', 'Asset not found'); return asset; }
  public async remove(userId: string, assetId: string): Promise<void> { if (!await this.repository.remove(userId, assetId)) throw new BackendError('ASSET_NOT_FOUND', 'Asset not found'); }
}
