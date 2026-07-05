import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function formatLocationAge(iso: string) {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function isLocationStale(iso: string | null | undefined, maxSec = 300) {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > maxSec * 1000;
}

export function osmExternalUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

const courierPin = L.divIcon({
  className: 'courier-map-pin',
  html: '<span class="courier-map-pin-dot" aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function LiveMap({ lat, lng, height }: { lat: number; lng: number; height: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerRef.current = L.marker([lat, lng], { icon: courierPin }).addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.panTo([lat, lng], { animate: true, duration: 0.45 });
  }, [lat, lng]);

  return <div ref={hostRef} className="courier-loc-leaflet" style={{ height }} aria-hidden />;
}

interface MapProps {
  lat: number;
  lng: number;
  label?: string;
  updatedAt?: string | null;
  accuracy_m?: number | null;
  compact?: boolean;
}

export function CourierLocationMap({ lat, lng, label, updatedAt, accuracy_m, compact }: MapProps) {
  const stale = isLocationStale(updatedAt);
  const h = compact ? 180 : 240;

  return (
    <div className="courier-loc-map">
      {label && <p className="courier-loc-label">{label}</p>}
      <div className="courier-loc-frame">
        <LiveMap lat={lat} lng={lng} height={h} />
        {stale && <span className="courier-loc-stale">Sin señal reciente</span>}
        {!stale && updatedAt && (
          <span className="courier-loc-live">En vivo</span>
        )}
      </div>
      <div className="courier-loc-meta">
        <span className="font-mono text-xs">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
        {updatedAt && (
          <span className={stale ? 'text-amber-600' : 'text-emerald-700'}>
            · {formatLocationAge(updatedAt)}
          </span>
        )}
        {accuracy_m != null && accuracy_m > 0 && (
          <span className="text-bocado-mute"> · ±{Math.round(accuracy_m)} m</span>
        )}
      </div>
      <div className="courier-loc-links">
        <a href={googleMapsUrl(lat, lng)} target="_blank" rel="noopener noreferrer" className="courier-loc-link">
          Google Maps
        </a>
        <a href={osmExternalUrl(lat, lng)} target="_blank" rel="noopener noreferrer" className="courier-loc-link">
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}
