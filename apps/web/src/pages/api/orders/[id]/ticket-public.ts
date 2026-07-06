import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { getOrderById } from '../../../../server/order-service';
import { buildPaymentQrForOrder } from '../../../../server/payment-qr';
import { formatEUR } from '../../../../server/format';
import { canAccessOrder, getAccessTokenFromRequest } from '../../../../server/security';

export const GET: APIRoute = async ({ params, request, locals, url }) => {
  const order = await getOrderById(String(params.id));
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  const token = getAccessTokenFromRequest(request);
  if (!canAccessOrder(order, locals.user, token)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  const store = getStore();
  const invoice = order.invoice_id ? store.invoices.find((i) => i.id === order.invoice_id) : null;
  const payment = await buildPaymentQrForOrder(store, order, url.origin);
  const pdfToken = token ? `?token=${encodeURIComponent(token)}` : '';

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
      invoice: invoice
        ? { number: invoice.number, pdf_url: `/api/invoices/${invoice.id}.pdf${pdfToken}` }
        : null,
      payment,
      company: { trade_name: store.company.trade_name, phone: store.company.contact_phone },
      formatted_total: formatEUR(order.total_cents),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
