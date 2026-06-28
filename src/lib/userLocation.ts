import { ProfileService } from '../services/api';

export interface PlaceInfo {
  city: string;
  state: string;
  country: string;
}

export interface UserCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PendingLocation {
  coords?: UserCoords;
  place?: PlaceInfo;
}

export const PENDING_LOCATION_KEY = 'ssb_pending_location';
export const LOCATION_SKIP_KEY = 'ssb_location_skipped';

export function geolocationErrorMessage(): string | null {
  if (!navigator.geolocation) {
    return 'GPS is not supported on this device.';
  }
  if (!window.isSecureContext) {
    return 'Location needs HTTPS on mobile. Run npm run dev:mobile and open https://YOUR-PC-IP:5173';
  }
  return null;
}

export function getCurrentPosition(timeoutMs = 15000): Promise<UserCoords> {
  const blocked = geolocationErrorMessage();
  if (blocked) return Promise.reject(new Error(blocked));

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => reject(new Error(err.message || 'Location permission denied.')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceInfo | null> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('localityLanguage', 'en');

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      '';
    const state = data.principalSubdivision || data.locality || '';
    const country = data.countryName || 'India';

    if (!city && !state) return null;
    return { city, state, country };
  } catch {
    return null;
  }
}

export function stashPendingLocation(pending: PendingLocation) {
  sessionStorage.setItem(PENDING_LOCATION_KEY, JSON.stringify(pending));
}

export function readPendingLocation(): PendingLocation | null {
  try {
    const raw = sessionStorage.getItem(PENDING_LOCATION_KEY);
    return raw ? (JSON.parse(raw) as PendingLocation) : null;
  } catch {
    return null;
  }
}

export function clearPendingLocation() {
  sessionStorage.removeItem(PENDING_LOCATION_KEY);
}

export function markLocationSkipped() {
  localStorage.setItem(LOCATION_SKIP_KEY, '1');
}

export function wasLocationSkipped(): boolean {
  return localStorage.getItem(LOCATION_SKIP_KEY) === '1';
}

export async function saveLocationToProfile(coords: UserCoords, place?: PlaceInfo) {
  const payload: Record<string, string | number> = {
    latitude: Number(coords.latitude.toFixed(6)),
    longitude: Number(coords.longitude.toFixed(6)),
  };
  if (place?.city) payload.city = place.city;
  if (place?.state) payload.state = place.state;
  if (place?.country) payload.country = place.country;

  await ProfileService.updateMe(payload);
  localStorage.removeItem(LOCATION_SKIP_KEY);
}

export async function profileHasCoordinates(): Promise<boolean> {
  try {
    const res = await ProfileService.getMe();
    const { latitude, longitude } = res.data;
    return latitude != null && longitude != null && latitude !== '' && longitude !== '';
  } catch {
    return false;
  }
}

export async function applyPendingLocation(): Promise<boolean> {
  const pending = readPendingLocation();
  if (!pending) return false;
  try {
    if (pending.coords) {
      await saveLocationToProfile(pending.coords, pending.place);
    } else if (pending.place) {
      await ProfileService.updateMe({
        city: pending.place.city,
        state: pending.place.state,
        country: pending.place.country,
      });
    } else {
      return false;
    }
    clearPendingLocation();
    return true;
  } catch {
    return false;
  }
}

/** Request GPS, reverse-geocode, and save to the logged-in user's profile. */
export async function captureAndSaveUserLocation(): Promise<{
  coords: UserCoords;
  place: PlaceInfo | null;
}> {
  const coords = await getCurrentPosition();
  const place = await reverseGeocode(coords.latitude, coords.longitude);
  await saveLocationToProfile(coords, place ?? undefined);
  return { coords, place };
}
