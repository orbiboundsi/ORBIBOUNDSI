export type StacErrorCode = 'STAC_API_TIMEOUT' | 'STAC_RATE_LIMITED' | 'STAC_API_ERROR' | 'STAC_INVALID_RESPONSE';

export class StacFetcherError extends Error {
  public readonly code: StacErrorCode;
  public readonly status: number | undefined;
  public constructor(code: StacErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'StacFetcherError';
    this.code = code;
    this.status = status;
  }
}
