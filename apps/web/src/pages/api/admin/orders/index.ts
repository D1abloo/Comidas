import type { APIRoute } from 'astro';
import { listOrders } from '../../../../server/order-service';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const orders = await listOrders();
  return new Response(JSON.stringify({ orders }), {
    headers: { 'content-type': 'application/json' },
  });
};
