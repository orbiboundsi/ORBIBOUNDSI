import { BackendError } from './errors.js';

export interface GeoJsonPolygon { type: 'Polygon'; coordinates: number[][][] }
export interface CreateAssetInput { assetName: string; geoBoundary: GeoJsonPolygon; refreshFrequencyDays?: 1 | 3 | 5 | 7; alertThreshold?: number }
export interface UpdateAssetInput { assetName?: string; geoBoundary?: GeoJsonPolygon; refreshFrequencyDays?: 1 | 3 | 5 | 7; alertThreshold?: number }

function isFiniteCoordinate(value: number): boolean { return Number.isFinite(value); }
export function validatePolygon(value: unknown): asserts value is GeoJsonPolygon {
  if (typeof value !== 'object' || value === null || (value as { type?: unknown }).type !== 'Polygon') throw new BackendError('INVALID_GEOMETRY', 'geoBoundary must be a GeoJSON Polygon');
  const coordinates = (value as { coordinates?: unknown }).coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 1 || !Array.isArray(coordinates[0]) || coordinates[0].length < 4) throw new BackendError('INVALID_GEOMETRY', 'Polygon must contain one closed linear ring');
  const ring = coordinates[0] as unknown[];
  for (const point of ring) {
    if (!Array.isArray(point) || point.length < 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number' || !isFiniteCoordinate(point[0]) || !isFiniteCoordinate(point[1]) || point[0] < -180 || point[0] > 180 || point[1] < -90 || point[1] > 90) throw new BackendError('INVALID_GEOMETRY', 'Polygon coordinates are outside longitude/latitude bounds');
  }
  const first = ring[0] as number[]; const last = ring[ring.length - 1] as number[];
  if (first[0] !== last[0] || first[1] !== last[1]) throw new BackendError('INVALID_GEOMETRY', 'Polygon linear ring must be closed');
}

export function validateCreateAssetInput(input: CreateAssetInput): void {
  if (input.assetName.trim().length === 0 || input.assetName.length > 255) throw new BackendError('INVALID_ASSET_INPUT', 'assetName must be 1–255 characters');
  validatePolygon(input.geoBoundary);
  if (input.alertThreshold !== undefined && (input.alertThreshold < 0 || input.alertThreshold > 100 || !Number.isFinite(input.alertThreshold))) throw new BackendError('INVALID_ASSET_INPUT', 'alertThreshold must be between 0 and 100');
}
export function validateUpdateAssetInput(input: UpdateAssetInput): void {
  if (input.assetName !== undefined && (input.assetName.trim().length === 0 || input.assetName.length > 255)) throw new BackendError('INVALID_ASSET_INPUT', 'assetName must be 1–255 characters');
  if (input.geoBoundary !== undefined) validatePolygon(input.geoBoundary);
  if (input.alertThreshold !== undefined && (input.alertThreshold < 0 || input.alertThreshold > 100 || !Number.isFinite(input.alertThreshold))) throw new BackendError('INVALID_ASSET_INPUT', 'alertThreshold must be between 0 and 100');
}
