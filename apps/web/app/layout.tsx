import './globals.css';
import './auth-styles.css';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement { return <html lang="en"><body>{children}</body></html>; }
