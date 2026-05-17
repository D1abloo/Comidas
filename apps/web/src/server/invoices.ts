import { randomUUID } from 'node:crypto';
import type { Invoice, Order } from './types.js';
import type { Store } from './db.js';

/** Crea factura PDF para un pedido si aún no existe (idempotente). */
export function createInvoiceForOrder(store: Store, order: Order): Invoice | null {
  if (order.invoice_id) {
    return store.invoices.find((i) => i.id === order.invoice_id) ?? null;
  }

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

  if (store.settings.email_notifications_enabled) {
    store.notifications.unshift({
      id: randomUUID(),
      order_id: order.id,
      channel: 'email',
      kind: 'invoice_issued',
      recipient: order.customer.email,
      status: 'sent',
      created_at: new Date().toISOString(),
    });
  }

  return invoice;
}
