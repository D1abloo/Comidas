import { useCallback, useEffect, useState } from 'react';
import { formatLocationAge, isLocationStale } from '../../lib/courier-location-utils';
import { CourierLocationMap } from './CourierLocationMap';
import { onMobileSync } from '../../lib/mobile-sync';
import { onOrdersChanged, useOrderStream } from '../../lib/order-stream';

const POLL_MS = 5000;

interface CourierLoc {
  courier_id: string;
  courier_name: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
  active_order_id?: string | null;
  active_order_number?: string | null;
  updated_at: string;
}

interface OrderLoc {
  id: string;
  number: string;
  courier_name?: string | null;
  lat: number;
  lng: number;
  location_at?: string | null;
  customer_name: string;
}

export default function CourierLivePanel() {
  const [locations, setLocations] = useState<CourierLoc[]>([]);
  const [orders, setOrders] = useState<OrderLoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useOrderStream(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/courier-locations', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar el mapa.');
      setLocations(data.locations ?? []);
      setOrders(data.orders ?? []);
      setError('');
    } catch {
      setError('No se pudo actualizar la ubicación. Reintenta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, POLL_MS);
    const offSync = onMobileSync(() => void load());
    const offStream = onOrdersChanged(() => void load());
    return () => {
      window.clearInterval(id);
      offSync();
      offStream();
    };
  }, [load]);

  const active = locations.length > 0 || orders.length > 0;
  if (!active) {
    return (
      <div className="admin-frame p-4 text-sm text-bocado-mute">
        <span className="font-semibold text-bocado-ink">📍 Repartidores en vivo</span>
        <p className="mt-1">
          {loading
            ? 'Consultando ubicaciones…'
            : error || 'Ningún repartidor con GPS activo. La ubicación aparece cuando abren la app de repartidor.'}
        </p>
        {!loading && error && (
          <button type="button" className="btn-ghost text-xs mt-3" onClick={() => void load()}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="admin-frame overflow-hidden">
      <div className="admin-frame-header">
        <div>
          <h3 className="admin-frame-title">📍 Repartidores en vivo</h3>
          <p className="admin-frame-sub">Ubicación GPS desde la app · actualización cada 5 s</p>
        </div>
        <span className="chip text-xs !bg-emerald-100 !text-emerald-800 !border-emerald-200">
          {locations.length} en línea
        </span>
      </div>
      {error && (
        <div className="mx-4 mt-4 admin-action-message admin-action-message--error" role="alert">
          {error}{' '}
          <button type="button" className="underline font-semibold" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      )}
      <div className="p-4 grid gap-4 lg:grid-cols-2">
        {locations.map((loc) => {
          const stale = isLocationStale(loc.updated_at);
          return (
            <div key={loc.courier_id} className="rounded-xl border border-bocado-line bg-bocado-paper/40 overflow-hidden">
              <div className="p-3 border-b border-bocado-line/60 bg-white/50">
                <p className="font-semibold text-sm">{loc.courier_name}</p>
                <p className="text-xs text-bocado-mute mt-0.5">
                  {loc.active_order_number ? `Pedido ${loc.active_order_number}` : 'Sin pedido activo'}
                  {' · '}
                  <span className={stale ? 'text-amber-700' : 'text-emerald-700'}>
                    {formatLocationAge(loc.updated_at)}
                  </span>
                </p>
              </div>
              <div className="px-3 py-3">
                <CourierLocationMap
                  lat={loc.lat}
                  lng={loc.lng}
                  updatedAt={loc.updated_at}
                  accuracy_m={loc.accuracy_m}
                  compact
                />
                {loc.active_order_id && (
                    <a href="/movil/admin" className="courier-loc-link mt-2 inline-block">
                    Ver pedido en cola →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { OrderCourierLocation } from './OrderCourierLocation';
