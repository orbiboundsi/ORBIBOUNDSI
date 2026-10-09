'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export function UpdatePasswordForm(): React.ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setComplete(true);
      window.setTimeout(() => { router.replace('/'); router.refresh(); }, 900);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Unable to update password.');
    } finally { setSubmitting(false); }
  }

  if (complete) return <div className="form-message form-message-success" role="status"><strong>Password updated</strong>Your new password is active. Returning to the workspace…</div>;
  return <form className="auth-form" onSubmit={submit} noValidate>
    <label className="form-field"><span>New password</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
    <label className="form-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required /></label>
    {error !== null && <div className="form-message form-message-error" role="alert"><strong>Could not update password</strong>{error}</div>}
    <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Updating…' : 'Update password'}</button>
    <div className="auth-links"><Link href="/auth/login">Return to sign in</Link></div>
  </form>;
}
