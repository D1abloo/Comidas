import type { Order } from './types.js';
import type { Store } from './db.js';
import type { SessionUser } from './auth.js';

export function upsertCourierLocation(
  store: Store,
  courier: SessionUser,
  payload: { lat: number; lng: number; accuracy_m?: number | null; active_order_id?: string | null },
) {
  const now = new Date().toISOString();
  let activeOrder: Order | undefined;
  if (payload.active_order_id) {
    activeOrder = store.orders.find((o) => o.id === payload.active_order_id);
    if (activeOrder && activeOrder.courier_id && activeOrder.courier_id !== courier.id) {
      activeOrder = undefined;
    }
  }

  const entry = {
    courier_id: courier.id,
    courier_name: courier.full_name,
    lat: payload.lat,
    lng: payload.lng,
    accuracy_m: payload.accuracy_m ?? null,
    active_order_id: activeOrder?.id ?? null,
    active_order_number: activeOrder?.number ?? null,
    updated_at: now,
  };

  const idx = store.courier_locations.findIndex((l) => l.courier_id === courier.id);
  if (idx >= 0) store.courier_locations[idx] = entry;
  else store.courier_locations.push(entry);

  if (activeOrder) {
    activeOrder.courier_lat = payload.lat;
    activeOrder.courier_lng = payload.lng;
    activeOrder.courier_location_at = now;
  }
}

export function getActiveCourierLocations(store: Store, maxAgeMs = 10 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  return store.courier_locations.filter((l) => new Date(l.updated_at).getTime() >= cutoff);
}
