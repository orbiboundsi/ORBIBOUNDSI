import Link from 'next/link';
import { AppShell } from '../components/app-shell';
import { AssetList } from '../components/asset-list';

export default function HomePage(): React.ReactElement {
  return (
    <AppShell>
      <section className="overview-hero" aria-labelledby="overview-title">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">OrbiBound AI <span aria-hidden="true">/</span> Early-stage geospatial intelligence</p>
          <h1 id="overview-title" className="hero-title">A clearer view of place-based change.</h1>
          <p className="hero-description">
            Set up areas of interest and the rules you want to apply. Satellite processing, risk scoring and alerts are not active in this build.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/assets/new">Add monitored asset</Link>
            <Link className="text-link" href="#assets">View monitored assets</Link>
          </div>
          <p className="hero-note">Area-of-interest setup is implemented. Operational satellite observations are not shown here.</p>
        </div>
        <p className="image-credit">
          NASA / Artemis II <span aria-hidden="true">·</span> Contextual photograph, not OrbiBound asset data <span aria-hidden="true">·</span>{' '}
          <a href="https://www.nasa.gov/gallery/journey-to-the-moon/" target="_blank" rel="noreferrer">Image source</a>
        </p>
      </section>

      <section className="workspace-status" aria-labelledby="workspace-status-title">
        <div className="section-heading">
          <p className="eyebrow">Workspace status <span aria-hidden="true">/</span> Phase 02</p>
          <h2 id="workspace-status-title">Foundation in progress</h2>
        </div>
        <ul className="status-list">
          <li><span>Area-of-interest setup</span><span className="status-value">Implemented</span></li>
          <li><span>Satellite observations and processing</span><span className="status-value">Not active</span></li>
          <li><span>Risk scoring and alert delivery</span><span className="status-value">Not active</span></li>
        </ul>
      </section>

      <AssetList />
    </AppShell>
  );
}
