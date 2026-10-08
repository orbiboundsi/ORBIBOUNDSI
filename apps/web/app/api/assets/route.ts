import { errorResponse, requestId, toAssetResponse } from '../../../lib/api';
import { getAuthenticatedAssetService } from '../../../lib/server/assets';
import { parseCreateAssetInput } from '../../../lib/request';
import { BackendError } from '@orbibound-ai/backend';

function authError(error: unknown): unknown { return error instanceof Error && error.message === 'UNAUTHENTICATED' ? new BackendError('UNAUTHENTICATED', 'Authentication required') : error; }

export async function GET(): Promise<Response> { const id = requestId(); try { const { userId, service } = await getAuthenticatedAssetService(); const assets = await service.list(userId); return Response.json({ data: assets.map(toAssetResponse), requestId: id }); } catch (error: unknown) { return errorResponse(authError(error), id); } }
export async function POST(request: Request): Promise<Response> { const id = requestId(); try { const { userId, service } = await getAuthenticatedAssetService(); const input = parseCreateAssetInput(await request.json() as unknown); const asset = await service.create(userId, input); return Response.json({ data: toAssetResponse(asset), requestId: id }, { status: 201 }); } catch (error: unknown) { return errorResponse(authError(error), id); } }
