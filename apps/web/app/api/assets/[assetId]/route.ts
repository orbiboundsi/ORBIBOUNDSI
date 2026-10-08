import { errorResponse, requestId, toAssetResponse } from '../../../../lib/api';
import { getAuthenticatedAssetService } from '../../../../lib/server/assets';
import { parseUpdateAssetInput } from '../../../../lib/request';
import { BackendError } from '@orbibound-ai/backend';

type RouteContext = { params: { assetId: string } };
function authError(error: unknown): unknown { return error instanceof Error && error.message === 'UNAUTHENTICATED' ? new BackendError('UNAUTHENTICATED', 'Authentication required') : error; }

export async function GET(_request: Request, context: RouteContext): Promise<Response> { const id = requestId(); try { const { userId, service } = await getAuthenticatedAssetService(); return Response.json({ data: toAssetResponse(await service.get(userId, context.params.assetId)), requestId: id }); } catch (error: unknown) { return errorResponse(authError(error), id); } }
export async function PATCH(request: Request, context: RouteContext): Promise<Response> { const id = requestId(); try { const { userId, service } = await getAuthenticatedAssetService(); const asset = await service.update(userId, context.params.assetId, parseUpdateAssetInput(await request.json() as unknown)); return Response.json({ data: toAssetResponse(asset), requestId: id }); } catch (error: unknown) { return errorResponse(authError(error), id); } }
export async function DELETE(_request: Request, context: RouteContext): Promise<Response> { const id = requestId(); try { const { userId, service } = await getAuthenticatedAssetService(); await service.remove(userId, context.params.assetId); return new Response(null, { status: 204, headers: { 'x-request-id': id } }); } catch (error: unknown) { return errorResponse(authError(error), id); } }
