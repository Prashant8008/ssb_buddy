import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, getProfileCoords } from '../../lib/cityCoords';
import { MapInvalidateSize } from './MapInvalidateSize';

import 'leaflet/dist/leaflet.css';

// Custom HTML/SVG shield markers matching ssb connect mockup
const standardShieldIcon = L.divIcon({
  className: 'custom-map-shield-standard',
  html: `
    <div class="relative flex items-center justify-center w-8 h-10">
      <div class="shield-pin absolute inset-0 bg-[#0F1C3F] border-2 border-[#C9A84C] shadow-lg"></div>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="white" class="relative z-10 translate-y-[-2px]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

const selectedShieldIcon = L.divIcon({
  className: 'custom-map-shield-selected',
  html: `
    <div class="relative flex items-center justify-center w-8 h-10 animate-pulse-gold">
      <div class="shield-pin absolute inset-0 bg-[#C9A84C] border-2 border-white shadow-xl"></div>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="#0F1C3F" class="relative z-10 translate-y-[-2px]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

export interface MapProfile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  city: string;
  state: string;
  entry_type: string;
  ssb_board: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface PlottedProfile extends MapProfile {
  coords: [number, number];
}

interface DiscoverMapProps {
  profiles: MapProfile[];
  selectedUserId: number | null;
  onSelect: (userId: number) => void;
  userPosition?: { latitude: number; longitude: number } | null;
}

const userIcon = L.divIcon({
  className: 'discover-user-marker',
  html: '<div class="discover-user-marker-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FlyToSelected({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 11, { duration: 0.8 });
  }, [coords, map]);
  return null;
}

function FitAllMarkers({
  profiles,
  userPosition,
}: {
  profiles: PlottedProfile[];
  userPosition?: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = profiles.map((p) => p.coords);
    if (userPosition) {
      points.push([userPosition.latitude, userPosition.longitude]);
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [profiles, userPosition, map]);
  return null;
}

const displayName = (user: MapProfile['user']) =>
  user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;

const DiscoverMap: React.FC<DiscoverMapProps> = ({
  profiles,
  selectedUserId,
  onSelect,
  userPosition = null,
}) => {
  const plotted = useMemo(
    () =>
      profiles
        .map((p) => {
          const coords = getProfileCoords(p, p.user.id);
          return coords ? { ...p, coords } : null;
        })
        .filter(Boolean) as PlottedProfile[],
    [profiles]
  );

  const selectedCoords = useMemo(() => {
    const found = plotted.find((p) => p.user.id === selectedUserId);
    return found?.coords ?? null;
  }, [plotted, selectedUserId]);

  const center = useMemo((): [number, number] => {
    if (userPosition) return [userPosition.latitude, userPosition.longitude];
    if (plotted.length > 0) return plotted[0].coords;
    return DEFAULT_MAP_CENTER;
  }, [userPosition, plotted]);

  return (
    <MapContainer
      center={center}
      zoom={6}
      className="h-full w-full z-0"
      style={{ minHeight: 240 }}
      scrollWheelZoom
    >
      <MapInvalidateSize />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {selectedUserId ? (
        <FlyToSelected coords={selectedCoords} />
      ) : (
        <FitAllMarkers profiles={plotted} userPosition={userPosition} />
      )}

      {userPosition && (
        <Marker
          position={[userPosition.latitude, userPosition.longitude]}
          icon={userIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <p className="text-sm font-bold text-navy-900">You are here</p>
          </Popup>
        </Marker>
      )}

      {plotted.map((p) => {
        const isSelected = p.user.id === selectedUserId;
        return (
          <Marker
            key={p.id}
            position={p.coords}
            icon={isSelected ? selectedShieldIcon : standardShieldIcon}
            eventHandlers={{
              click: () => onSelect(p.user.id),
            }}
          >
            <Popup>
              <div className="min-w-[140px]">
                <p className="font-bold text-sm text-navy-900">{displayName(p.user)}</p>
                <p className="text-xs text-navy-500">@{p.user.username}</p>
                {(p.city || p.entry_type) && (
                  <p className="text-xs text-navy-600 mt-1">
                    {[p.entry_type && `${p.entry_type}`, p.city].filter(Boolean).join(' · ')}
                  </p>
                )}
                <Link
                  to={`/profile/${p.user.username}`}
                  className="text-xs font-bold text-gold-600 hover:underline mt-2 inline-block"
                >
                  View profile →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DiscoverMap;
