import type { Order, OrderLine, AdminAlert, CourierLocation, User } from './types.js';
import { isDatabaseEnabled } from './env.js';
import { pgQuery, withPgTransaction } from './pg.js';
import { emitOrderEvent } from './order-events.js';

type OrderRow = {
  id: string;
  number: string;
  customer: Order['customer'];
  delivery_address: Order['delivery_address'];
  subtotal_cents: number;
  delivery_fee_cents: number;
  vat_cents: number;
  total_cents: number;
  status: Order['status'];
  payment_method: Order['payment_method'];
  payment_status: Order['payment_status'];
  notes: string | null;
  invoice_id: string | null;
  courier_id: string | null;
  courier_name: string | null;
  courier_accepted_at: string | Date | null;
  delivered_at: string | Date | null;
  courier_lat: number | null;
  courier_lng: number | null;
  courier_location_at: string | Date | null;
  created_at: string | Date;
};

function isoTimestamp(value: string | Date): string;
function isoTimestamp(value: string | Date | null): string | null;
function isoTimestamp(value: string | Date | null): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToOrder(row: OrderRow, items: OrderLine[]): Order {
  return {
    id: row.id,
    number: row.number,
    customer: row.customer,
    delivery_address: row.delivery_address,
    items,
    subtotal_cents: row.subtotal_cents,
    delivery_fee_cents: row.delivery_fee_cents,
    vat_cents: row.vat_cents,
    total_cents: row.total_cents,
    status: row.status,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    notes: row.notes,
    invoice_id: row.invoice_id,
    courier_id: row.courier_id,
    courier_name: row.courier_name,
    courier_accepted_at: isoTimestamp(row.courier_accepted_at),
    delivered_at: isoTimestamp(row.delivered_at),
    courier_lat: row.courier_lat,
    courier_lng: row.courier_lng,
    courier_location_at: isoTimestamp(row.courier_location_at),
    created_at: isoTimestamp(row.created_at),
  };
}

async function fetchItemsForOrders(orderIds: string[]): Promise<Map<string, OrderLine[]>> {
  if (!orderIds.length) return new Map();
  const { rows } = await pgQuery<{
    order_id: string;
    dish_id: string;
    dish_name: string;
    unit_price_cents: number;
    quantity: number;
    vat_rate: number | null;
    notes: string | null;
  }>(
    `SELECT order_id, dish_id, dish_name, unit_price_cents, quantity, vat_rate, notes
     FROM order_items WHERE order_id = ANY($1::uuid[])`,
    [orderIds],
  );
  const map = new Map<string, OrderLine[]>();
  for (const r of rows) {
    const list = map.get(r.order_id) ?? [];
    list.push({
      dish_id: r.dish_id,
      dish_name: r.dish_name,
      unit_price_cents: r.unit_price_cents,
      quantity: r.quantity,
      vat_rate: r.vat_rate ?? 0.1,
      notes: r.notes,
    });
    map.set(r.order_id, list);
  }
  return map;
}

async function hydrateOrders(rows: OrderRow[]): Promise<Order[]> {
  const itemsMap = await fetchItemsForOrders(rows.map((r) => r.id));
  return rows.map((r) => rowToOrder(r, itemsMap.get(r.id) ?? []));
}

export async function pgListOrders(): Promise<Order[]> {
  const { rows } = await pgQuery<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC');
  return hydrateOrders(rows);
}

export async function pgListOrdersForUser(userId: string, activeOnly = false): Promise<Order[]> {
  const { rows } = await pgQuery<OrderRow>(
    `SELECT * FROM orders
     WHERE customer->>'user_id' = $1
       AND ($2::boolean = false OR status NOT IN ('delivered', 'cancelled'))
     ORDER BY created_at DESC`,
    [userId, activeOnly],
  );
  return hydrateOrders(rows);
}

export async function pgDishSalesCounts(): Promise<Map<string, number>> {
  const { rows } = await pgQuery<{ dish_id: string; sold_count: string }>(
    `SELECT oi.dish_id, SUM(oi.quantity)::text AS sold_count
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelled'
     GROUP BY oi.dish_id`,
  );
  return new Map(rows.map((row) => [row.dish_id, Number(row.sold_count)]));
}

export async function pgGetOrder(id: string): Promise<Order | null> {
  const { rows } = await pgQuery<OrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  if (!rows[0]) return null;
  const itemsMap = await fetchItemsForOrders([id]);
  return rowToOrder(rows[0], itemsMap.get(id) ?? []);
}

export async function pgNextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { rows } = await pgQuery<{ last_number: number }>(
    `INSERT INTO order_counters (year, last_number) VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE SET last_number = order_counters.last_number + 1
     RETURNING last_number`,
    [year],
  );
  const n = rows[0]?.last_number ?? 1;
  return `BOC-${year}-${String(n).padStart(6, '0')}`;
}

