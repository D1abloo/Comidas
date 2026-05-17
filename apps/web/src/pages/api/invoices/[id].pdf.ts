import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { renderInvoicePdfForStore } from '../../../server/invoice-render';

export const GET: APIRoute = async ({ params, url }) => {
  const store = getStore();
  const invoice = store.invoices.find((i) => i.id === params.id);
  if (!invoice) return new Response('Not found', { status: 404 });
  const order = store.orders.find((o) => o.id === invoice.order_id);
  const origin = url.origin;
  const pdf = await renderInvoicePdfForStore(store, invoice, origin, order);
  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${invoice.number}.pdf"`,
    },
  });
};
