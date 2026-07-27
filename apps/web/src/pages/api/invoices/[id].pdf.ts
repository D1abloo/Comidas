import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { getOrderById } from '../../../server/order-service';
import { renderInvoicePdfForStore } from '../../../server/invoice-render';
import { canAccessOrder, getAccessTokenFromRequest } from '../../../server/security';
import { getInvoiceById } from '../../../server/invoices';

export const GET: APIRoute = async ({ params, url, request, locals }) => {
  const store = getStore();
  const invoice = params.id ? await getInvoiceById(store, params.id) : null;
  if (!invoice) return new Response('Not found', { status: 404 });

  const order = await getOrderById(invoice.order_id);
  if (!order) return new Response('Not found', { status: 404 });

  const token = getAccessTokenFromRequest(request);
  if (!canAccessOrder(order, locals.user, token)) {
    return new Response('Forbidden', { status: 403 });
  }

  const origin = url.origin;
  const pdf = await renderInvoicePdfForStore(store, invoice, origin, order);
  return new Response(pdf.slice().buffer as ArrayBuffer, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${invoice.number}.pdf"`,
    },
  });
};
