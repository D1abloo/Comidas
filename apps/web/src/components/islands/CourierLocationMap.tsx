import { useEffect, useRef } from 'react';
import {
  formatLocationAge,
  googleMapsUrl,
  isLocationStale,
  osmExternalUrl,
} from '../../lib/courier-location-utils';

type LeafletModule = typeof import('leaflet');

function LiveMap({ lat, lng, height }: { lat: number; lng: number; height: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    let ro: ResizeObserver | null = null;
    let cancelled = false;

    void (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !hostRef.current) return;

      leafletRef.current = L;
      const pin = L.divIcon({
        className: 'courier-map-pin',
        html: '<span class="courier-map-pin-dot" aria-hidden="true"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const map = L.map(hostRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      markerRef.current = L.marker([lat, lng], { icon: pin }).addTo(map);
      mapRef.current = map;

      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(hostRef.current);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      leafletRef.current = null;
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
        {!stale && updatedAt && <span className="courier-loc-live">En vivo</span>}
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
