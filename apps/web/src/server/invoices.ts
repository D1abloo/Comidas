import { randomUUID } from 'node:crypto';
import type { Invoice, Order } from './types.js';
import type { Store } from './db.js';
import { isDatabaseEnabled } from './env.js';
import { pgCreateInvoice, pgGetInvoice, pgListInvoices } from './invoices-db.js';
import { persistOperationalState } from './store-persistence.js';
import { queueNotification } from './notification-service.js';

/** Crea factura PDF para un pedido si aún no existe (idempotente). */
export async function createInvoiceForOrder(store: Store, order: Order): Promise<Invoice | null> {
  if (order.invoice_id) {
    return getInvoiceById(store, order.invoice_id);
  }

  const lines = order.items.map((item) => {
    const vatRate = item.vat_rate ?? 0.1;
    const gross = item.unit_price_cents * item.quantity;
    const vatCents = Math.round((gross * vatRate) / (1 + vatRate));
    return {
      description: item.dish_name,
      quantity: item.quantity,
      unit_price_cents: Math.round(item.unit_price_cents / (1 + vatRate)),
      vat_rate: vatRate,
      vat_cents: vatCents,
      total_cents: gross - vatCents,
    };
  });
  if (order.delivery_fee_cents > 0) {
    const vatCents = Math.round((order.delivery_fee_cents * 0.1) / 1.1);
    lines.push({
      description: 'Servicio de entrega',
      quantity: 1,
      unit_price_cents: order.delivery_fee_cents - vatCents,
      vat_rate: 0.1,
      vat_cents: vatCents,
      total_cents: order.delivery_fee_cents - vatCents,
    });
  }
  const vatCents = lines.reduce((sum, line) => sum + (line.vat_cents ?? 0), 0);
  const taxBaseCents = order.total_cents - vatCents;
  const draft: Omit<Invoice, 'id' | 'number' | 'issued_at'> = {
    order_id: order.id,
    order_number: order.number,
    customer_name: order.customer.full_name,
    customer_tax_id: order.customer.tax_id ?? null,
    customer_address: order.delivery_address,
    lines,
    subtotal_cents: taxBaseCents,
    vat_cents: vatCents,
    total_cents: order.total_cents,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  };
  if (isDatabaseEnabled()) {
    const invoice = await pgCreateInvoice(draft, store.settings.invoice_prefix);
    order.invoice_id = invoice.id;
    if (store.settings.email_notifications_enabled) {
      await queueNotification({
        orderId: order.id,
        channel: 'email',
        kind: 'invoice_issued',
        recipient: order.customer.email,
      });
    }
    return invoice;
  }

  const invoice: Invoice = {
    ...draft,
    id: randomUUID(),
    number: `${store.settings.invoice_prefix}-${new Date().getFullYear()}-${String(store.counters.invoice++).padStart(6, '0')}`,
    issued_at: new Date().toISOString(),
  };

  store.invoices.unshift(invoice);
  order.invoice_id = invoice.id;

  if (store.settings.email_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'email',
      kind: 'invoice_issued',
      recipient: order.customer.email,
    });
  }

  await persistOperationalState(store);
  return invoice;
}

export async function getInvoiceById(store: Store, id: string): Promise<Invoice | null> {
  if (isDatabaseEnabled()) return pgGetInvoice(id);
  return store.invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function listInvoices(store: Store): Promise<Invoice[]> {
  if (isDatabaseEnabled()) return pgListInvoices();
  return store.invoices;
}
