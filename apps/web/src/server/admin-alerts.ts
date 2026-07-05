import { randomUUID } from 'node:crypto';
import type { Order } from './types.js';
import { pushAlert } from './order-service.js';

export async function pushAdminNewOrderAlert(order: Order) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  await pushAlert({
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
}

export async function pushAdminBizumPaidAlert(order: Order) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  await pushAlert({
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
}

export async function pushAdminOrderDeliveredAlert(order: Order, courierName: string) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  await pushAlert({
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
}

export async function pushAdminOrderAcceptedAlert(order: Order, courierName: string) {
  const item_count = order.items.reduce((s, i) => s + i.quantity, 0);
  await pushAlert({
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
}
