import type { VexEvent } from '../types/vex';

export interface Coords {
  lat: number;
  lng: number;
}

/** Great-circle distance in kilometers between two coordinates. */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function eventCoords(e: VexEvent): Coords | null {
  const c = e.location?.coordinates;
  if (c && typeof c.lat === 'number' && typeof c.lon === 'number') {
    return { lat: c.lat, lng: c.lon };
  }
  return null;
}

export interface EventWithDistance {
  event: VexEvent;
  distanceKm: number | null;
}

export function sortEventsByDistance(
  events: VexEvent[],
  origin: Coords | null,
): EventWithDistance[] {
  const withDist = events.map((event) => {
    const c = eventCoords(event);
    const distanceKm = origin && c ? haversineKm(origin, c) : null;
    return { event, distanceKm };
  });
  return withDist.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
    if (a.distanceKm != null) return -1;
    if (b.distanceKm != null) return 1;
    return new Date(a.event.start).getTime() - new Date(b.event.start).getTime();
  });
}

export function formatDistance(km: number | null): string {
  if (km == null) return '';
  if (km < 1) return '<1 km';
  return `${Math.round(km)} km`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
