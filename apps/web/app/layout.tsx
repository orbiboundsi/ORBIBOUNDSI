import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OrbiBound AI | Operations Workspace',
  description: 'An early-stage geospatial intelligence workspace for setting up areas of interest. Satellite processing, scoring and alerts are not active in this build.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
