import type { Dish, Order } from './types.js';
import type { Store } from './db.js';
import { getAppUrl } from './env.js';
import { buildOrderConfirmationEmail } from './email/order-confirmation.js';
import { sendEmail } from './email/send.js';
import { createOrderAccessToken } from './order-tokens.js';
import { queueNotification, setNotificationResult } from './notification-service.js';

const PREP_BUFFER_MIN = 8;

/** Tiempo estimado de entrega según platos del pedido. */
export function estimateDeliveryMinutes(order: Order, dishes: Dish[]): number {
  let maxDish = 25;
  for (const line of order.items) {
    const d = dishes.find((x) => x.id === line.dish_id);
    if (d?.delivery_time_min) maxDish = Math.max(maxDish, d.delivery_time_min);
  }
  return maxDish + PREP_BUFFER_MIN;
}

/** Tras crear un pedido: envía email al cliente si está habilitado. */
export async function onOrderCreated(store: Store, order: Order): Promise<void> {
  const deliveryEtaMin = estimateDeliveryMinutes(order, store.dishes);
  const companyName = store.company.trade_name || 'BocadO';

  if (!store.settings.email_notifications_enabled) return;

  const content = buildOrderConfirmationEmail(order, {
    appUrl: getAppUrl(),
    deliveryEtaMin,
    companyName,
    accessToken: createOrderAccessToken(order.id),
  });

  const event = await queueNotification({
    orderId: order.id,
    channel: 'email',
    kind: 'order_confirmation',
    recipient: order.customer.email,
    deliver: false,
  });

  const result = await sendEmail({
    to: order.customer.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  await setNotificationResult(event.id, result.ok ? 'sent' : 'failed', result.error);

  if (!result.ok) {
    console.warn('[email] No se pudo enviar la notificación');
  }
}
