import { useEffect, useState } from 'react';
import { CourierLocationMap } from './CourierLocationMap';
import { customerOrderLabel } from './order-shared';

export interface CustomerTracking {
  status: string;
  status_label: string;
  en_reparto: boolean;
  courier_name: string | null;
  courier_near: boolean;
  distance_m: number | null;
  distance_label: string | null;
  show_courier_map: boolean;
  courier_lat: number | null;
  courier_lng: number | null;
  courier_location_at: string | null;
}

interface Props {
  orderId: string;
  orderStatus: string;
  courierAcceptedAt?: string | null;
  compact?: boolean;
  accessToken?: string;
}

export default function CustomerLiveDelivery({
  orderId,
  orderStatus,
  courierAcceptedAt,
  compact,
  accessToken,
}: Props) {
  const [tracking, setTracking] = useState<CustomerTracking | null>(null);

  useEffect(() => {
    if (orderStatus !== 'delivering') return;

    let cancelled = false;
    async function poll() {
      try {
        const q = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
        const r = await fetch(`/api/orders/${orderId}/tracking${q}`);
        if (!r.ok) return;
        const data = await r.json();
        if (!cancelled) setTracking(data.tracking ?? null);
      } catch {
        /* ignore */
      }
    }

    void poll();
    const id = window.setInterval(poll, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, orderStatus, accessToken]);

  const label = tracking?.status_label ?? customerOrderLabel({
    status: orderStatus as 'delivering',
    courier_accepted_at: courierAcceptedAt,
  });

  if (orderStatus !== 'delivering') return null;

  return (
    <div className={`customer-live ${compact ? 'customer-live--compact' : ''}`}>
      <div className="customer-live-head">
        <span className="customer-live-pulse" aria-hidden />
        <div>
          <p className="customer-live-kicker">Seguimiento en vivo</p>
          <p className="customer-live-status">{label}</p>
          {tracking?.en_reparto && tracking.courier_name && (
            <p className="customer-live-courier">{tracking.courier_name} lleva tu pedido</p>
          )}
        </div>
      </div>

      {tracking?.en_reparto && !tracking.courier_near && (
        <p className="customer-live-hint">
          Te avisamos en el mapa cuando el repartidor esté cerca de tu domicilio.
        </p>
      )}

      {tracking?.courier_near && tracking.distance_label && (
        <p className="customer-live-near">
          ¡Tu repartidor está cerca! · aprox. {tracking.distance_label}
        </p>
      )}

      {tracking?.show_courier_map && tracking.courier_lat != null && tracking.courier_lng != null && (
        <CourierLocationMap
          lat={tracking.courier_lat}
          lng={tracking.courier_lng}
          label="Ubicación del repartidor"
          updatedAt={tracking.courier_location_at}
          compact={compact}
        />
      )}
    </div>
  );
}
