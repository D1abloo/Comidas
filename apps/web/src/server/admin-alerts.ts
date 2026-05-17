import { randomUUID } from 'node:crypto';
import type { Order } from './types.js';
import type { Store } from './db.js';

export function pushAdminNewOrderAlert(store: Store, order: Order) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  store.admin_alerts.unshift({
    id: randomUUID(),
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
