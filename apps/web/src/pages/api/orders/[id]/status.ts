import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { randomUUID } from 'node:crypto';

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { status } = (await request.json()) as { status: string };
  const store = getStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  order.status = status as any;

  // generar aviso
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
  return new Response(JSON.stringify({ order }), { headers: { 'content-type': 'application/json' } });
};
