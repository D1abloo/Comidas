import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';

/** Seguimiento público de un pedido por ID (demo). */
export const GET: APIRoute = async ({ params }) => {
  const store = getStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  return new Response(
    JSON.stringify({
      order: {
        id: order.id,
        number: order.number,
        status: order.status,
        payment_status: order.payment_status,
        total_cents: order.total_cents,
        created_at: order.created_at,
        invoice_id: order.invoice_id,
        items: order.items.map((i) => ({ dish_name: i.dish_name, quantity: i.quantity })),
      },
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
