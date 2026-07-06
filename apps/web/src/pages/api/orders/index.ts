import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { pushAdminNewOrderAlert } from '../../../server/admin-alerts';
import { onOrderCreated } from '../../../server/order-emails';
import { geocodeAddress } from '../../../server/geo';
import { createOrderAccessToken, createOrderPaymentToken } from '../../../server/order-tokens';
import { parsePaymentMethod } from '../../../server/security';
import { createOrder, getOrderById, listOrders, nextOrderNumber, saveOrder } from '../../../server/order-service';
import type { Order } from '../../../server/types';
import { randomUUID } from 'node:crypto';

async function attachDeliveryCoords(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order || (order.delivery_address.lat != null && order.delivery_address.lng != null)) return;
  const coords = await geocodeAddress(order.delivery_address);
  if (coords) {
    order.delivery_address.lat = coords.lat;
    order.delivery_address.lng = coords.lng;
    await saveOrder(order);
  }
}

export const GET: APIRoute = async ({ locals, url }) => {
  const allOrders = await listOrders();

  if (locals.user?.role === 'admin') {
    return new Response(JSON.stringify({ orders: allOrders }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (locals.user) {
    let orders = allOrders.filter(
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

  return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json()) as any;
  const store = getStore();
  const paymentMethod = parsePaymentMethod(body.payment_method);
  if (!paymentMethod) {
    return new Response(JSON.stringify({ error: 'invalid_payment_method' }), { status: 400 });
  }

  const items: Order['items'] = [];
  let subtotal = 0;
  for (const it of body.items ?? []) {
    const qty = Number(it.quantity);
    if (!Number.isFinite(qty) || qty < 1 || qty > 99 || !Number.isInteger(qty)) {
      return new Response(JSON.stringify({ error: 'invalid_quantity' }), { status: 400 });
    }
    const dish = store.dishes.find((d) => d.id === it.dish_id);
    if (!dish || !dish.is_available) {
      return new Response(JSON.stringify({ error: `Plato no disponible: ${it.dish_id}` }), { status: 400 });
    }
    items.push({
      dish_id: dish.id,
      dish_name: dish.name,
      unit_price_cents: dish.price_cents,
      quantity: qty,
    });
    subtotal += dish.price_cents * qty;
  }
  if (items.length === 0) return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });

  const vat = Math.round(subtotal * 0.1);
  const fee = subtotal >= store.settings.free_delivery_from_cents ? 0 : store.settings.delivery_fee_cents;
  const total = subtotal + fee;
  const number = await nextOrderNumber();

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
    payment_method: paymentMethod,
    payment_status: 'pending',
    notes: body.notes ?? null,
    created_at: new Date().toISOString(),
  };

  await createOrder(order);
  await pushAdminNewOrderAlert(order);
  void attachDeliveryCoords(order.id);
  void onOrderCreated(store, order).catch((err) => console.error('[order] post-create:', err));

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

  return new Response(JSON.stringify({
    order,
    payment_token: createOrderPaymentToken(order.id),
    access_token: createOrderAccessToken(order.id),
  }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
};
