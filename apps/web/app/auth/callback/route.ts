import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

function safeNextPath(value: string | null): string {
  return value !== null && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  if (code === null) return NextResponse.redirect(new URL('/auth/login?error=missing_code', url.origin));
  const client = createSupabaseServerClient();
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/auth/login?error=invalid_or_expired_link', url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
