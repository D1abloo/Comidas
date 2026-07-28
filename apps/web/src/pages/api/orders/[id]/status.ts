import type { APIRoute } from 'astro';
import { getOrderById, saveOrder } from '../../../../server/order-service';
import { createInvoiceForOrder, syncInvoicePaymentStatus } from '../../../../server/invoices';
import { getStore } from '../../../../server/db';
import { parseOrderStatus } from '../../../../server/security';
import { queueNotification } from '../../../../server/notification-service';

const ALLOWED_TRANSITIONS = {
  pending: new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['preparing', 'cancelled']),
  preparing: new Set(['delivering', 'cancelled']),
  delivering: new Set(['delivered', 'cancelled']),
  delivered: new Set<string>(),
  cancelled: new Set<string>(),
} as const;

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { status: rawStatus } = (await request.json().catch(() => ({}))) as { status?: string };
  const status = parseOrderStatus(rawStatus);
  if (!status) {
    return new Response(JSON.stringify({ error: 'invalid_status' }), { status: 400 });
  }
  const order = await getOrderById(String(params.id));
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  if (!ALLOWED_TRANSITIONS[order.status].has(status)) {
    return new Response(JSON.stringify({ error: 'invalid_status_transition' }), { status: 409 });
  }
  if (
    status === 'confirmed' &&
    order.payment_method !== 'cash' &&
    order.payment_status !== 'paid'
  ) {
    return new Response(JSON.stringify({ error: 'payment_required' }), { status: 409 });
  }

  order.status = status;
  if (status === 'delivered' && order.payment_method === 'cash') {
    order.payment_status = 'paid';
  }

  if (status === 'confirmed') {
    await createInvoiceForOrder(getStore(), order);
  }

  const store = getStore();
  if (store.settings.email_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'email',
      kind: `order_${status}`,
      recipient: order.customer.email,
    });
  }
  if (store.settings.whatsapp_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'whatsapp',
      kind: `order_${status}`,
      recipient: order.customer.phone,
    });
  }

  const saved = await saveOrder(order);
  await syncInvoicePaymentStatus(store, saved);
  return new Response(JSON.stringify({ order: saved }), { headers: { 'content-type': 'application/json' } });
};