export async function pgInsertOrder(order: Order): Promise<Order> {
  await withPgTransaction(async (client) => {
    await client.query(
      `INSERT INTO orders (
        id, number, customer, delivery_address, subtotal_cents, delivery_fee_cents, vat_cents,
        total_cents, status, payment_method, payment_status, notes, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        order.id,
        order.number,
        JSON.stringify(order.customer),
        JSON.stringify(order.delivery_address),
        order.subtotal_cents,
        order.delivery_fee_cents,
        order.vat_cents,
        order.total_cents,
        order.status,
        order.payment_method,
        order.payment_status,
        order.notes ?? null,
        order.created_at,
      ],
    );
    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (order_id, dish_id, dish_name, unit_price_cents, quantity, vat_rate, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          order.id,
          item.dish_id,
          item.dish_name,
          item.unit_price_cents,
          item.quantity,
          item.vat_rate ?? 0.1,
          item.notes ?? null,
        ],
      );
    }
  });
  await pgNotifyOrder(order.id, order.status, order.courier_id ?? null, order.courier_name ?? null);
  emitOrderEvent({ type: 'order_created', order_id: order.id, status: order.status });
  return order;
}

export async function pgUpdateOrder(order: Order): Promise<Order> {
  await pgQuery(
    `UPDATE orders SET
      status = $2, payment_status = $3, notes = $4, invoice_id = $5,
      courier_id = $6, courier_name = $7, courier_accepted_at = $8, delivered_at = $9,
      courier_lat = $10, courier_lng = $11, courier_location_at = $12,
      delivery_address = $13, updated_at = NOW()
     WHERE id = $1`,
    [
      order.id,
      order.status,
      order.payment_status,
      order.notes ?? null,
      order.invoice_id ?? null,
      order.courier_id ?? null,
      order.courier_name ?? null,
      order.courier_accepted_at ?? null,
      order.delivered_at ?? null,
      order.courier_lat ?? null,
      order.courier_lng ?? null,
      order.courier_location_at ?? null,
      JSON.stringify(order.delivery_address),
    ],
  );
  await pgNotifyOrder(order.id, order.status, order.courier_id ?? null, order.courier_name ?? null);
  emitOrderEvent({
    type: 'order_updated',
    order_id: order.id,
    status: order.status,
    courier_id: order.courier_id,
    courier_name: order.courier_name,
  });
  return order;
}

export async function pgClaimOrderForCourier(
  orderId: string,
  courierId: string,
  courierName: string,
): Promise<Order | null> {
  const acceptedAt = new Date().toISOString();
  const { rowCount } = await pgQuery(
    `UPDATE orders
     SET courier_id = $2, courier_name = $3, courier_accepted_at = $4, updated_at = NOW()
     WHERE id = $1 AND status = 'delivering' AND courier_id IS NULL`,
    [orderId, courierId, courierName, acceptedAt],
  );
  if (rowCount !== 1) return null;
  const order = await pgGetOrder(orderId);
  if (order) await pgNotifyOrder(order.id, order.status, courierId, courierName);
  return order;
}

export async function pgCompleteOrderForCourier(
  orderId: string,
  courierId: string,
): Promise<Order | null> {
  const deliveredAt = new Date().toISOString();
  const { rowCount } = await pgQuery(
    `UPDATE orders
     SET status = 'delivered',
         payment_status = CASE WHEN payment_method = 'cash' THEN 'paid' ELSE payment_status END,
         delivered_at = $3,
         updated_at = NOW()
     WHERE id = $1 AND status = 'delivering' AND courier_id = $2`,
    [orderId, courierId, deliveredAt],
  );
  if (rowCount !== 1) return null;
  const order = await pgGetOrder(orderId);
  if (order) await pgNotifyOrder(order.id, order.status, order.courier_id ?? null, order.courier_name ?? null);
  return order;
}

async function pgNotifyOrder(
  orderId: string,
  status: string,
  courierId: string | null,
  courierName: string | null,
) {
  if (!isDatabaseEnabled()) return;
  const payload = JSON.stringify({
    type: 'order_updated',
    order_id: orderId,
    status,
    courier_id: courierId,
    courier_name: courierName,
  });
  await pgQuery('SELECT pg_notify($1, $2)', ['order_updates', payload]);
}

export async function pgCourierOrders(courierId: string) {
  const { rows } = await pgQuery<OrderRow>(
    `SELECT * FROM orders
     WHERE status = 'delivering' AND (courier_id IS NULL OR courier_id = $1)
     ORDER BY created_at DESC`,
    [courierId],
  );
  const all = await hydrateOrders(rows);
  return {
    available: all.filter((o) => !o.courier_id),
    mine: all.filter((o) => o.courier_id === courierId),
  };
}

export async function pgCourierCompleted(courierId: string, limit = 20): Promise<Order[]> {
  const { rows } = await pgQuery<OrderRow>(
    `SELECT * FROM orders
     WHERE status = 'delivered' AND courier_id = $1
     ORDER BY delivered_at DESC NULLS LAST
     LIMIT $2`,
    [courierId, limit],
  );
  return hydrateOrders(rows);
}

export async function pgUpsertCourierLocation(loc: CourierLocation) {
  await pgQuery(
    `INSERT INTO courier_locations (courier_id, courier_name, lat, lng, accuracy_m, active_order_id, active_order_number, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (courier_id) DO UPDATE SET
       courier_name = EXCLUDED.courier_name,
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       accuracy_m = EXCLUDED.accuracy_m,
       active_order_id = EXCLUDED.active_order_id,
       active_order_number = EXCLUDED.active_order_number,
       updated_at = EXCLUDED.updated_at`,
    [
      loc.courier_id,
      loc.courier_name,
      loc.lat,
      loc.lng,
      loc.accuracy_m ?? null,
      loc.active_order_id ?? null,
      loc.active_order_number ?? null,
      loc.updated_at,
    ],
  );
  emitOrderEvent({ type: 'courier_location', order_id: loc.active_order_id ?? undefined });
}

export async function pgListCourierLocations(): Promise<CourierLocation[]> {
  const { rows } = await pgQuery<CourierLocation & { updated_at: string | Date }>(
    'SELECT * FROM courier_locations ORDER BY updated_at DESC',
  );
  return rows.map((row) => ({ ...row, updated_at: isoTimestamp(row.updated_at) }));
}

export async function pgInsertAdminAlert(alert: AdminAlert) {
  await pgQuery(
    `INSERT INTO admin_alerts (id, kind, order_id, order_number, customer_name, total_cents, item_count, seen, courier_name, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO NOTHING`,
    [
      alert.id,
      alert.kind ?? 'new_order',
      alert.order_id,
      alert.order_number,
      alert.customer_name,
      alert.total_cents,
      alert.item_count,
      alert.seen,
      alert.courier_name ?? null,
      alert.created_at,
    ],
  );
}

export async function pgListUnseenAlerts(): Promise<AdminAlert[]> {
  const { rows } = await pgQuery<AdminAlert & { created_at: string | Date }>(
    'SELECT * FROM admin_alerts WHERE seen = false ORDER BY created_at DESC LIMIT 50',
  );
  return rows.map((row) => ({ ...row, created_at: isoTimestamp(row.created_at) }));
}

export async function pgMarkAlertsSeen(ids: string[]) {
  if (!ids.length) return;
  await pgQuery('UPDATE admin_alerts SET seen = true WHERE id = ANY($1::uuid[])', [ids]);
}

export async function pgFindUserByEmail(email: string) {
  const { rows } = await pgQuery<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    phone: string | null;
    tax_id: string | null;
    password_hash: string;
    created_at: string | Date;
  }>('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  return rows[0] ? { ...rows[0], created_at: isoTimestamp(rows[0].created_at) } : null;
}

export async function pgFindUserById(id: string) {
  const { rows } = await pgQuery<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    phone: string | null;
  }>('SELECT id, email, full_name, role, phone FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function pgInsertUser(user: User): Promise<User> {
  await pgQuery(
    `INSERT INTO users (id, email, full_name, role, phone, tax_id, password_hash, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      user.id,
      user.email,
      user.full_name,
      user.role,
      user.phone ?? null,
      user.tax_id ?? null,
      user.password_hash,
      user.created_at,
    ],
  );
  return user;
}

export async function pgListUsers(): Promise<User[]> {
  const { rows } = await pgQuery<User & { created_at: string | Date }>(
    `SELECT id, email, full_name, role, phone, tax_id, password_hash, created_at
     FROM users ORDER BY created_at DESC`,
  );
  return rows.map((row) => ({ ...row, created_at: isoTimestamp(row.created_at) }));
}

export async function pgUpdateUserRole(id: string, role: User['role']): Promise<User | null> {
  const { rows } = await pgQuery<User & { created_at: string | Date }>(
    `UPDATE users SET role = $2 WHERE id = $1
     RETURNING id, email, full_name, role, phone, tax_id, password_hash, created_at`,
    [id, role],
  );
  return rows[0] ? { ...rows[0], created_at: isoTimestamp(rows[0].created_at) } : null;
}

export async function pgDeleteUser(id: string): Promise<boolean> {
  const { rowCount } = await pgQuery('DELETE FROM users WHERE id = $1', [id]);
  return rowCount === 1;
}
