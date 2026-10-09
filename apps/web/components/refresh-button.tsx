'use client';
export function RefreshButton(): React.ReactElement { return <button className="button" type="button" onClick={() => window.location.reload()}>Refresh data</button>; }
