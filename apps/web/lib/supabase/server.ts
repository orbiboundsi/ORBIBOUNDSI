import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@orbibound-ai/database';

export function createSupabaseServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url === undefined || key === undefined) throw new Error('SUPABASE_ENV_MISSING');
  return createServerClient<Database>(url, key, { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }>) => { try { cookiesToSet.forEach(({ name, value, options }) => { if (options === undefined) cookieStore.set(name, value); else cookieStore.set(name, value, options); }); } catch { /* Server Components may be read-only. */ } } } }) as unknown as SupabaseClient<Database>;
}
