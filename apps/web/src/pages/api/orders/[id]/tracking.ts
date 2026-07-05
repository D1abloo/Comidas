import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { buildCustomerTracking } from '../../../../server/order-tracking';

/** Seguimiento en vivo para el cliente (demo: por ID de pedido). */
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
        created_at: order.created_at,
        items: order.items.map((i) => ({ dish_name: i.dish_name, quantity: i.quantity })),
      },
      tracking: buildCustomerTracking(order),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
