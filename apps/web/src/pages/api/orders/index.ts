import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { pushAdminNewOrderAlert } from '../../../server/admin-alerts';
import type { Order } from '../../../server/types';
import { randomUUID } from 'node:crypto';

export const GET: APIRoute = async ({ locals, url }) => {
  const store = getStore();
  const email = url.searchParams.get('email')?.trim().toLowerCase();

  if (locals.user?.role === 'admin') {
    return new Response(JSON.stringify({ orders: store.orders }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (locals.user) {
    let orders = store.orders.filter(
      (o) =>
        o.customer.user_id === locals.user!.id ||
        o.customer.email.toLowerCase() === locals.user!.email.toLowerCase(),
    );
    if (url.searchParams.get('active') === '1') {
      orders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
    }
    return new Response(JSON.stringify({ orders }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (email) {
    const orders = store.orders.filter((o) => o.customer.email.toLowerCase() === email);
    return new Response(JSON.stringify({ orders }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json()) as any;
  const store = getStore();

  const items: Order['items'] = [];
  let subtotal = 0;
  for (const it of body.items ?? []) {
    const dish = store.dishes.find((d) => d.id === it.dish_id);
    if (!dish || !dish.is_available) {
      return new Response(JSON.stringify({ error: `Plato no disponible: ${it.dish_id}` }), { status: 400 });
    }
    items.push({
      dish_id: dish.id,
      dish_name: dish.name,
      unit_price_cents: dish.price_cents,
      quantity: it.quantity,
    });
    subtotal += dish.price_cents * it.quantity;
  }
  if (items.length === 0) return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });

  const vat = Math.round(subtotal * 0.1);
  const fee = subtotal >= store.settings.free_delivery_from_cents ? 0 : store.settings.delivery_fee_cents;
  const total = subtotal + fee;

  const number = `BOC-${new Date().getFullYear()}-${String(store.counters.order++).padStart(6, '0')}`;
  const order: Order = {
    id: randomUUID(),
    number,
    customer: {
      user_id: locals.user?.id ?? null,
      full_name: body.customer.full_name,
      email: body.customer.email,
      phone: body.customer.phone,
      tax_id: body.customer.tax_id ?? null,
    },
    delivery_address: body.delivery_address,
    items,
    subtotal_cents: subtotal,
    delivery_fee_cents: fee,
    vat_cents: vat,
    total_cents: total,
    status: 'pending',
    payment_method: body.payment_method,
    payment_status: 'pending',
    notes: body.notes ?? null,
    created_at: new Date().toISOString(),
  };
  store.orders.unshift(order);
  pushAdminNewOrderAlert(store, order);

  // Demo: encolar aviso "pedido recibido"
  store.notifications.unshift({
    id: randomUUID(),
    order_id: order.id,
    channel: 'email',
    kind: 'order_created',
    recipient: order.customer.email,
    status: 'sent',
    created_at: new Date().toISOString(),
  });
  if (store.settings.whatsapp_notifications_enabled) {
    store.notifications.unshift({
      id: randomUUID(),
      order_id: order.id,
      channel: 'whatsapp',
      kind: 'order_created',
      recipient: order.customer.phone,
      status: 'sent',
      created_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ order }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
};
