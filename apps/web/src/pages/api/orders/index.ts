import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { pushAdminNewOrderAlert } from '../../../server/admin-alerts';
import { onOrderCreated } from '../../../server/order-emails';
import { geocodeAddress } from '../../../server/geo';
import { createOrderAccessToken, createOrderPaymentToken } from '../../../server/order-tokens';
import { readOrderRequest } from '../../../server/order-input';
import { createOrder, getOrderById, listOrders, listOrdersForUser, nextOrderNumber, saveOrder } from '../../../server/order-service';
import type { Order } from '../../../server/types';
import { randomUUID } from 'node:crypto';
import { queueNotification } from '../../../server/notification-service';

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
  if (locals.user?.role === 'admin') {
    const allOrders = await listOrders();
    return new Response(JSON.stringify({ orders: allOrders }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (locals.user) {
    const orders = await listOrdersForUser(locals.user.id, url.searchParams.get('active') === '1');
    return new Response(JSON.stringify({ orders }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  let body;
  try {
    body = await readOrderRequest(request);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'invalid_order';
    return new Response(JSON.stringify({ error: code }), {
      status: code === 'payload_too_large' ? 413 : 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  const store = getStore();
  const paymentEnabled = {
    tpv: store.settings.tpv_enabled,
    cash: store.settings.cash_enabled,
    bizum: store.settings.bizum_enabled,
  }[body.payment_method];
  if (!paymentEnabled) {
    return new Response(JSON.stringify({ error: 'payment_method_disabled' }), { status: 400 });
  }

  const items: Order['items'] = [];
  let subtotal = 0;
  for (const it of body.items) {
    const qty = it.quantity;
    const dish = store.dishes.find((d) => d.id === it.dish_id);
    if (!dish || !dish.is_available) {
      return new Response(JSON.stringify({ error: `Plato no disponible: ${it.dish_id}` }), { status: 400 });
    }
    items.push({
      dish_id: dish.id,
      dish_name: dish.name,
      unit_price_cents: dish.price_cents,
      quantity: qty,
      vat_rate: dish.vat_rate,
    });
    subtotal += dish.price_cents * qty;
  }
  if (items.length === 0) return new Response(JSON.stringify({ error: 'Carrito vacío' }), { status: 400 });

  const fee = subtotal >= store.settings.free_delivery_from_cents ? 0 : store.settings.delivery_fee_cents;
  const vat =
    items.reduce(
      (sum, item) =>
        sum + Math.round((item.unit_price_cents * item.quantity * (item.vat_rate ?? 0.1)) / (1 + (item.vat_rate ?? 0.1))),
      0,
    ) + Math.round((fee * 0.1) / 1.1);
  const total = subtotal + fee;
  const number = await nextOrderNumber();

  const order: Order = {
    id: randomUUID(),
    number,
    customer: {
      user_id: locals.user?.id ?? null,
      ...body.customer,
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
    notes: body.notes,
    created_at: new Date().toISOString(),
  };

  await createOrder(order);
  await pushAdminNewOrderAlert(order);
  void attachDeliveryCoords(order.id);
  void onOrderCreated(store, order).catch(() => console.error('[order] No se pudo completar la notificación'));

  if (store.settings.whatsapp_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'whatsapp',
      kind: 'order_created',
      recipient: order.customer.phone,
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
