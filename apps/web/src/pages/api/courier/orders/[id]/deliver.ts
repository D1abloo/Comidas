import type { APIRoute } from 'astro';
import { getOrderById, saveOrder } from '../../../../../server/order-service';
import { completeOrderDelivery } from '../../../../../server/courier-orders';

export const PATCH: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'courier') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const order = await getOrderById(String(params.id));
  if (!order) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }

  try {
    completeOrderDelivery(order, locals.user);
    const saved = await saveOrder(order);
    return new Response(JSON.stringify({ order: saved }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'No se pudo completar la entrega';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};
