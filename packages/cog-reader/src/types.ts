export interface GeoJsonPolygon { type: 'Polygon'; coordinates: number[][][] }
export interface CogReadOptions { url: string; polygon: GeoJsonPolygon; timeoutMs?: number; fetchImpl?: typeof fetch }
export interface CogBandStatistics { mean: number; validPixelCount: number; bytesRead: number }
export interface CogWindowResult { red: CogBandStatistics; nir: CogBandStatistics; meanReflectance: number; bytesRead: number }
export type CogErrorCode = 'COG_READ_ERROR' | 'COG_TIMEOUT' | 'COG_INVALID_ASSET' | 'COG_NO_DATA'
export class CogReaderError extends Error { public constructor(public readonly code: CogErrorCode, message: string, public readonly cause?: unknown) { super(message); this.name = 'CogReaderError'; } }
