import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, getProfileCoords } from '../../lib/cityCoords';
import { MapInvalidateSize } from './MapInvalidateSize';

import 'leaflet/dist/leaflet.css';

// Fix default marker icons with Vite bundler
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
            icon={isSelected ? selectedIcon : markerIcon}
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
