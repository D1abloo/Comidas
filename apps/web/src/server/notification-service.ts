import { randomUUID } from 'node:crypto';
import { getStore } from './db.js';
import { isDatabaseEnabled } from './env.js';
import { pgInsertNotification, pgUpdateNotification } from './notifications-db.js';
import { persistOperationalState } from './store-persistence.js';
import type { NotificationEvent } from './types.js';
import { getOrderById } from './order-service.js';
import { sendEmail } from './email/send.js';
import { getAppUrl } from './env.js';
import { createOrderAccessToken } from './order-tokens.js';

export async function queueNotification(input: {
  orderId: string;
  channel: NotificationEvent['channel'];
  kind: string;
  recipient: string;
  deliver?: boolean;
}): Promise<NotificationEvent> {
  const event: NotificationEvent = {
    id: randomUUID(),
    order_id: input.orderId,
    channel: input.channel,
    kind: input.kind,
    recipient: input.recipient,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  if (isDatabaseEnabled()) {
    await pgInsertNotification(event);
  } else {
    const store = getStore();
    store.notifications.unshift(event);
    await persistOperationalState(store);
  }
  if (input.channel === 'email' && input.deliver !== false) {
    const order = await getOrderById(input.orderId);
    if (!order) {
      await setNotificationResult(event.id, 'failed', 'order_not_found');
      return event;
    }
    const status = notificationLabel(input.kind);
    const trackUrl = `${getAppUrl()}/pedido/ticket?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(createOrderAccessToken(order.id))}`;
    const result = await sendEmail({
      to: input.recipient,
      subject: `BocadO — ${status} · ${order.number}`,
      text: `Tu pedido ${order.number}: ${status}.\n\nConsulta el estado y el ticket: ${trackUrl}`,
      html: `<p>Tu pedido <strong>${escapeHtml(order.number)}</strong>: ${escapeHtml(status)}.</p><p><a href="${trackUrl}">Consultar estado y ticket</a></p>`,
    });
    await setNotificationResult(event.id, result.ok ? 'sent' : 'failed', result.error);
    event.status = result.ok ? 'sent' : 'failed';
    event.error_message = result.error;
  }
  return event;
}

function notificationLabel(kind: string): string {
  const labels: Record<string, string> = {
    order_confirmed: 'Pedido confirmado',
    order_preparing: 'Pedido en preparación',
    order_delivering: 'Pedido en reparto',
    order_delivered: 'Pedido entregado',
    order_cancelled: 'Pedido cancelado',
    invoice_issued: 'Factura emitida',
    payment_received: 'Pago recibido',
  };
  return labels[kind] ?? 'Actualización de pedido';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function setNotificationResult(
  id: string,
  status: Extract<NotificationEvent['status'], 'sent' | 'failed'>,
  errorMessage?: string,
): Promise<void> {
  const safeError = errorMessage?.slice(0, 500);
  if (isDatabaseEnabled()) {
    await pgUpdateNotification(id, status, safeError);
    return;
  }
  const store = getStore();
  const event = store.notifications.find((item) => item.id === id);
  if (event) {
    event.status = status;
    event.error_message = safeError;
  }
  await persistOperationalState(store);
}
