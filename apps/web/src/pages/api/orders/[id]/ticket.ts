import type { APIRoute } from 'astro';
import { getStore } from '../../../../server/db';
import { getOrderById } from '../../../../server/order-service';
import { buildPaymentQrForOrder } from '../../../../server/payment-qr';
import { formatEUR } from '../../../../server/format';

/** Datos del ticket con QR para cliente o impresión */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const order = await getOrderById(String(params.id));
  if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const store = getStore();
  const isAdmin = locals.user?.role === 'admin';
  const isOwner =
    locals.user &&
    (order.customer.user_id === locals.user.id || order.customer.email === locals.user.email);

  if (!isAdmin && !isOwner) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const invoice = order.invoice_id ? store.invoices.find((i) => i.id === order.invoice_id) : null;
  const payment = await buildPaymentQrForOrder(store, order, url.origin);

  return new Response(
    JSON.stringify({
      order: {
        id: order.id,
        number: order.number,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        total_cents: order.total_cents,
        subtotal_cents: order.subtotal_cents,
        delivery_fee_cents: order.delivery_fee_cents,
        created_at: order.created_at,
        customer: order.customer,
        items: order.items,
        delivery_address: order.delivery_address,
      },
      invoice: invoice
        ? {
            id: invoice.id,
            number: invoice.number,
            pdf_url: `/api/invoices/${invoice.id}.pdf`,
          }
        : null,
      payment,
      company: {
        trade_name: store.company.trade_name,
        phone: store.company.contact_phone,
        tax_id: store.company.tax_id,
      },
      printer: {
        enabled: store.settings.printer_enabled,
        name: store.settings.printer_name,
        paper_mm: store.settings.printer_paper_mm,
        auto_print: store.settings.auto_print_on_order,
      },
      formatted_total: formatEUR(order.total_cents),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
