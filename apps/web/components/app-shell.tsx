'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOverview = pathname === '/';
  const isAssetForm = pathname.startsWith('/assets/new');

  function closeMenu(): void {
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="app-header">
        <Link className="brand" href="/" aria-label="OrbiBound AI home" onClick={closeMenu}>
          <span className="brand-name">OrbiBound <span>AI</span></span>
        </Link>

        <button
          className="menu-toggle button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav
          className={`primary-nav${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          <Link className="nav-link" href="/" aria-current={isOverview ? 'page' : undefined} onClick={closeMenu}>
            Overview
          </Link>
          <Link className="nav-link" href="/#assets" onClick={closeMenu}>
            Assets
          </Link>
          <Link
            className={`button nav-cta${isAssetForm ? ' is-current' : ''}`}
            href="/assets/new"
            aria-current={isAssetForm ? 'page' : undefined}
            onClick={closeMenu}
          >
            Add monitored asset
          </Link>
        </nav>

        <div className="header-meta" aria-label="Current product phase">
          <span className="meta-label">Current build</span>
          <span className="meta-value">Phase 02 <span aria-hidden="true">/</span> Database foundation</span>
        </div>
      </header>

      <div className="main-area">
        <main id="main-content" className={`content${isOverview ? ' content-overview' : ' content-subpage'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
