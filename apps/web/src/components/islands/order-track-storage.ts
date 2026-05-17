export const TRACK_ORDER_KEY = 'bocado_track_order';
export const TRACK_DONE_KEY = 'bocado_track_done';

export function clearOrderTracking() {
  localStorage.removeItem(TRACK_ORDER_KEY);
  localStorage.removeItem(TRACK_DONE_KEY);
}

export function markOrderDone(orderId: string) {
  localStorage.setItem(TRACK_DONE_KEY, orderId);
  localStorage.removeItem(TRACK_ORDER_KEY);
}

export function isOrderAlreadyFinalized(orderId: string) {
  return localStorage.getItem(TRACK_DONE_KEY) === orderId;
}
