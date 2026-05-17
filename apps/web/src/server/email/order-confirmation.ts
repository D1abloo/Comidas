import type { Address, Order } from '../types.js';
import { formatEUR } from '../format.js';

export interface OrderEmailContent {
  subject: string;
  html: string;
  text: string;
}

function formatAddress(a: Address): string {
  const floor = a.floor ? `, ${a.floor}` : '';
  const notes = a.notes ? `\nNotas: ${a.notes}` : '';
  return `${a.street} ${a.number}${floor}\n${a.postal_code} ${a.city}, ${a.country}${notes}`;
}

export function buildOrderConfirmationEmail(
  order: Order,
  opts: { appUrl: string; deliveryEtaMin: number; companyName: string },
): OrderEmailContent {
  const ticketUrl = `${opts.appUrl}/pedido/ticket?order=${order.id}`;
  const trackUrl = `${opts.appUrl}/pedidos`;
  const linesHtml = order.items
    .map(
      (l) =>
        `<tr><td style="padding:6px 0">${l.quantity}× ${l.dish_name}</td><td style="text-align:right;padding:6px 0">${formatEUR(l.unit_price_cents * l.quantity)}</td></tr>`,
    )
    .join('');
  const linesText = order.items
    .map((l) => `  ${l.quantity}× ${l.dish_name} — ${formatEUR(l.unit_price_cents * l.quantity)}`)
    .join('\n');

  const subject = `${opts.companyName} — Pedido ${order.number} recibido`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 8px">¡Pedido confirmado!</h1>
  <p style="color:#555;margin:0 0 20px">Hola <strong>${order.customer.full_name}</strong>, hemos recibido tu pedido <strong>${order.number}</strong>.</p>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#666">Tu ticket</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${linesHtml}</table>
  <p style="margin:4px 0">Subtotal: ${formatEUR(order.subtotal_cents)}</p>
  <p style="margin:4px 0">Envío: ${formatEUR(order.delivery_fee_cents)}</p>
  <p style="margin:4px 0">IVA: ${formatEUR(order.vat_cents)}</p>
  <p style="margin:12px 0 20px;font-size:18px"><strong>Total: ${formatEUR(order.total_cents)}</strong></p>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#666">Entrega estimada</h2>
  <p style="margin:0 0 16px">Aproximadamente <strong>${opts.deliveryEtaMin} minutos</strong> (puede variar según cocina y tráfico).</p>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#666">Dirección de entrega</h2>
  <p style="margin:0 0 20px;white-space:pre-line">${formatAddress(order.delivery_address)}</p>

  <p style="margin:0 0 12px">Método de pago: <strong>${paymentLabel(order.payment_method)}</strong> · Estado: <strong>${paymentStatusLabel(order.payment_status)}</strong></p>

  <p style="margin:24px 0">
    <a href="${ticketUrl}" style="display:inline-block;background:#D6FF3D;color:#0a0a0a;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Ver ticket y pagar</a>
    &nbsp;
    <a href="${trackUrl}" style="color:#111">Seguir pedido</a>
  </p>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#888">${opts.companyName} · Este correo es informativo. Si no hiciste este pedido, contacta con nosotros.</p>
</body>
</html>`;

  const text = `¡Pedido confirmado!

Hola ${order.customer.full_name},

Pedido: ${order.number}
${opts.companyName}

—— Tu ticket ——
${linesText}

Subtotal: ${formatEUR(order.subtotal_cents)}
Envío: ${formatEUR(order.delivery_fee_cents)}
IVA: ${formatEUR(order.vat_cents)}
TOTAL: ${formatEUR(order.total_cents)}

Entrega estimada: ~${opts.deliveryEtaMin} minutos

Dirección:
${formatAddress(order.delivery_address)}

Pago: ${paymentLabel(order.payment_method)} (${paymentStatusLabel(order.payment_status)})

Ticket / pago: ${ticketUrl}
Seguir pedido: ${trackUrl}
`;

  return { subject, html, text };
}

function paymentLabel(m: Order['payment_method']): string {
  if (m === 'bizum') return 'Bizum';
  if (m === 'cash') return 'Efectivo';
  return 'Tarjeta (TPV)';
}

function paymentStatusLabel(s: Order['payment_status']): string {
  if (s === 'paid') return 'Pagado';
  if (s === 'awaiting_confirmation') return 'Pendiente de confirmación';
  if (s === 'failed') return 'Fallido';
  return 'Pendiente';
}
