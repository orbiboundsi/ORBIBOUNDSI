'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export function ResetRequestForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const origin = window.location.origin;
      const { error: resetError } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/auth/callback?next=/auth/update-password` });
      if (resetError) throw resetError;
      setSent(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Unable to send the reset email.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="auth-form" onSubmit={submit} noValidate>
    <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="analyst@company.com" required /></label>
    {error !== null && <div className="form-message form-message-error" role="alert"><strong>Reset email failed</strong>{error}</div>}
    {sent && <div className="form-message form-message-success" role="status"><strong>Check your inbox</strong>If an account exists for this address, Supabase sent a password recovery link.</div>}
    <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
    <div className="auth-links"><Link href="/auth/login">Return to sign in</Link></div>
  </form>;
}
