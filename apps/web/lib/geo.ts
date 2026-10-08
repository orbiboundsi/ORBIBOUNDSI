import type { GeoJsonPolygon } from '@orbibound-ai/backend';

export function polygonToWkt(polygon: GeoJsonPolygon): string {
  const ring = polygon.coordinates[0] ?? [];
  const points = ring.map((point) => `${point[0] ?? 0} ${point[1] ?? 0}`).join(', ');
  return `POLYGON((${points}))`;
}
