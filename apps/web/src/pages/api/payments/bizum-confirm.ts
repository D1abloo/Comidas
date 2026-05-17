import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { pushAdminBizumPaidAlert } from '../../../server/admin-alerts';
import { getStore } from '../../../server/db';
import { createInvoiceForOrder } from '../../../server/invoices';

export const POST: APIRoute = async ({ request }) => {
  const { order_id } = (await request.json()) as { order_id: string };
  const store = getStore();
  const order = store.orders.find((o) => o.id === order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  if (order.payment_method !== 'bizum') {
    return new Response(JSON.stringify({ error: 'not_bizum' }), { status: 400 });
  }
  if (order.payment_status === 'paid') {
    return new Response(
      JSON.stringify({ ok: true, already_paid: true, redirect_url: `/checkout/ok?order=${order.id}` }),
      { headers: { 'content-type': 'application/json' } },
    );
  }

  order.payment_status = 'paid';
  order.status = 'confirmed';
  const invoice = createInvoiceForOrder(store, order);
  pushAdminBizumPaidAlert(store, order);

  store.notifications.unshift({
    id: randomUUID(),
    order_id: order.id,
    channel: 'email',
    kind: 'bizum_paid',
    recipient: store.company.contact_email,
    status: 'sent',
    created_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true, redirect_url: `/checkout/ok?order=${order.id}`, invoice_id: invoice?.id }), {
    headers: { 'content-type': 'application/json' },
  });
};
