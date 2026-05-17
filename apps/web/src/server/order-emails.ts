import { randomUUID } from 'node:crypto';
import type { Dish, Order, Store } from './types.js';
import { getAppUrl } from './env.js';
import { buildOrderConfirmationEmail } from './email/order-confirmation.js';
import { sendEmail } from './email/send.js';
import { logNotificationToSupabase, persistOrderToSupabase } from './supabase-orders.js';
import { isSupabaseConfigured } from './env.js';

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

/**
 * Tras crear un pedido: persiste en Supabase (si está configurado) y envía email al cliente.
 * Preconfigurado vía variables de entorno — ver README.
 */
export async function onOrderCreated(store: Store, order: Order): Promise<void> {
  const deliveryEtaMin = estimateDeliveryMinutes(order, store.dishes);
  const companyName = store.company.trade_name || 'BocadO';

  if (isSupabaseConfigured()) {
    try {
      await persistOrderToSupabase(order, deliveryEtaMin);
    } catch (e) {
      console.error('[supabase] No se pudo guardar el pedido:', e);
    }
  }

  if (!store.settings.email_notifications_enabled) return;

  const content = buildOrderConfirmationEmail(order, {
    appUrl: getAppUrl(),
    deliveryEtaMin,
    companyName,
  });

  const eventId = randomUUID();
  const createdAt = new Date().toISOString();

  store.notifications.unshift({
    id: eventId,
    order_id: order.id,
    channel: 'email',
    kind: 'order_confirmation',
    recipient: order.customer.email,
    status: 'pending',
    created_at: createdAt,
  });

  const result = await sendEmail({
    to: order.customer.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  const notif = store.notifications.find((n) => n.id === eventId);
  if (notif) {
    notif.status = result.ok ? 'sent' : 'failed';
  }

  if (isSupabaseConfigured()) {
    try {
      await logNotificationToSupabase({
        id: eventId,
        order_id: order.id,
        channel: 'email',
        kind: 'order_confirmation',
        recipient: order.customer.email,
        status: result.ok ? 'sent' : 'failed',
        error_message: result.error,
        payload: { subject: content.subject, provider: result.provider },
        created_at: createdAt,
      });
    } catch (e) {
      console.error('[supabase] No se pudo registrar la notificación:', e);
    }
  }

  if (!result.ok) {
    console.warn('[email] No enviado:', result.error);
  }
}
