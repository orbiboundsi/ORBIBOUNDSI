'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

type AuthMode = 'login' | 'signup';

interface AuthFormProps {
  mode: AuthMode;
  nextPath?: string | undefined;
  initialError?: string | undefined;
}

function safeNextPath(value: string | undefined): string {
  return value !== undefined && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export function AuthForm({ mode, nextPath, initialError }: AuthFormProps): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === 'signup';

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const client = createSupabaseBrowserClient();
      if (isSignup) {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath(nextPath))}`;
        const { data, error: signUpError } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } });
        if (signUpError) throw signUpError;
        if (data.session === null) {
          setMessage('Account created. Check your email to confirm the account before signing in.');
          return;
        }
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
      router.replace(safeNextPath(nextPath));
      router.refresh();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <label className="form-field">
        <span>Email address</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="analyst@company.com" required />
      </label>
      <label className="form-field">
        <span>Password</span>
        <input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} required />
      </label>
      {isSignup && <label className="form-field">
        <span>Confirm password</span>
        <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" minLength={8} required />
      </label>}
      {error !== null && <div className="form-message form-message-error" role="alert"><strong>Could not {isSignup ? 'create account' : 'sign in'}</strong>{error}</div>}
      {message !== null && <div className="form-message form-message-success" role="status"><strong>Check your inbox</strong>{message}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Working…' : isSignup ? 'Create account' : 'Sign in'}</button>
      <div className="auth-links">
        {isSignup ? <span>Already have an account? <Link href="/auth/login">Sign in</Link></span> : <><Link href="/auth/reset">Forgot password?</Link><span>New to OrbiBound? <Link href="/auth/signup">Create account</Link></span></>}
      </div>
    </form>
  );
}
