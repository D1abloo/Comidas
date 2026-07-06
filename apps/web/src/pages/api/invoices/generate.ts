import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { createInvoiceForOrder } from '../../../server/invoices';
import { getOrderById } from '../../../server/order-service';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { order_id } = (await request.json()) as { order_id: string };
  const store = getStore();
  const order = await getOrderById(order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const invoice = createInvoiceForOrder(store, order);
  return new Response(JSON.stringify({ invoice }));
};
