import { getStore } from './db.js';
import { isDatabaseEnabled } from './env.js';
import type { AdminAlert, CourierLocation, Order } from './types.js';
import {
  pgCourierCompleted,
  pgCourierOrders,
  pgGetOrder,
  pgGetDashboardSnapshot,
  pgInsertAdminAlert,
  pgInsertOrder,
  pgDishSalesCounts,
  pgListCourierLocations,
  pgListOrders,
  pgListOrdersForUser,
  pgListUnseenAlerts,
  pgMarkAlertsSeen,
  pgNextOrderNumber,
  pgUpdateOrder,
  pgUpsertCourierLocation,
  type DashboardSnapshot,
} from './orders-db.js';
import { persistOperationalState } from './store-persistence.js';
import { emitOrderEvent } from './order-events.js';

export async function listOrders(): Promise<Order[]> {
  if (isDatabaseEnabled()) return pgListOrders();
  return getStore().orders;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (isDatabaseEnabled()) return pgGetDashboardSnapshot();

  const allOrders = getStore().orders;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const ordersToday = allOrders.filter((o) => new Date(o.created_at) >= today);
  const paidToday = ordersToday.filter((o) => o.payment_status === 'paid');
  const salesToday = paidToday.reduce((s, o) => s + o.total_cents, 0);
  const paidMonth = allOrders.filter(
    (o) => new Date(o.created_at) >= monthStart && o.payment_status === 'paid',
  );
  const salesMonth = paidMonth.reduce((s, o) => s + o.total_cents, 0);
  const activeStatuses = ['pending', 'confirmed', 'preparing', 'delivering'] as const;
  const pipeline = {
    pending: allOrders.filter((o) => o.status === 'pending').length,
    confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
    preparing: allOrders.filter((o) => o.status === 'preparing').length,
    delivering: allOrders.filter((o) => o.status === 'delivering').length,
  };
  const payments = { bizum: 0, tpv: 0, cash: 0 };
  for (const o of paidMonth) {
    if (o.payment_method === 'bizum') payments.bizum++;
    else if (o.payment_method === 'tpv') payments.tpv++;
    else if (o.payment_method === 'cash') payments.cash++;
  }
  const dishStats = new Map<string, { name: string; qty: number; revenue_cents: number }>();
  for (const o of allOrders) {
    if (o.status === 'cancelled') continue;
    for (const line of o.items) {
      const cur = dishStats.get(line.dish_id) ?? { name: line.dish_name, qty: 0, revenue_cents: 0 };
      cur.qty += line.quantity;
      cur.revenue_cents += line.unit_price_cents * line.quantity;
      dishStats.set(line.dish_id, cur);
    }
  }
  const series: DashboardSnapshot['series'] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - i);
    const next = new Date(dt);
    next.setDate(dt.getDate() + 1);
    const total = allOrders
      .filter((o) => new Date(o.created_at) >= dt && new Date(o.created_at) < next)
      .reduce((s, o) => s + o.total_cents, 0);
    series.push({
      d: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][dt.getDay()]!,
      total,
      label: dt.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      day: dt.toISOString().slice(0, 10),
    });
  }
  return {
    salesToday,
    salesMonth,
    ordersToday: ordersToday.length,
    activeOrders: allOrders.filter((o) => activeStatuses.includes(o.status as (typeof activeStatuses)[number])).length,
    avgTicket: paidToday.length ? Math.round(salesToday / paidToday.length) : 0,
    pendingBizum: allOrders.filter(
      (o) => o.payment_method === 'bizum' && o.payment_status === 'awaiting_confirmation',
    ).length,
    pipeline,
    payments,
    topDishes: [...dishStats.values()].sort((a, b) => b.qty - a.qty).slice(0, 6),
    series,
    recentOrders: [...allOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((o) => ({
        id: o.id,
        number: o.number,
        customer_name: o.customer.full_name,
        total_cents: o.total_cents,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at,
      })),
  };
}

export async function listOrdersForUser(userId: string, activeOnly = false): Promise<Order[]> {
  if (isDatabaseEnabled()) return pgListOrdersForUser(userId, activeOnly);
  return getStore().orders
    .filter((order) => order.customer.user_id === userId)
    .filter((order) => !activeOnly || (order.status !== 'delivered' && order.status !== 'cancelled'))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function dishSalesCounts(): Promise<Map<string, number>> {
  if (isDatabaseEnabled()) return pgDishSalesCounts();
  const counts = new Map<string, number>();
  for (const order of getStore().orders) {
    if (order.status === 'cancelled') continue;
    for (const line of order.items) {
      counts.set(line.dish_id, (counts.get(line.dish_id) ?? 0) + line.quantity);
    }
  }
  return counts;
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
  emitOrderEvent({ type: 'order_created', order_id: order.id, status: order.status });
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
