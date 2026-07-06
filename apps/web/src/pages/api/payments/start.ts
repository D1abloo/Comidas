import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { generateBizumQR } from '../../../server/bizum';
import { createInvoiceForOrder } from '../../../server/invoices';
import { verifyOrderPaymentToken } from '../../../server/order-tokens';
import { getOrderById, saveOrder } from '../../../server/order-service';

export const POST: APIRoute = async ({ request }) => {
  const { order_id, payment_token } = (await request.json()) as {
    order_id: string;
    payment_token?: string;
  };
  if (!verifyOrderPaymentToken(order_id, payment_token)) {
    return new Response(JSON.stringify({ error: 'invalid_payment_token' }), { status: 403 });
  }

  const order = await getOrderById(order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  const store = getStore();

  if (order.payment_method === 'cash') {
    order.payment_status = 'pending';
    await saveOrder(order);
    return new Response(JSON.stringify({
      method: 'cash',
      message: `Tenga preparados ${(order.total_cents / 100).toFixed(2)} € en efectivo cuando llegue el repartidor.`,
      order_id: order.id,
    }), { headers: { 'content-type': 'application/json' } });
  }

  if (order.payment_method === 'bizum') {
    const phone = store.settings.bizum_phone;
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Bizum no configurado en la empresa' }), { status: 400 });
    }
    const concept = (store.settings.bizum_concept_template ?? 'BocadO {{order_number}}')
      .replace('{{order_number}}', order.number);
    const qr = await generateBizumQR({ phone, amount_cents: order.total_cents, concept });
    order.payment_status = 'awaiting_confirmation';
    await saveOrder(order);
    return new Response(JSON.stringify({
      method: 'bizum',
      order_id: order.id,
      phone: qr.phone,
      amount: qr.amount,
      concept,
      qr_data_url: qr.dataUrl,
      qr_payload: qr.payload,
    }), { headers: { 'content-type': 'application/json' } });
  }

  order.payment_status = 'paid';
  order.status = 'confirmed';
  const invoice = createInvoiceForOrder(store, order);
  await saveOrder(order);
  return new Response(JSON.stringify({
    method: 'tpv',
    order_id: order.id,
    simulated: true,
    invoice_id: invoice?.id,
    redirect_url: `/checkout/ok?order=${order.id}`,
  }), { headers: { 'content-type': 'application/json' } });
};
