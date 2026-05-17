import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { randomUUID } from 'node:crypto';
import type { Invoice } from '../../../server/types';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { order_id } = (await request.json()) as { order_id: string };
  const store = getStore();
  const order = store.orders.find((o) => o.id === order_id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const number = `${store.settings.invoice_prefix}-${new Date().getFullYear()}-${String(store.counters.invoice++).padStart(6, '0')}`;
  const invoice: Invoice = {
    id: randomUUID(),
    number,
    order_id: order.id,
    customer_name: order.customer.full_name,
    customer_tax_id: order.customer.tax_id ?? null,
    customer_address: order.delivery_address,
    lines: order.items.map((i) => ({
      description: i.dish_name,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents,
      vat_rate: 0.1,
      total_cents: i.unit_price_cents * i.quantity,
    })),
    subtotal_cents: order.subtotal_cents,
    vat_cents: order.vat_cents,
    total_cents: order.total_cents,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    issued_at: new Date().toISOString(),
  };
  store.invoices.unshift(invoice);
  order.invoice_id = invoice.id;

  store.notifications.unshift({
    id: randomUUID(),
    order_id: order.id,
    channel: 'email',
    kind: 'invoice_issued',
    recipient: order.customer.email,
    status: 'sent',
    created_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ invoice }));
};
