'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export function LogoutButton(): React.ReactElement {
  const router = useRouter();
  async function logout(): Promise<void> {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace('/auth/login');
    router.refresh();
  }
  return <button className="user-chip user-chip-button" type="button" onClick={logout} title="Sign out"><span className="user-avatar" aria-hidden="true">OB</span><span className="eyebrow">Sign out</span></button>;
}
