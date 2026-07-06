export const TRACK_ORDER_KEY = 'bocado_track_order';
export const TRACK_TOKEN_KEY = 'bocado_track_token';
export const TRACK_DONE_KEY = 'bocado_track_done';
export const GUEST_ORDERS_KEY = 'bocado_guest_orders';

export type SavedGuestOrder = {
  id: string;
  number: string;
  accessToken: string;
  createdAt: string;
};

export function clearOrderTracking() {
  localStorage.removeItem(TRACK_ORDER_KEY);
  localStorage.removeItem(TRACK_TOKEN_KEY);
  localStorage.removeItem(TRACK_DONE_KEY);
}

export function saveOrderTracking(orderId: string, accessToken: string) {
  localStorage.setItem(TRACK_ORDER_KEY, orderId);
  localStorage.setItem(TRACK_TOKEN_KEY, accessToken);
}

export function getOrderTrackingToken(): string | null {
  return localStorage.getItem(TRACK_TOKEN_KEY);
}

export function loadGuestOrders(): SavedGuestOrder[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedGuestOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestOrder(entry: SavedGuestOrder) {
  const list = loadGuestOrders().filter((o) => o.id !== entry.id);
  list.unshift(entry);
  localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
}

export function markOrderDone(orderId: string) {
  localStorage.setItem(TRACK_DONE_KEY, orderId);
  localStorage.removeItem(TRACK_ORDER_KEY);
  localStorage.removeItem(TRACK_TOKEN_KEY);
}

export function isOrderAlreadyFinalized(orderId: string) {
  return localStorage.getItem(TRACK_DONE_KEY) === orderId;
}
