import type { MonitoredAsset } from '@orbibound-ai/database';
import { BackendError } from '@orbibound-ai/backend';

export interface AssetResponse { id: string; assetName: string; geoBoundary: unknown; riskScore: number; processingStatus: string; refreshFrequencyDays: number; alertThreshold: number; lastProcessedAt: string | null; lastSceneId: string | null; lastErrorMessage: string | null; createdAt: string; updatedAt: string }
export interface ApiErrorResponse { error: { code: string; message: string; requestId: string } }

export function toAssetResponse(asset: MonitoredAsset): AssetResponse { return { id: asset.id, assetName: asset.asset_name, geoBoundary: asset.geo_boundary, riskScore: asset.risk_score, processingStatus: asset.processing_status, refreshFrequencyDays: asset.refresh_frequency_days, alertThreshold: asset.alert_threshold, lastProcessedAt: asset.last_processed_at, lastSceneId: asset.last_scene_id, lastErrorMessage: asset.last_error_message, createdAt: asset.created_at, updatedAt: asset.updated_at }; }
export function requestId(): string { return crypto.randomUUID(); }
export function errorResponse(error: unknown, id: string): Response { const backendError = error instanceof BackendError ? error : null; const code = backendError?.code ?? 'INTERNAL_ERROR'; const status = code === 'ASSET_NOT_FOUND' ? 404 : code === 'INVALID_ASSET_INPUT' || code === 'INVALID_GEOMETRY' ? 400 : code === 'UNAUTHENTICATED' ? 401 : code === 'FORBIDDEN' ? 403 : 500; const body: ApiErrorResponse = { error: { code, message: backendError?.message ?? 'Internal server error', requestId: id } }; return Response.json(body, { status }); }
