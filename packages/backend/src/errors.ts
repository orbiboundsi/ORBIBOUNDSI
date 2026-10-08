export type BackendErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'ASSET_NOT_FOUND' | 'INVALID_ASSET_INPUT' | 'INVALID_GEOMETRY' | 'INTERNAL_ERROR';

export class BackendError extends Error {
  public readonly code: BackendErrorCode;
  public constructor(code: BackendErrorCode, message: string) { super(message); this.name = 'BackendError'; this.code = code; }
}
