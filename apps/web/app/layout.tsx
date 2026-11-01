import type { Metadata } from 'next';
import './globals.css';
import './auth-styles.css';

export const metadata: Metadata = { title: 'OrbiBound AI — Satellite intelligence for physical risk', description: 'Explainable satellite intelligence for hedge funds and supply-chain operators.', metadataBase: new URL('https://app.orbibound.ai') };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement { return <html lang="en"><body>{children}</body></html>; }
