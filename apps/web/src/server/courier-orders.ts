import type { Order } from './types.js';
import type { SessionUser } from './auth.js';
import { pushAdminOrderAcceptedAlert, pushAdminOrderDeliveredAlert } from './admin-alerts.js';
import { getStore } from './db.js';
import { queueNotification } from './notification-service.js';

export async function acceptOrderForCourier(order: Order, courier: SessionUser, alreadyClaimed = false) {
  if (order.status !== 'delivering') {
    throw new Error('Solo se pueden aceptar pedidos en reparto.');
  }
  if (order.courier_id && order.courier_id !== courier.id) {
    throw new Error('Este pedido ya está asignado a otro repartidor.');
  }
  const firstAccept = alreadyClaimed || !order.courier_id;
  order.courier_id = courier.id;
  order.courier_name = courier.full_name;
  order.courier_accepted_at = new Date().toISOString();
  if (firstAccept) {
    await pushAdminOrderAcceptedAlert(order, courier.full_name);
  }
}

export async function completeOrderDelivery(order: Order, courier: SessionUser, alreadyCompleted = false) {
  if (!alreadyCompleted && order.status !== 'delivering') {
    throw new Error('El pedido no está en reparto.');
  }
  if (order.courier_id !== courier.id) {
    throw new Error('El pedido no está asignado a este repartidor.');
  }

  order.courier_id = courier.id;
  order.courier_name = courier.full_name;
  order.status = 'delivered';
  order.delivered_at = new Date().toISOString();

  await pushAdminOrderDeliveredAlert(order, courier.full_name);

  const store = getStore();
  if (store.settings.email_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'email',
      kind: 'order_delivered',
      recipient: order.customer.email,
    });
  }

  if (store.settings.whatsapp_notifications_enabled) {
    await queueNotification({
      orderId: order.id,
      channel: 'whatsapp',
      kind: 'order_delivered',
      recipient: order.customer.phone,
    });
  }
}
