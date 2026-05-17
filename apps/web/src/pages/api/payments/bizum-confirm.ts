import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';

export const POST: APIRoute = async ({ request }) => {
  const { order_id } = (await request.json()) as { order_id: string };
  const store = getStore();
  const order = store.orders.find((o) => o.id === order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  order.payment_status = 'paid';
  order.status = 'confirmed';
  return new Response(JSON.stringify({ ok: true, redirect_url: `/checkout/ok?order=${order.id}` }), {
    headers: { 'content-type': 'application/json' },
  });
};
