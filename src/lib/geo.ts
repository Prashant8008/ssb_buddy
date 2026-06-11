export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrackPoint extends LatLng {
  timestamp: number;
  accuracy?: number;
}

const EARTH_RADIUS_M = 6371000;

/** Distance in meters between two coordinates (Haversine) */
export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Total route length in meters */
export function routeDistance(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

/** Bearing in degrees 0–360 from point A to B */
export function bearing(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function bearingToDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Pace as min:sec per km; returns "--:--" if distance too small */
export function formatPace(distanceM: number, elapsedSec: number): string {
  if (distanceM < 20 || elapsedSec < 1) return '--:--';
  const km = distanceM / 1000;
  const paceSecPerKm = elapsedSec / km;
  const min = Math.floor(paceSecPerKm / 60);
  const sec = Math.round(paceSecPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatSpeedKmh(distanceM: number, elapsedSec: number): string {
  if (elapsedSec < 1) return '0.0';
  const kmh = (distanceM / 1000) / (elapsedSec / 3600);
  return kmh.toFixed(1);
}

export const SSB_RUN_TARGET_KM = 2.4;

export interface RouteMarker {
  distanceM: number;
  lat: number;
  lng: number;
  label: string;
  kind: 'start' | 'split' | 'current';
}

/** Lat/lng at a given distance (meters) along a polyline */
export function pointAtDistance(points: LatLng[], targetM: number): LatLng | null {
  if (points.length === 0) return null;
  if (targetM <= 0) return points[0];

  let accumulated = 0;
  for (let i = 1; i < points.length; i++) {
    const segLen = haversine(points[i - 1], points[i]);
    if (accumulated + segLen >= targetM) {
      const ratio = (targetM - accumulated) / segLen;
      return {
        lat: points[i - 1].lat + ratio * (points[i].lat - points[i - 1].lat),
        lng: points[i - 1].lng + ratio * (points[i].lng - points[i - 1].lng),
      };
    }
    accumulated += segLen;
  }
  return points[points.length - 1];
}

/** Markers at start, each split interval, and current end of completed route */
export function getDistanceMarkers(
  points: LatLng[],
  totalM: number,
  intervalM = 400
): RouteMarker[] {
  if (points.length === 0) return [];

  const markers: RouteMarker[] = [
    {
      distanceM: 0,
      lat: points[0].lat,
      lng: points[0].lng,
      label: 'START',
      kind: 'start',
    },
  ];

  for (let d = intervalM; d < totalM; d += intervalM) {
    const pt = pointAtDistance(points, d);
    if (pt) {
      markers.push({
        distanceM: d,
        lat: pt.lat,
        lng: pt.lng,
        label: d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${d} m`,
        kind: 'split',
      });
    }
  }

  if (totalM > 20 && points.length >= 2) {
    const end = points[points.length - 1];
    markers.push({
      distanceM: totalM,
      lat: end.lat,
      lng: end.lng,
      label: formatDistance(totalM),
      kind: 'current',
    });
  }

  return markers;
}
