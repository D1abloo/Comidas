import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { createInvoiceForOrder } from '../../../server/invoices';
import { getOrderById } from '../../../server/order-service';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { order_id } = (await request.json().catch(() => ({}))) as { order_id?: string };
  if (!order_id) return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400 });
  const store = getStore();
  const order = await getOrderById(order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const invoice = await createInvoiceForOrder(store, order);
  return new Response(JSON.stringify({ invoice }));
};
