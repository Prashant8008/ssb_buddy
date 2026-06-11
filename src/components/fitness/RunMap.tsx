import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  TrackPoint,
  formatDistance,
  getDistanceMarkers,
  SSB_RUN_TARGET_KM,
} from '../../lib/geo';
import { DEFAULT_MAP_CENTER } from '../../lib/cityCoords';

interface RunMapProps {
  points: TrackPoint[];
  heading: number;
  distanceM: number;
  followUser?: boolean;
  showDistanceOverlay?: boolean;
}

function createRunnerIcon(headingDeg: number) {
  return L.divIcon({
    className: 'run-runner-marker',
    html: `
      <div style="
        width: 40px; height: 40px;
        transform: rotate(${headingDeg}deg);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: 0; height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 22px solid #1e3a5f;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function createStartIcon() {
  return L.divIcon({
    className: 'run-start-marker',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        font-size: 8px; font-weight: 800; color: white;
      ">S</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createSplitIcon(label: string, isCurrent: boolean) {
  return L.divIcon({
    className: 'run-split-marker',
    html: `
      <div style="
        min-width: ${isCurrent ? 52 : 36}px;
        padding: 2px 6px;
        background: ${isCurrent ? '#1e3a5f' : 'white'};
        color: ${isCurrent ? 'white' : '#1e3a5f'};
        border: 2px solid ${isCurrent ? '#22c55e' : '#22c55e'};
        border-radius: 999px;
        font-size: ${isCurrent ? 10 : 9}px;
        font-weight: 800;
        text-align: center;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      ">${label}</div>
    `,
    iconSize: [isCurrent ? 52 : 36, 20],
    iconAnchor: [isCurrent ? 26 : 18, 10],
  });
}

function FollowRunner({ position, active }: { position: [number, number] | null; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active && position) {
      map.panTo(position, { animate: true, duration: 0.4 });
    }
  }, [position, active, map]);
  return null;
}

function FitRoute({ points }: { points: TrackPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) {
      if (points.length === 1) map.setView([points[0].lat, points[0].lng], 17);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
  }, [points.length, map]);
  return null;
}

const RunMap: React.FC<RunMapProps> = ({
  points,
  heading,
  distanceM,
  followUser = true,
  showDistanceOverlay = true,
}) => {
  const routeCoords: [number, number][] = points.map((p) => [p.lat, p.lng]);
  const last = points[points.length - 1];
  const center: [number, number] = last ? [last.lat, last.lng] : DEFAULT_MAP_CENTER;

  const markers = useMemo(
    () => getDistanceMarkers(points, distanceM, 400),
    [points, distanceM]
  );

  const progressPct = Math.min(100, (distanceM / 1000 / SSB_RUN_TARGET_KM) * 100);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={17} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routeCoords.length >= 2 && (
          <>
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#14532d', weight: 8, opacity: 0.25 }}
            />
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.9 }}
            />
          </>
        )}

        {markers.map((m) => {
          if (m.kind === 'current') return null;
          const icon =
            m.kind === 'start'
              ? createStartIcon()
              : createSplitIcon(m.label, false);
          return (
            <Marker
              key={`${m.kind}-${m.distanceM}`}
              position={[m.lat, m.lng]}
              icon={icon}
              zIndexOffset={m.kind === 'start' ? 500 : 400}
            >
              <Tooltip permanent direction="top" offset={[0, -8]} className="run-map-tooltip">
                {m.kind === 'start' ? 'Start' : m.label}
              </Tooltip>
            </Marker>
          );
        })}

        {last && (
          <Marker
            position={[last.lat, last.lng]}
            icon={createRunnerIcon(heading)}
            zIndexOffset={1000}
          />
        )}

        {followUser && last ? (
          <FollowRunner position={[last.lat, last.lng]} active={followUser} />
        ) : (
          <FitRoute points={points} />
        )}
      </MapContainer>

      {showDistanceOverlay && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2">
          <div className="rounded-2xl bg-navy-900/90 px-5 py-3 text-center text-white shadow-xl backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-wide text-green-400">
              Distance completed
            </p>
            <p className="font-display text-2xl font-bold leading-tight">
              {formatDistance(distanceM)}
            </p>
            <p className="mt-1 text-[10px] text-navy-300">
              {progressPct.toFixed(0)}% of {SSB_RUN_TARGET_KM} km
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunMap;
