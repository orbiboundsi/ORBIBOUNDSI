'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map, MapMouseEvent } from 'maplibre-gl';

interface AoiMapEditorProps {
  onPolygonChange: (value: string) => void;
}

type Position = [number, number];

function featureData(points: Position[], closed: boolean): GeoJSON.FeatureCollection {
  const first = points[0];
  const line = closed && points.length > 2 && first !== undefined ? [...points, first] : points;
  const features: GeoJSON.Feature[] = [];

  if (line.length >= 2) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: line },
    });
  }

  if (closed && points.length > 2 && first !== undefined) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[...points, first]] },
    });
  }

  return { type: 'FeatureCollection', features };
}

function polygonJson(points: Position[]): string {
  const first = points[0];
  if (first === undefined) throw new Error('At least one AOI point is required');
  return JSON.stringify({ type: 'Polygon', coordinates: [[...points, first]] });
}

export function AoiMapEditor({ onPolygonChange }: AoiMapEditorProps): React.ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const closedRef = useRef(false);
  const [points, setPoints] = useState<Position[]>([]);
  const [closed, setClosed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let disposed = false;

    void import('maplibre-gl')
      .then(({ Map: MapLibreMap }) => {
        if (disposed || container.current === null) return;

        try {
          const map = new MapLibreMap({
            container: container.current,
            style: 'https://demotiles.maplibre.org/style.json',
            center: [67.03, 24.88],
            zoom: 10,
          });
          mapRef.current = map;

          map.on('load', () => {
            if (disposed) return;
            map.addSource('aoi-editor', { type: 'geojson', data: featureData([], false) });
            map.addLayer({
              id: 'aoi-fill',
              type: 'fill',
              source: 'aoi-editor',
              filter: ['==', '$type', 'Polygon'],
              paint: { 'fill-color': '#f0f0fa', 'fill-opacity': 0.18 },
            });
            map.addLayer({
              id: 'aoi-line',
              type: 'line',
              source: 'aoi-editor',
              paint: { 'line-color': '#f0f0fa', 'line-width': 2 },
            });
            setMapError(false);
            setReady(true);
          });

          map.on('error', () => {
            if (!disposed && !map.isStyleLoaded()) setMapError(true);
          });

          const handleClick = (event: MapMouseEvent): void => {
            if (!closedRef.current) setPoints((current) => [...current, [event.lngLat.lng, event.lngLat.lat]]);
          };
          map.on('click', handleClick);
        } catch {
          if (!disposed) setMapError(true);
        }
      })
      .catch(() => {
        if (!disposed) setMapError(true);
      });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    closedRef.current = closed;
  }, [closed]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !ready) return;
    const source = map.getSource('aoi-editor') as { setData: (data: GeoJSON.FeatureCollection) => void } | undefined;
    source?.setData(featureData(points, closed));
  }, [points, closed, ready]);

  function complete(): void {
    if (points.length < 3) return;
    setClosed(true);
    onPolygonChange(polygonJson(points));
  }

  function reset(): void {
    setPoints([]);
    setClosed(false);
    onPolygonChange('');
  }

  return (
    <div className="aoi-editor">
      <div ref={container} className="aoi-map" aria-label="Interactive area of interest map">
        {mapError && (
          <div className="map-fallback" role="status">
            <strong>Interactive map unavailable</strong>
            <span>Use the GeoJSON field below to define the area of interest.</span>
          </div>
        )}
      </div>
      <div className="aoi-toolbar">
        <div>
          <strong>{closed ? 'AOI polygon complete' : mapError ? 'GeoJSON entry available below' : 'Click the map to add points'}</strong>
          <span>{points.length} point{points.length === 1 ? '' : 's'}{!closed && points.length < 3 && !mapError ? ' · add at least 3' : ''}</span>
        </div>
        <div className="aoi-actions">
          <button className="button" type="button" onClick={reset} disabled={points.length === 0}>Reset</button>
          <button className="button button-primary" type="button" onClick={complete} disabled={closed || points.length < 3}>
            {closed ? 'Completed' : 'Complete polygon'}
          </button>
        </div>
      </div>
    </div>
  );
}
