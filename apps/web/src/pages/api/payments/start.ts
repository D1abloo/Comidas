import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { generateBizumQR } from '../../../server/bizum';

export const POST: APIRoute = async ({ request }) => {
  const { order_id } = (await request.json()) as { order_id: string };
  const store = getStore();
  const order = store.orders.find((o) => o.id === order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  if (order.payment_method === 'cash') {
    order.payment_status = 'pending';
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

  // TPV simulado: en demo lo marcamos como pagado directamente.
  order.payment_status = 'paid';
  order.status = 'confirmed';
  return new Response(JSON.stringify({
    method: 'tpv',
    order_id: order.id,
    simulated: true,
    redirect_url: `/checkout/ok?order=${order.id}`,
  }), { headers: { 'content-type': 'application/json' } });
};
