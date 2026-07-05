export function osmStaticMapUrl(lat: number, lng: number, w = 400, h = 220) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=${w}x${h}&markers=${lat},${lng},red`;
}

export function osmExternalUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

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
  const h = compact ? 160 : 220;

  return (
    <div className="courier-loc-map">
      {label && <p className="courier-loc-label">{label}</p>}
      <div className="courier-loc-frame">
        <img
          src={osmStaticMapUrl(lat, lng, 400, h)}
          alt={`Ubicación en mapa: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          className="courier-loc-img"
          loading="lazy"
        />
        {stale && (
          <span className="courier-loc-stale">Sin señal reciente</span>
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
