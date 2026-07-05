import type { Order } from './types.js';
import type { SessionUser } from './auth.js';
import { pushAdminOrderAcceptedAlert, pushAdminOrderDeliveredAlert } from './admin-alerts.js';
import { randomUUID } from 'node:crypto';
import { getStore } from './db.js';

export function acceptOrderForCourier(order: Order, courier: SessionUser) {
  if (order.status !== 'delivering') {
    throw new Error('Solo se pueden aceptar pedidos en reparto.');
  }
  if (order.courier_id && order.courier_id !== courier.id) {
    throw new Error('Este pedido ya está asignado a otro repartidor.');
  }
  const firstAccept = !order.courier_id;
  order.courier_id = courier.id;
  order.courier_name = courier.full_name;
  order.courier_accepted_at = new Date().toISOString();
  if (firstAccept) {
    void pushAdminOrderAcceptedAlert(order, courier.full_name);
  }
}

export function completeOrderDelivery(order: Order, courier: SessionUser) {
  if (order.status !== 'delivering') {
    throw new Error('El pedido no está en reparto.');
  }
  if (order.courier_id && order.courier_id !== courier.id) {
    throw new Error('Este pedido está asignado a otro repartidor.');
  }

  order.courier_id = courier.id;
  order.courier_name = courier.full_name;
  order.status = 'delivered';
  order.delivered_at = new Date().toISOString();

  void pushAdminOrderDeliveredAlert(order, courier.full_name);

  const store = getStore();
  store.notifications.unshift({
    id: randomUUID(),
    order_id: order.id,
    channel: 'email',
    kind: 'order_delivered',
    recipient: order.customer.email,
    status: 'sent',
    created_at: new Date().toISOString(),
  });

  if (store.settings.whatsapp_notifications_enabled) {
    store.notifications.unshift({
      id: randomUUID(),
      order_id: order.id,
      channel: 'whatsapp',
      kind: 'order_delivered',
      recipient: order.customer.phone,
      status: 'sent',
      created_at: new Date().toISOString(),
    });
  }
}
