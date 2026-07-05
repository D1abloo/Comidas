import type { Order } from './types.js';
import { distanceMeters, formatDistance } from './geo.js';
import { statusLabel } from './format.js';

/** Umbral: el cliente ve al repartidor en mapa cuando está a ~2 km o menos. */
export const CUSTOMER_NEAR_DELIVERY_M = 2000;

export function customerOrderLabel(order: Pick<Order, 'status' | 'courier_accepted_at'>): string {
  if (order.status === 'delivering' && order.courier_accepted_at) return 'En reparto';
  return statusLabel(order.status);
}

export function isOrderEnReparto(order: Pick<Order, 'status' | 'courier_accepted_at'>): boolean {
  return order.status === 'delivering' && Boolean(order.courier_accepted_at);
}

export function courierDistanceToDelivery(order: Order): number | null {
  const lat = order.delivery_address.lat;
  const lng = order.delivery_address.lng;
  if (lat == null || lng == null || order.courier_lat == null || order.courier_lng == null) return null;
  return distanceMeters(order.courier_lat, order.courier_lng, lat, lng);
}

export function isCourierNearCustomer(order: Order): boolean {
  const d = courierDistanceToDelivery(order);
  return d != null && d <= CUSTOMER_NEAR_DELIVERY_M;
}

export function buildCustomerTracking(order: Order) {
  const enReparto = isOrderEnReparto(order);
  const distance_m = enReparto ? courierDistanceToDelivery(order) : null;
  const courier_near = enReparto && isCourierNearCustomer(order);
  const show_map =
    courier_near &&
    order.courier_lat != null &&
    order.courier_lng != null &&
    !isLocationStale(order.courier_location_at);

  return {
    status: order.status,
    status_label: customerOrderLabel(order),
    en_reparto: enReparto,
    courier_name: order.courier_name ?? null,
    courier_near,
    distance_m,
    distance_label: distance_m != null ? formatDistance(distance_m) : null,
    show_courier_map: show_map,
    courier_lat: show_map ? order.courier_lat : null,
    courier_lng: show_map ? order.courier_lng : null,
    courier_location_at: order.courier_location_at ?? null,
    delivery_lat: order.delivery_address.lat ?? null,
    delivery_lng: order.delivery_address.lng ?? null,
  };
}

function isLocationStale(iso: string | null | undefined, maxSec = 300): boolean {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > maxSec * 1000;
}
