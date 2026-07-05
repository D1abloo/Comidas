import type { Address } from './types.js';

/** Distancia en metros entre dos puntos WGS84. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export async function geocodeAddress(address: Address): Promise<{ lat: number; lng: number } | null> {
  const q = [address.street, address.number, address.postal_code, address.city, address.country]
    .filter(Boolean)
    .join(', ');
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'BocadO-Delivery/1.0 (demo)' } });
    if (!r.ok) return null;
    const data = (await r.json()) as { lat: string; lon: string }[];
    if (!data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}
