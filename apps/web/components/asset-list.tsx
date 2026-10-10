'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AssetResponse, ApiErrorResponse } from '../lib/api';

interface AssetListResponse {
  data: AssetResponse[];
  requestId: string;
}

function riskClass(score: number): string {
  if (score >= 75) return 'risk-high';
  if (score >= 45) return 'risk-watch';
  return 'risk-low';
}

function riskLabel(score: number): string {
  if (score >= 75) return 'High';
  if (score >= 45) return 'Watch';
  return 'Low';
}

function formatDate(value: string | null): string {
  if (value === null) return 'Not processed';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function AssetSectionHeading({ count }: { count: number | undefined }): React.ReactElement {
  return (
    <div className="asset-heading">
      <div className="section-heading">
        <p className="eyebrow">Area registry <span aria-hidden="true">/</span> API data</p>
        <h2 id="asset-list-title">Monitored assets</h2>
        <p className="panel-caption">Areas of interest saved to this workspace.</p>
      </div>
      {count !== undefined && <span className="asset-count mono">{count.toString().padStart(2, '0')} records</span>}
    </div>
  );
}

export function AssetList(): React.ReactElement {
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/assets', { headers: { accept: 'application/json' } })
      .then(async (response) => {
        const body = await response.json() as AssetListResponse | ApiErrorResponse;
        if (!response.ok) throw new Error('error' in body ? body.error.message : 'Unable to load assets');
        if (active) setAssets((body as AssetListResponse).data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load assets');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="asset-section" id="assets" aria-labelledby="asset-list-title">
      <AssetSectionHeading count={loading || error !== null ? undefined : assets.length} />
      {loading && <p className="loading-state" aria-live="polite">Loading monitored assets…</p>}
      {error !== null && (
        <div className="error-state" role="alert">
          <strong>Asset feed unavailable</strong>
          <span>{error}</span>
        </div>
      )}
      {!loading && error === null && assets.length === 0 && (
        <div className="empty-state">
          <strong>No monitored assets yet</strong>
          <p>Create an area of interest to start building the workspace registry.</p>
          <Link className="text-link" href="/assets/new">Add the first monitored asset</Link>
        </div>
      )}
      {!loading && error === null && assets.length > 0 && (
        <div className="asset-table-wrap">
          <table className="asset-table">
            <caption className="sr-only">Monitored satellite assets</caption>
            <thead>
              <tr>
                <th scope="col">Asset</th>
                <th scope="col">Risk score</th>
                <th scope="col">Processing status</th>
                <th scope="col">Last processed</th>
                <th scope="col">Refresh frequency</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-name">{asset.assetName}</div>
                    <span className="asset-id">{asset.id}</span>
                  </td>
                  <td>
                    <span className={`risk ${riskClass(asset.riskScore)}`}>
                      <span className="risk-bar" aria-hidden="true">
                        <span style={{ width: `${Math.max(0, Math.min(100, asset.riskScore))}%` }} />
                      </span>
                      <span className="risk-label">{riskLabel(asset.riskScore)}</span>
                      <span className="risk-score">{asset.riskScore.toFixed(1)}</span>
                      <span className="sr-only">out of 100</span>
                    </span>
                  </td>
                  <td><span className={`status-text ${asset.processingStatus}`}>{asset.processingStatus}</span></td>
                  <td className="panel-caption">{formatDate(asset.lastProcessedAt)}</td>
                  <td className="panel-caption">Every {asset.refreshFrequencyDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
