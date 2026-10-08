import { AssetService } from '@orbibound-ai/backend';
import { BackendError } from '@orbibound-ai/backend';
import { createSupabaseServerClient } from '../supabase/server';
import { SupabaseAssetRepository } from '../repositories/assets';

export async function getAuthenticatedAssetService(): Promise<{ userId: string; service: AssetService }> { const client = createSupabaseServerClient(); const { data: { user }, error } = await client.auth.getUser(); if (error || user === null) throw new BackendError('UNAUTHENTICATED', 'Authentication required'); return { userId: user.id, service: new AssetService(new SupabaseAssetRepository(client)) }; }
