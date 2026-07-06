import type { APIRoute } from 'astro';
import { getOrderById } from '../../../../server/order-service';
import { buildCustomerTracking } from '../../../../server/order-tracking';
import { canAccessOrder, getAccessTokenFromRequest } from '../../../../server/security';

export const GET: APIRoute = async ({ params, request, locals }) => {
  const order = await getOrderById(String(params.id));
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  const token = getAccessTokenFromRequest(request);
  if (!canAccessOrder(order, locals.user, token)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

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
