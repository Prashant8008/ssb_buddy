/** Approximate centroids for common aspirant / SSB board cities in India */
const CITY_COORDS: Record<string, [number, number]> = {
  dehradun: [30.3165, 78.0322],
  prayagraj: [25.4358, 81.8463],
  allahabad: [25.4358, 81.8463],
  bhopal: [23.2599, 77.4126],
  mysore: [12.2958, 76.6394],
  mysuru: [12.2958, 76.6394],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  varanasi: [25.3176, 82.9739],
  kolkata: [22.5726, 88.3639],
  delhi: [28.6139, 77.209],
  'new delhi': [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
  guwahati: [26.1445, 91.7362],
  visakhapatnam: [17.6868, 83.2185],
  kochi: [9.9312, 76.2673],
  indore: [22.7196, 75.8577],
  nagpur: [21.1458, 79.0882],
};

function jitter([lat, lng]: [number, number], seed: number): [number, number] {
  const n = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
  const m = (((seed + 7) * 8121 + 28411) % 233280) / 233280 - 0.5;
  return [lat + n * 0.08, lng + m * 0.08];
}

export function getProfileCoords(
  profile: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    city?: string;
  },
  userId?: number
): [number, number] | null {
  if (profile.latitude != null && profile.longitude != null) {
    const lat = Number(profile.latitude);
    const lng = Number(profile.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }

  if (profile.city) {
    const key = profile.city.toLowerCase().trim();
    const coords = CITY_COORDS[key];
    if (coords) return userId != null ? jitter(coords, userId) : coords;
  }

  return null;
}

/** Default map center — Dehradun (major SSB hub) */
export const DEFAULT_MAP_CENTER: [number, number] = [30.3165, 78.0322];
