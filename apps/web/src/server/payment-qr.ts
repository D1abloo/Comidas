import QRCode from 'qrcode';
import type { Order } from './types.js';
import type { Store } from './db.js';
import { generateBizumQR } from './bizum.js';

export type PaymentQrResult =
  | { kind: 'paid' }
  | {
      kind: 'bizum';
      dataUrl: string;
      payload: string;
      phone: string;
      amount: string;
      concept: string;
      ticketUrl: string;
    }
  | { kind: 'ticket'; dataUrl: string; payload: string; ticketUrl: string };

export function ticketUrlForOrder(origin: string, orderId: string) {
  const base = origin.replace(/\/$/, '');
  return `${base}/pedido/ticket?order=${orderId}`;
}

export async function buildPaymentQrForOrder(
  store: Store,
  order: Order,
  origin: string,
): Promise<PaymentQrResult> {
  const ticketUrl = ticketUrlForOrder(origin, order.id);

  if (order.payment_status === 'paid') {
    return { kind: 'paid' };
  }

  if (order.payment_method === 'bizum' && store.settings.bizum_phone) {
    const concept = store.settings.bizum_concept_template.replace('{{order_number}}', order.number);
    const qr = await generateBizumQR({
      phone: store.settings.bizum_phone,
      amount_cents: order.total_cents,
      concept,
    });
    return {
      kind: 'bizum',
      dataUrl: qr.dataUrl,
      payload: qr.payload,
      phone: qr.phone,
      amount: qr.amount,
      concept,
      ticketUrl,
    };
  }

  const dataUrl = await QRCode.toDataURL(ticketUrl, {
    margin: 1,
    width: 400,
    errorCorrectionLevel: 'M',
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
  return { kind: 'ticket', dataUrl, payload: ticketUrl, ticketUrl };
}

export function paymentQrToPngBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
