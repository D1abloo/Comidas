import type { APIRoute } from 'astro';
import { pushAdminBizumPaidAlert } from '../../../server/admin-alerts';
import { getStore } from '../../../server/db';
import { createInvoiceForOrder } from '../../../server/invoices';
import { verifyOrderPaymentToken } from '../../../server/order-tokens';
import { getOrderById, saveOrder } from '../../../server/order-service';
import { areManualBizumPaymentsEnabled } from '../../../server/env';
import { queueNotification } from '../../../server/notification-service';

export const POST: APIRoute = async ({ request, locals }) => {
  const { order_id, payment_token } = (await request.json().catch(() => ({}))) as {
    order_id: string;
    payment_token?: string;
  };
  if (typeof order_id !== 'string') {
    return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400 });
  }
  if (!areManualBizumPaymentsEnabled()) {
    return new Response(JSON.stringify({ error: 'payment_provider_unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
  const isAdmin = locals.user?.role === 'admin';
  const isLocalSimulation = verifyOrderPaymentToken(order_id, payment_token);
  if (!isAdmin && !isLocalSimulation) {
    return new Response(JSON.stringify({ error: 'confirmation_not_authorized' }), { status: 403 });
  }

  const order = await getOrderById(order_id);
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
  const store = getStore();
  const invoice = await createInvoiceForOrder(store, order);
  await pushAdminBizumPaidAlert(order);
  await saveOrder(order);

  if (store.settings.email_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'email',
      kind: 'bizum_paid',
      recipient: store.company.contact_email,
    });
  }

  return new Response(JSON.stringify({ ok: true, redirect_url: `/checkout/ok?order=${order.id}`, invoice_id: invoice?.id }), {
    headers: { 'content-type': 'application/json' },
  });
};
