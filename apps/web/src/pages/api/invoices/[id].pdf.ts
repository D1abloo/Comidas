import type { APIRoute } from 'astro';
import { getStore } from '../../../server/db';
import { renderInvoicePDF } from '../../../server/invoice-pdf';

export const GET: APIRoute = async ({ params }) => {
  const store = getStore();
  const invoice = store.invoices.find((i) => i.id === params.id);
  if (!invoice) return new Response('Not found', { status: 404 });
  const pdf = await renderInvoicePDF(invoice, store.company);
  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${invoice.number}.pdf"`,
    },
  });
};
