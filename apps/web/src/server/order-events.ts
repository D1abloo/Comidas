type OrderEventPayload = {
  type: 'order_updated' | 'order_created' | 'courier_location';
  order_id?: string;
  status?: string;
  courier_id?: string | null;
  courier_name?: string | null;
};

type Listener = (payload: OrderEventPayload) => void;

const listeners = new Set<Listener>();

export function subscribeOrderEvents(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitOrderEvent(payload: OrderEventPayload) {
  for (const listener of listeners) listener(payload);
}

export type { OrderEventPayload };
