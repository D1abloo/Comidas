import { randomUUID } from 'node:crypto';
import type { Order } from './types.js';
import type { Store } from './db.js';

export function pushAdminNewOrderAlert(store: Store, order: Order) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  store.admin_alerts.unshift({
    id: randomUUID(),
    kind: 'new_order',
    order_id: order.id,
    order_number: order.number,
    customer_name: order.customer.full_name,
    total_cents: order.total_cents,
    item_count,
    seen: false,
    created_at: order.created_at,
  });
  if (store.admin_alerts.length > 50) {
    store.admin_alerts = store.admin_alerts.slice(0, 50);
  }
}

export function pushAdminBizumPaidAlert(store: Store, order: Order) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  store.admin_alerts.unshift({
    id: randomUUID(),
    kind: 'bizum_paid',
    order_id: order.id,
    order_number: order.number,
    customer_name: order.customer.full_name,
    total_cents: order.total_cents,
    item_count,
    seen: false,
    created_at: new Date().toISOString(),
  });
  if (store.admin_alerts.length > 50) {
    store.admin_alerts = store.admin_alerts.slice(0, 50);
  }
}

export function pushAdminOrderDeliveredAlert(store: Store, order: Order, courierName: string) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  store.admin_alerts.unshift({
    id: randomUUID(),
    kind: 'order_delivered',
    order_id: order.id,
    order_number: order.number,
    customer_name: order.customer.full_name,
    total_cents: order.total_cents,
    item_count,
    seen: false,
    courier_name: courierName,
    created_at: new Date().toISOString(),
  });
  if (store.admin_alerts.length > 50) {
    store.admin_alerts = store.admin_alerts.slice(0, 50);
  }
}

export function pushAdminOrderAcceptedAlert(store: Store, order: Order, courierName: string) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  store.admin_alerts.unshift({
    id: randomUUID(),
    kind: 'order_accepted',
    order_id: order.id,
    order_number: order.number,
    customer_name: order.customer.full_name,
    total_cents: order.total_cents,
    item_count,
    seen: false,
    courier_name: courierName,
    created_at: new Date().toISOString(),
  });
  if (store.admin_alerts.length > 50) {
    store.admin_alerts = store.admin_alerts.slice(0, 50);
  }
}
