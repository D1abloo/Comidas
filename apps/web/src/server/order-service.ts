import { getStore } from './db.js';
import { isDatabaseEnabled } from './env.js';
import type { AdminAlert, CourierLocation, Order } from './types.js';
import {
  pgCourierCompleted,
  pgCourierOrders,
  pgGetOrder,
  pgInsertAdminAlert,
  pgInsertOrder,
  pgListCourierLocations,
  pgListOrders,
  pgListUnseenAlerts,
  pgMarkAlertsSeen,
  pgNextOrderNumber,
  pgUpdateOrder,
  pgUpsertCourierLocation,
} from './orders-db.js';
import { persistOperationalState } from './store-persistence.js';
import { emitOrderEvent } from './order-events.js';

export async function listOrders(): Promise<Order[]> {
  if (isDatabaseEnabled()) return pgListOrders();
  return getStore().orders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (isDatabaseEnabled()) return pgGetOrder(id);
  return getStore().orders.find((o) => o.id === id) ?? null;
}

export async function nextOrderNumber(): Promise<string> {
  if (isDatabaseEnabled()) return pgNextOrderNumber();
  const store = getStore();
  return `BOC-${new Date().getFullYear()}-${String(store.counters.order++).padStart(6, '0')}`;
}

export async function saveOrder(order: Order): Promise<Order> {
  if (isDatabaseEnabled()) return pgUpdateOrder(order);
  const store = getStore();
  const idx = store.orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) store.orders[idx] = order;
  else store.orders.unshift(order);
  await persistOperationalState(store);
  emitOrderEvent({
    type: idx >= 0 ? 'order_updated' : 'order_created',
    order_id: order.id,
    status: order.status,
    courier_id: order.courier_id,
    courier_name: order.courier_name,
  });
  return order;
}

export async function createOrder(order: Order): Promise<Order> {
  if (isDatabaseEnabled()) return pgInsertOrder(order);
  const store = getStore();
  store.orders.unshift(order);
  await persistOperationalState(store);
  return order;
}

export async function courierOrderLists(courierId: string) {
  if (isDatabaseEnabled()) {
    const { available, mine } = await pgCourierOrders(courierId);
    const completed = await pgCourierCompleted(courierId);
    return { available, mine, completed };
  }
  const store = getStore();
  return {
    available: store.orders.filter((o) => o.status === 'delivering' && !o.courier_id),
    mine: store.orders.filter((o) => o.status === 'delivering' && o.courier_id === courierId),
    completed: store.orders
      .filter((o) => o.status === 'delivered' && o.courier_id === courierId)
      .sort((a, b) => (b.delivered_at ?? '').localeCompare(a.delivered_at ?? ''))
      .slice(0, 20),
  };
}

export async function listCourierLocations(): Promise<CourierLocation[]> {
  if (isDatabaseEnabled()) return pgListCourierLocations();
  return getStore().courier_locations ?? [];
}

export async function saveCourierLocation(loc: CourierLocation) {
  if (isDatabaseEnabled()) return pgUpsertCourierLocation(loc);
  const store = getStore();
  const idx = store.courier_locations.findIndex((l) => l.courier_id === loc.courier_id);
  if (idx >= 0) store.courier_locations[idx] = loc;
  else store.courier_locations.push(loc);
  await persistOperationalState(store);
}

export async function listUnseenAlerts(): Promise<AdminAlert[]> {
  if (isDatabaseEnabled()) return pgListUnseenAlerts();
  return getStore().admin_alerts.filter((a) => !a.seen);
}

export async function pushAlert(alert: AdminAlert) {
  if (isDatabaseEnabled()) return pgInsertAdminAlert(alert);
  const store = getStore();
  store.admin_alerts.unshift(alert);
  if (store.admin_alerts.length > 50) store.admin_alerts = store.admin_alerts.slice(0, 50);
  await persistOperationalState(store);
}

export async function markAlertsSeen(ids: string[]) {
  if (isDatabaseEnabled()) return pgMarkAlertsSeen(ids);
  const store = getStore();
  const set = new Set(ids);
  store.admin_alerts.forEach((a) => {
    if (set.has(a.id)) a.seen = true;
  });
  await persistOperationalState(store);
}
