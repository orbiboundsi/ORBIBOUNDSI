import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps { eyebrow: string; title: string; description: string; children: ReactNode }

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps): React.ReactElement {
  return <main className="auth-page"><div className="auth-orbit orbit-one" aria-hidden="true" /><div className="auth-orbit orbit-two" aria-hidden="true" /><section className="auth-card" aria-labelledby="auth-title"><Link className="auth-brand" href="/"><span className="brand-mark" aria-hidden="true" /><span><strong>OrbiBound AI</strong><small>Satellite intelligence</small></span></Link><div className="auth-intro"><div className="eyebrow">{eyebrow}</div><h1 id="auth-title">{title}</h1><p>{description}</p></div>{children}<div className="auth-footnote"><span className="status-dot" aria-hidden="true" />Secure workspace access · UTC operations</div></section></main>;
}
