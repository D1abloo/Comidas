import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { buildPaymentQrForOrder } from '../../../../server/payment-qr';
import { formatEUR } from '../../../../server/format';

/** Ticket y QR de pago para el cliente (enlace tras checkout). */
export const GET: APIRoute = async ({ params, url }) => {
  const store = getStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const invoice = order.invoice_id ? store.invoices.find((i) => i.id === order.invoice_id) : null;
  const payment = await buildPaymentQrForOrder(store, order, url.origin);

  return new Response(
    JSON.stringify({
      order: {
        number: order.number,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        total_cents: order.total_cents,
        subtotal_cents: order.subtotal_cents,
        delivery_fee_cents: order.delivery_fee_cents,
        items: order.items,
      },
      invoice: invoice ? { number: invoice.number, pdf_url: `/api/invoices/${invoice.id}.pdf` } : null,
      payment,
      company: { trade_name: store.company.trade_name, phone: store.company.contact_phone },
      formatted_total: formatEUR(order.total_cents),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
