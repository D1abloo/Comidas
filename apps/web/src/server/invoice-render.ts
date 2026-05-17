import type { Invoice, Order } from './types.js';
import type { Store } from './db.js';
import { renderInvoicePDF, type InvoicePdfPaymentBlock } from './invoice-pdf.js';
import { buildPaymentQrForOrder, paymentQrToPngBytes } from './payment-qr.js';

export async function renderInvoicePdfForStore(
  store: Store,
  invoice: Invoice,
  origin: string,
  order?: Order | null,
): Promise<Uint8Array> {
  const ord = order ?? store.orders.find((o) => o.id === invoice.order_id) ?? null;
  let paymentBlock: InvoicePdfPaymentBlock | null = null;

  if (ord && invoice.payment_status !== 'paid') {
    const qr = await buildPaymentQrForOrder(store, ord, origin);
    if (qr.kind === 'bizum') {
      paymentBlock = {
        qrPng: paymentQrToPngBytes(qr.dataUrl),
        title: 'PAGO BIZUM — ESCANEA EL QR',
        lines: [
          `Pedido: ${ord.number}`,
          `Importe: ${qr.amount} €`,
          `Teléfono: ${qr.phone}`,
          `Concepto: ${qr.concept}`,
          `Ticket online: ${qr.ticketUrl}`,
        ],
      };
    } else if (qr.kind === 'ticket') {
      paymentBlock = {
        qrPng: paymentQrToPngBytes(qr.dataUrl),
        title: 'TICKET DE PAGO — ESCANEA EL QR',
        lines: [`Pedido: ${ord.number}`, `Total: ${(ord.total_cents / 100).toFixed(2)} €`, `Abre: ${qr.ticketUrl}`],
      };
    }
  }

  return renderInvoicePDF(invoice, store.company, paymentBlock);
}
