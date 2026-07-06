import type { APIRoute } from 'astro';
import { getOrderById, saveOrder } from '../../../../server/order-service';
import { createInvoiceForOrder } from '../../../../server/invoices';
import { getStore } from '../../../../server/db';
import { parseOrderStatus } from '../../../../server/security';
import { randomUUID } from 'node:crypto';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { status: rawStatus } = (await request.json()) as { status: string };
  const status = parseOrderStatus(rawStatus);
  if (!status) {
    return new Response(JSON.stringify({ error: 'invalid_status' }), { status: 400 });
  }
  const order = await getOrderById(String(params.id));
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  order.status = status;

  if (status === 'confirmed') {
    createInvoiceForOrder(getStore(), order);
  }

  const store = getStore();
  store.notifications.unshift({
    id: randomUUID(),
    order_id: order.id,
    channel: 'email',
    kind: `order_${status}`,
    recipient: order.customer.email,
    status: 'sent',
    created_at: new Date().toISOString(),
  });
  if (store.settings.whatsapp_notifications_enabled) {
    store.notifications.unshift({
      id: randomUUID(),
      order_id: order.id,
      channel: 'whatsapp',
      kind: `order_${status}`,
      recipient: order.customer.phone,
      status: 'sent',
      created_at: new Date().toISOString(),
    });
  }

  const saved = await saveOrder(order);
  return new Response(JSON.stringify({ order: saved }), { headers: { 'content-type': 'application/json' } });
};
